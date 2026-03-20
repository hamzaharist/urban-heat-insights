"""
Live Model Evaluation — fetches current Supabase hotspot data (unseen at training time)
and evaluates both production models against real ground-truth temperatures.
"""
import pickle
import json
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

MODELS_DIR = Path(__file__).parent / "models"

# ── Supabase connection ──────────────────────────────────────────────────────
url = os.getenv("VITE_SUPABASE_URL") or os.getenv("SUPABASE_URL")
key = os.getenv("VITE_SUPABASE_ANON_KEY") or os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_SERVICE_KEY")

if not url or not key:
    raise ValueError("Supabase credentials missing from .env")

supabase = create_client(url, key)

print("\n" + "=" * 70)
print("  LIVE EVALUATION ON UNSEEN SUPABASE DATA")
print("=" * 70)

# ── Fetch data ───────────────────────────────────────────────────────────────
print("\nFetching hotspot records from Supabase...")

# Fetch in batches (Supabase default limit is 1000)
all_rows = []
batch_size = 1000
offset = 0
while True:
    resp = supabase.table("hotspots").select(
        "avg_ndvi, avg_ndbi, elevation, population, latitude, longitude, avg_temperature, state_name"
    ).range(offset, offset + batch_size - 1).execute()
    batch = resp.data
    if not batch:
        break
    all_rows.extend(batch)
    offset += batch_size
    if len(batch) < batch_size:
        break

df = pd.DataFrame(all_rows)
print(f"  Fetched {len(df):,} records")

# Drop rows missing critical fields
df = df.dropna(subset=["avg_ndvi", "avg_ndbi", "elevation", "population",
                        "latitude", "longitude", "avg_temperature"])
print(f"  After dropping nulls: {len(df):,} usable records")

# ── 1. SPATIAL RF MODEL ──────────────────────────────────────────────────────
print("\n" + "=" * 70)
print("[1] SPATIAL RF MODEL — Live Evaluation")
print("-" * 70)

rf_model = joblib.load(MODELS_DIR / "uhi_rf_model_tuned.pkl")

# The RF model was trained on [NDVI, NDBI, Elevation, Population]
rf_features = ["avg_ndvi", "avg_ndbi", "elevation", "population"]
X_rf = df[rf_features].rename(columns={
    "avg_ndvi": "NDVI", "avg_ndbi": "NDBI",
    "elevation": "Elevation", "population": "Population"
})
y_true = df["avg_temperature"]

y_pred_rf = rf_model.predict(X_rf)

rf_r2   = r2_score(y_true, y_pred_rf)
rf_mae  = mean_absolute_error(y_true, y_pred_rf)
rf_rmse = np.sqrt(mean_squared_error(y_true, y_pred_rf))
residuals = y_true - y_pred_rf

print(f"  Samples evaluated : {len(y_true):,}")
print(f"  R²                : {rf_r2:.4f}")
print(f"  MAE               : {rf_mae:.4f} deg C")
print(f"  RMSE              : {rf_rmse:.4f} deg C")
print(f"  Max over-predict  : {residuals.min():.2f} deg C")
print(f"  Max under-predict : {residuals.max():.2f} deg C")
print(f"  Residual std      : {residuals.std():.4f} deg C")

# Compare vs stored training metrics
with open(MODELS_DIR / "model_metadata.json") as f:
    meta = json.load(f)
print(f"\n  vs stored training metrics:")
print(f"    Training R²  : {meta['tuned_r2']:.4f}  |  Live R²  : {rf_r2:.4f}  |  diff: {rf_r2 - meta['tuned_r2']:+.4f}")
print(f"    Training RMSE: {meta['tuned_rmse']:.4f} |  Live RMSE: {rf_rmse:.4f} |  diff: {rf_rmse - meta['tuned_rmse']:+.4f}")

# Per-state breakdown
print("\n  Per-state R² breakdown:")
df["rf_pred"] = y_pred_rf
for state, grp in df.groupby("state_name"):
    if len(grp) < 10:
        continue
    state_r2  = r2_score(grp["avg_temperature"], grp["rf_pred"])
    state_mae = mean_absolute_error(grp["avg_temperature"], grp["rf_pred"])
    flag = "  " if state_r2 >= 0.85 else "<<"
    print(f"    {flag} {state:<35} n={len(grp):>5}  R²={state_r2:.3f}  MAE={state_mae:.3f}°C")

# ── 2. TIME-SERIES MODEL ─────────────────────────────────────────────────────
print("\n" + "=" * 70)
print("[2] TIME-SERIES MODEL — Live Evaluation (year=0, no future projection)")
print("-" * 70)

with open(MODELS_DIR / "timeseries_temperature_model.pkl", "rb") as f:
    ts_bundle = pickle.load(f)

ts_model  = ts_bundle["model"]
feat_cols = ts_bundle["feature_cols"]

# Evaluate at baseline (years_from_baseline=0, climate_offset=0)
X_ts = df[["avg_ndvi", "avg_ndbi", "elevation", "population", "latitude", "longitude"]].copy()
X_ts["years_from_baseline"] = 0
X_ts["climate_offset"]      = 0.0
X_ts = X_ts[feat_cols]

y_pred_ts = ts_model.predict(X_ts)

ts_r2   = r2_score(y_true, y_pred_ts)
ts_mae  = mean_absolute_error(y_true, y_pred_ts)
ts_rmse = np.sqrt(mean_squared_error(y_true, y_pred_ts))

print(f"  Samples evaluated : {len(y_true):,}")
print(f"  R²                : {ts_r2:.4f}")
print(f"  MAE               : {ts_mae:.4f} deg C")
print(f"  RMSE              : {ts_rmse:.4f} deg C")

stored_r2  = ts_bundle["r2_score"]
stored_mae = ts_bundle["test_mae"]
print(f"\n  vs stored training metrics:")
print(f"    Training R²  : {stored_r2:.4f}  |  Live R²  : {ts_r2:.4f}  |  diff: {ts_r2 - stored_r2:+.4f}")
print(f"    Training MAE : {stored_mae:.4f} |  Live MAE : {ts_mae:.4f} |  diff: {ts_mae - stored_mae:+.4f}")

# ── Final summary ─────────────────────────────────────────────────────────────
print("\n" + "=" * 70)
print("  SUMMARY  (live unseen data)")
print("=" * 70)
print(f"  {'Model':<25} {'R²':>8} {'MAE (deg C)':>12} {'RMSE (deg C)':>13}")
print(f"  {'-'*25} {'-'*8} {'-'*12} {'-'*13}")
print(f"  {'Spatial RF (tuned)':<25} {rf_r2:>8.4f} {rf_mae:>12.4f} {rf_rmse:>13.4f}")
print(f"  {'Time-Series CatBoost':<25} {ts_r2:>8.4f} {ts_mae:>12.4f} {ts_rmse:>13.4f}")
print("=" * 70)
if rf_r2 > 0.9:
    print("  Spatial RF: Excellent generalization on live data.")
elif rf_r2 > 0.8:
    print("  Spatial RF: Good generalization on live data.")
else:
    print("  Spatial RF: Degraded — consider retraining.")
print()
