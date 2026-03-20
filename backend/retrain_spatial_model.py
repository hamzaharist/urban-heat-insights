"""
Retrain Spatial RF Model with State-Based Cross-Validation.

Instead of a random 80/20 split (which leaks spatial autocorrelation),
we hold out entire states as test sets so the model is evaluated on
geography it has never seen during training.
"""
import json
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
from sklearn.model_selection import GroupKFold, RandomizedSearchCV
import os
from dotenv import load_dotenv
from supabase import create_client
import time

load_dotenv()

MODELS_DIR = Path(__file__).parent / "models"
FEATURES   = ["NDVI", "NDBI", "Elevation", "Population"]
TARGET     = "LST"

# ── Supabase ─────────────────────────────────────────────────────────────────
url = os.getenv("VITE_SUPABASE_URL") or os.getenv("SUPABASE_URL")
key = os.getenv("VITE_SUPABASE_ANON_KEY") or os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_SERVICE_KEY")
supabase = create_client(url, key)

print("\n" + "=" * 70)
print("  SPATIAL RF — RETRAIN WITH STATE-BASED CV")
print("=" * 70)

# ── Fetch data ────────────────────────────────────────────────────────────────
print("\nFetching data from Supabase...")
all_rows, offset = [], 0
while True:
    resp = supabase.table("hotspots").select(
        "avg_ndvi, avg_ndbi, elevation, population, avg_temperature, state_name"
    ).range(offset, offset + 999).execute()
    batch = resp.data
    if not batch:
        break
    all_rows.extend(batch)
    offset += 1000
    if len(batch) < 1000:
        break

df = pd.DataFrame(all_rows).rename(columns={
    "avg_ndvi": "NDVI", "avg_ndbi": "NDBI",
    "elevation": "Elevation", "population": "Population",
    "avg_temperature": "LST"
})
df = df.dropna(subset=FEATURES + [TARGET, "state_name"])
print(f"  {len(df):,} records across {df['state_name'].nunique()} states")
print(f"  States: {sorted(df['state_name'].unique())}")

X      = df[FEATURES].values
y      = df[TARGET].values
groups = df["state_name"].values

# ── State-based cross-validation (leave-2-states-out, 5 folds) ───────────────
print("\n" + "-" * 70)
print("State-based GroupKFold CV (5 folds — each fold holds out ~2-3 states)")
print("-" * 70)

gkf = GroupKFold(n_splits=5)

fold_r2, fold_mae, fold_rmse = [], [], []

# Use current best params from metadata as a starting point
best_params = {
    "n_estimators": 200,
    "max_depth": 20,
    "min_samples_split": 5,
    "min_samples_leaf": 2,
    "max_features": "sqrt",
    "bootstrap": True,       # enable bootstrap so OOB is available
    "oob_score": True,
    "n_jobs": -1,
    "random_state": 42,
}

print(f"\nHyperparameters used: {best_params}\n")

for fold, (train_idx, test_idx) in enumerate(gkf.split(X, y, groups), 1):
    held_out = sorted(set(groups[test_idx]))
    X_tr, y_tr = X[train_idx], y[train_idx]
    X_te, y_te = X[test_idx],  y[test_idx]

    model = RandomForestRegressor(**best_params)
    model.fit(X_tr, y_tr)
    y_pred = model.predict(X_te)

    r2   = r2_score(y_te, y_pred)
    mae  = mean_absolute_error(y_te, y_pred)
    rmse = np.sqrt(mean_squared_error(y_te, y_pred))
    fold_r2.append(r2); fold_mae.append(mae); fold_rmse.append(rmse)

    print(f"  Fold {fold} | held-out: {held_out}")
    print(f"           | n_test={len(y_te):>5}  R²={r2:.4f}  MAE={mae:.4f}°C  RMSE={rmse:.4f}°C")

print()
print(f"  CV R²   : {np.mean(fold_r2):.4f} ± {np.std(fold_r2):.4f}")
print(f"  CV MAE  : {np.mean(fold_mae):.4f} ± {np.std(fold_mae):.4f} °C")
print(f"  CV RMSE : {np.mean(fold_rmse):.4f} ± {np.std(fold_rmse):.4f} °C")

# ── Train final model on ALL data ─────────────────────────────────────────────
print("\n" + "-" * 70)
print("Training final model on full dataset...")
t0 = time.time()
final_model = RandomForestRegressor(**best_params)
final_model.fit(X, y)
elapsed = time.time() - t0
print(f"  Done in {elapsed:.1f}s")
print(f"  OOB R² (in-bag estimate): {final_model.oob_score_:.4f}")

# Feature importances
fi = dict(zip(FEATURES, final_model.feature_importances_))
print("\n  Feature Importance:")
for feat, imp in sorted(fi.items(), key=lambda x: -x[1]):
    bar = "#" * int(imp * 40)
    print(f"    {feat:<12} {bar}  {imp*100:.1f}%")

# ── Save model + updated metadata ────────────────────────────────────────────
print("\n" + "-" * 70)
print("Saving retrained model...")

model_path = MODELS_DIR / "uhi_rf_model_tuned.pkl"
joblib.dump(final_model, model_path)
print(f"  Saved: {model_path}")

metadata = {
    "model_type": "RandomForestRegressor",
    "training_strategy": "state_based_groupkfold_cv",
    "best_params": {k: v for k, v in best_params.items()
                    if k not in ("n_jobs", "random_state", "oob_score")},
    "features": FEATURES,
    "training_samples": len(X),
    "n_states": int(df['state_name'].nunique()),
    "cv_folds": 5,
    "cv_r2_mean": float(np.mean(fold_r2)),
    "cv_r2_std":  float(np.std(fold_r2)),
    "cv_mae_mean": float(np.mean(fold_mae)),
    "cv_rmse_mean": float(np.mean(fold_rmse)),
    "oob_r2": float(final_model.oob_score_),
    "feature_importance": [
        {"Feature": k, "Importance": float(v)}
        for k, v in sorted(fi.items(), key=lambda x: -x[1])
    ],
    # keep old keys so existing code doesn't break
    "tuned_r2":   float(np.mean(fold_r2)),
    "tuned_rmse": float(np.mean(fold_rmse)),
    "baseline_r2":   0.9167,
    "baseline_rmse": 1.6458,
    "test_samples": int(len(X) * 0.2),  # approximate for display
}

with open(MODELS_DIR / "model_metadata.json", "w") as f:
    json.dump(metadata, f, indent=2)
print(f"  Saved: {MODELS_DIR / 'model_metadata.json'}")

# ── Final summary ─────────────────────────────────────────────────────────────
print("\n" + "=" * 70)
print("  SUMMARY")
print("=" * 70)
print(f"  Old model (random split)  R²: 0.9415  RMSE: 1.38 deg C  [optimistic]")
print(f"  New model (state-based CV) R²: {np.mean(fold_r2):.4f}  RMSE: {np.mean(fold_rmse):.4f} deg C  [honest]")
print(f"  OOB R² (full dataset)      : {final_model.oob_score_:.4f}")
print("=" * 70 + "\n")
