"""
Hyperparameter Tuning — 13 Models with Location-Based Cross-Validation.

Extracts lat/lon from .geo column, bins into 1°×1° spatial grid cells,
and uses GroupKFold so no geographic area leaks between train and test folds.
This mirrors the state-based CV in retrain_spatial_model.py but works
directly from the CSV without Supabase.
"""
import json
import warnings
import time
import numpy as np
import pandas as pd
from sklearn.model_selection import GroupKFold, RandomizedSearchCV
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
from sklearn.linear_model import Ridge, Lasso, ElasticNet
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import (
    RandomForestRegressor, GradientBoostingRegressor,
    AdaBoostRegressor, ExtraTreesRegressor
)
from sklearn.neighbors import KNeighborsRegressor
from xgboost import XGBRegressor
from catboost import CatBoostRegressor

warnings.filterwarnings('ignore')

# ── Load dataset ──────────────────────────────────────────────────────────────
print("Loading dataset...")
df = pd.read_csv('backend/data/UHI_Training_Data_Malaysia_Combined.csv')

# Extract lat/lon from .geo JSON
coords = df['.geo'].apply(json.loads)
df['lon'] = coords.apply(lambda g: g['coordinates'][0])
df['lat'] = coords.apply(lambda g: g['coordinates'][1])

# Create 1°×1° spatial grid cell groups (location-based grouping)
df['grid_cell'] = (
    df['lat'].round(0).astype(str) + '_' +
    df['lon'].round(0).astype(str)
)

FEATURES = ['NDVI', 'NDBI', 'Elevation', 'Population']
X = df[FEATURES].values
y = df['LST'].values
groups = df['grid_cell'].values

n_cells = df['grid_cell'].nunique()
print(f"Total samples    : {len(df):,}")
print(f"Spatial grid cells: {n_cells} (1°×1° bins)")
print(f"Lat range: {df['lat'].min():.2f} – {df['lat'].max():.2f}")
print(f"Lon range: {df['lon'].min():.2f} – {df['lon'].max():.2f}\n")

# ── GroupKFold — 5 folds, each fold holds out ~20% of grid cells ──────────────
GKF = GroupKFold(n_splits=5)

# ── Model + hyperparameter search spaces ─────────────────────────────────────
MODELS = {
    'Ridge Regression': {
        'model': Ridge(),
        'params': {'alpha': [0.01, 0.1, 1.0, 10.0, 100.0, 500.0]}
    },
    'Lasso Regression': {
        'model': Lasso(max_iter=5000),
        'params': {'alpha': [0.001, 0.01, 0.05, 0.1, 0.5, 1.0]}
    },
    'Elastic Net': {
        'model': ElasticNet(max_iter=5000),
        'params': {
            'alpha': [0.001, 0.01, 0.1, 0.5, 1.0],
            'l1_ratio': [0.1, 0.3, 0.5, 0.7, 0.9]
        }
    },
    'Decision Tree': {
        'model': DecisionTreeRegressor(random_state=42),
        'params': {
            'max_depth': [5, 8, 10, 15, 20, None],
            'min_samples_split': [2, 5, 10, 20],
            'min_samples_leaf': [1, 2, 5, 10],
            'max_features': ['sqrt', 'log2', None]
        }
    },
    'Random Forest': {
        'model': RandomForestRegressor(random_state=42, n_jobs=-1),
        'params': {
            'n_estimators': [100, 200, 300],
            'max_depth': [10, 15, 20, None],
            'min_samples_split': [2, 5, 10],
            'min_samples_leaf': [1, 2, 4],
            'max_features': ['sqrt', 'log2']
        }
    },
    'Extra Trees': {
        'model': ExtraTreesRegressor(random_state=42, n_jobs=-1),
        'params': {
            'n_estimators': [100, 200, 300],
            'max_depth': [10, 15, 20, None],
            'min_samples_split': [2, 5, 10],
            'min_samples_leaf': [1, 2, 4],
            'max_features': ['sqrt', 'log2']
        }
    },
    'Gradient Boosting': {
        'model': GradientBoostingRegressor(random_state=42),
        'params': {
            'n_estimators': [100, 200, 300],
            'learning_rate': [0.05, 0.1, 0.2],
            'max_depth': [3, 5, 7],
            'subsample': [0.7, 0.8, 1.0],
            'min_samples_leaf': [1, 5, 10]
        }
    },
    'AdaBoost': {
        'model': AdaBoostRegressor(random_state=42),
        'params': {
            'n_estimators': [50, 100, 200, 300],
            'learning_rate': [0.01, 0.05, 0.1, 0.5, 1.0],
            'loss': ['linear', 'square', 'exponential']
        }
    },
    'K-Nearest Neighbors': {
        'model': KNeighborsRegressor(n_jobs=-1),
        'params': {
            'n_neighbors': [3, 5, 7, 10, 15, 20],
            'weights': ['uniform', 'distance'],
            'p': [1, 2]
        }
    },
    'XGBoost': {
        'model': XGBRegressor(random_state=42, n_jobs=-1, verbosity=0),
        'params': {
            'n_estimators': [100, 200, 300],
            'learning_rate': [0.05, 0.1, 0.2],
            'max_depth': [3, 5, 7, 9],
            'subsample': [0.7, 0.8, 1.0],
            'colsample_bytree': [0.7, 0.8, 1.0],
            'reg_alpha': [0, 0.1, 1.0],
            'reg_lambda': [1.0, 2.0, 5.0]
        }
    },
    'CatBoost': {
        'model': CatBoostRegressor(random_seed=42, verbose=0),
        'params': {
            'iterations': [100, 200, 300],
            'learning_rate': [0.05, 0.1, 0.2],
            'depth': [4, 6, 8, 10],
            'l2_leaf_reg': [1, 3, 5, 10],
            'subsample': [0.7, 0.8, 1.0]
        }
    },
}

