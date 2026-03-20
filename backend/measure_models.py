"""
Model Measurements — loads both production models and reports metrics/info.
No Supabase connection required (uses stored metadata and model internals).
"""
import pickle
import json
import joblib
import numpy as np
from pathlib import Path

MODELS_DIR = Path(__file__).parent / "models"

print("\n" + "=" * 70)
print("  URBAN HEAT INSIGHTS — MODEL MEASUREMENTS")
print("=" * 70)

# ─────────────────────────────────────────────────────────────
# 1. SPATIAL MODEL  (Random Forest)
# ─────────────────────────────────────────────────────────────
print("\n[1] SPATIAL MODEL — Tuned Random Forest")
print("-" * 70)

rf_path = MODELS_DIR / "uhi_rf_model_tuned.pkl"
meta_path = MODELS_DIR / "model_metadata.json"

# Load metadata
with open(meta_path) as f:
    meta = json.load(f)

print(f"  Model type      : {meta['model_type']}")
print(f"  Training samples: {meta['training_samples']:,}")
print(f"  Test samples    : {meta['test_samples']:,}")
print()
print("  Performance:")
print(f"    Baseline  R²  : {meta['baseline_r2']:.4f}")
print(f"    Tuned     R²  : {meta['tuned_r2']:.4f}   << production model")
print(f"    Baseline  RMSE: {meta['baseline_rmse']:.4f} °C")
print(f"    Tuned     RMSE: {meta['tuned_rmse']:.4f} °C")
print()
print("  Hyperparameters:")
for k, v in meta["best_params"].items():
    print(f"    {k:<22}: {v}")
print()
print("  Feature Importance:")
for fi in meta["feature_importance"]:
    bar = "█" * int(fi["Importance"] * 40)
    print(f"    {fi['Feature']:<12} {bar}  {fi['Importance']*100:.1f}%")

# Load model and inspect internals
print("\n  Loading RF model (~312 MB)…")
rf_model = joblib.load(rf_path)
print(f"  n_estimators    : {rf_model.n_estimators}")
print(f"  max_depth       : {rf_model.max_depth}")
print(f"  max_features    : {rf_model.max_features}")
print(f"  n_features_in_  : {rf_model.n_features_in_}")

# OOB score if bootstrap was used
if rf_model.oob_score:
    print(f"  OOB R²          : {rf_model.oob_score_:.4f}")
else:
    print(f"  OOB score       : disabled (bootstrap=False)")

# Estimator depth stats
depths = [e.get_depth() for e in rf_model.estimators_]
print(f"  Tree depth stats: min={min(depths)}, max={max(depths)}, mean={np.mean(depths):.1f}")

# ─────────────────────────────────────────────────────────────
# 2. TIME-SERIES MODEL  (CatBoost / best ensemble)
# ─────────────────────────────────────────────────────────────
print("\n" + "=" * 70)
print("[2] TIME-SERIES MODEL — Best Ensemble Regressor")
print("-" * 70)

ts_path = MODELS_DIR / "timeseries_temperature_model.pkl"
with open(ts_path, "rb") as f:
    ts_bundle = pickle.load(f)

ts_model    = ts_bundle["model"]
feat_cols   = ts_bundle["feature_cols"]
model_name  = ts_bundle["model_name"]
r2          = ts_bundle["r2_score"]
train_mae   = ts_bundle["train_mae"]
test_mae    = ts_bundle["test_mae"]

print(f"  Model type      : {model_name} ({type(ts_model).__name__})")
print(f"  Features        : {feat_cols}")
print()
print("  Performance:")
print(f"    R² (test)     : {r2:.4f}")
print(f"    MAE (train)   : {train_mae:.4f} °C")
print(f"    MAE (test)    : {test_mae:.4f} °C")
print()

# Feature importance
if hasattr(ts_model, "feature_importances_"):
    print("  Feature Importance:")
    fi_pairs = sorted(zip(feat_cols, ts_model.feature_importances_), key=lambda x: -x[1])
    for feat, imp in fi_pairs:
        bar = "█" * int(imp * 50)
        print(f"    {feat:<22} {bar}  {imp*100:.1f}%")
elif hasattr(ts_model, "get_feature_importance"):
    print("  Feature Importance (CatBoost):")
    importances = ts_model.get_feature_importance()
    fi_pairs = sorted(zip(feat_cols, importances), key=lambda x: -x[1])
    for feat, imp in fi_pairs:
        bar = "█" * int(imp / 2)
        print(f"    {feat:<22} {bar}  {imp:.1f}%")

# Model-specific info
if hasattr(ts_model, "n_estimators"):
    print(f"\n  n_estimators    : {ts_model.n_estimators}")
if hasattr(ts_model, "max_depth"):
    print(f"  max_depth       : {ts_model.max_depth}")
if hasattr(ts_model, "learning_rate"):
    print(f"  learning_rate   : {ts_model.learning_rate}")
if hasattr(ts_model, "tree_count_"):
    print(f"  tree_count_     : {ts_model.tree_count_}")

# ─────────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────────
print("\n" + "=" * 70)
print("  SUMMARY")
print("=" * 70)
print(f"  Spatial RF  — R²: {meta['tuned_r2']:.4f}, RMSE: {meta['tuned_rmse']:.4f}°C")
print(f"  Time-Series — R²: {r2:.4f},  MAE (test): {test_mae:.4f}°C")
print("=" * 70 + "\n")