# Add LightGBM if available, else MLP
try:
    from lightgbm import LGBMRegressor
    MODELS['LightGBM'] = {
        'model': LGBMRegressor(random_state=42, n_jobs=-1, verbose=-1),
        'params': {
            'n_estimators': [100, 200, 300],
            'learning_rate': [0.05, 0.1, 0.2],
            'max_depth': [3, 5, 7, -1],
            'num_leaves': [31, 63, 127],
            'subsample': [0.7, 0.8, 1.0],
            'colsample_bytree': [0.7, 0.8, 1.0],
            'reg_alpha': [0, 0.1, 1.0],
            'reg_lambda': [1.0, 2.0, 5.0]
        }
    }
    print("LightGBM available — using as model 13.")
except ImportError:
    from sklearn.neural_network import MLPRegressor
    MODELS['MLP Predictor'] = {
        'model': MLPRegressor(random_state=42, max_iter=500),
        'params': {
            'hidden_layer_sizes': [(50,), (100,), (100, 50), (100, 100), (200, 100)],
            'alpha': [0.0001, 0.001, 0.01],
            'learning_rate_init': [0.001, 0.01],
            'activation': ['relu', 'tanh']
        }
    }
    print("LightGBM not available — using MLP Predictor as model 13.")

print(f"\nTuning {len(MODELS)} models with Location-Based GroupKFold CV")
print(f"Strategy: RandomizedSearchCV (n_iter=20) inside GroupKFold(n_splits=5)")
print("=" * 75)

results = []

for i, (name, cfg) in enumerate(MODELS.items(), 1):
    print(f"\n[{i:02d}/{len(MODELS)}] {name}")
    print("-" * 50)
    t0 = time.time()

    search = RandomizedSearchCV(
        estimator=cfg['model'],
        param_distributions=cfg['params'],
        n_iter=20,
        cv=GKF.split(X, y, groups),
        scoring='r2',
        refit=False,          # we evaluate manually per fold below
        n_jobs=-1,
        random_state=42,
        verbose=0
    )
    search.fit(X, y)

    best_params = search.best_params_
    best_cv_r2  = search.best_score_
    print(f"  Best CV R²   : {best_cv_r2:.4f}")
    print(f"  Best params  : {best_params}")

    # ── Re-evaluate with best params using manual GroupKFold for full metrics ──
    fold_r2, fold_mae, fold_rmse = [], [], []

    for fold, (tr_idx, te_idx) in enumerate(GKF.split(X, y, groups), 1):
        held_cells = sorted(set(groups[te_idx]))[:3]   # show first 3 cells
        X_tr, y_tr = X[tr_idx], y[tr_idx]
        X_te, y_te = X[te_idx], y[te_idx]

        # Build model with best params
        m = cfg['model'].__class__(**{
            **cfg['model'].get_params(),
            **best_params
        })
        m.fit(X_tr, y_tr)
        y_pred = m.predict(X_te)

        fr2   = r2_score(y_te, y_pred)
        fmae  = mean_absolute_error(y_te, y_pred)
        frmse = np.sqrt(mean_squared_error(y_te, y_pred))
        fold_r2.append(fr2)
        fold_mae.append(fmae)
        fold_rmse.append(frmse)

        print(f"    Fold {fold} | cells (sample): {held_cells}... "
              f"n={len(y_te):>5}  R²={fr2:.4f}  MAE={fmae:.4f}°C")

    elapsed = time.time() - t0
    mean_r2   = float(np.mean(fold_r2))
    mean_mae  = float(np.mean(fold_mae))
    mean_rmse = float(np.mean(fold_rmse))
    std_r2    = float(np.std(fold_r2))

    print(f"  >> CV R²: {mean_r2:.4f} ± {std_r2:.4f}  |  "
          f"MAE: {mean_mae:.4f}°C  |  RMSE: {mean_rmse:.4f}°C  |  "
          f"Time: {elapsed:.1f}s")

    results.append({
        'Model': name,
        'R² (mean)': round(mean_r2, 4),
        'R² (std)':  round(std_r2, 4),
        'RMSE (°C)': round(mean_rmse, 4),
        'MAE (°C)':  round(mean_mae, 4),
        'Best Params': str(best_params)
    })

# ── Final leaderboard ─────────────────────────────────────────────────────────
print("\n" + "=" * 75)
print("  FINAL LEADERBOARD — Location-Based CV with Hyperparameter Tuning")
print("=" * 75)

res_df = pd.DataFrame(results).sort_values('R² (mean)', ascending=False).reset_index(drop=True)
res_df.index += 1

print(res_df[['Model', 'R² (mean)', 'R² (std)', 'RMSE (°C)', 'MAE (°C)']].to_string())

print("\n" + "=" * 75)
best = res_df.iloc[0]
print(f"  Best model : {best['Model']}")
print(f"  R²         : {best['R² (mean)']:.4f} ± {best['R² (std)']:.4f}")
print(f"  RMSE       : {best['RMSE (°C)']:.4f}°C")
print(f"  MAE        : {best['MAE (°C)']:.4f}°C")
print(f"  Best params: {res_df.iloc[0]['Best Params']}")
print("=" * 75)

# Save results to CSV
out_path = 'backend/data/tuned_13_models_location_cv_results.csv'
res_df.to_csv(out_path, index=False)
print(f"\nResults saved to: {out_path}")
