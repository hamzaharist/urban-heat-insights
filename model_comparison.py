import pandas as pd
import numpy as np
import time
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error

# Import all models to test
from sklearn.linear_model import LinearRegression, Ridge, Lasso
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor, AdaBoostRegressor
from sklearn.svm import SVR
from sklearn.neighbors import KNeighborsRegressor
from xgboost import XGBRegressor
from lightgbm import LGBMRegressor
from catboost import CatBoostRegressor

print("="*90)
print(" "*30 + "ML MODEL COMPARISON")
print(" "*25 + "UHI Temperature Prediction")
print("="*90)

# 1. LOAD DATA
print("\n[1/5] Loading cleaned dataset...")
df = pd.read_csv('backend/data/UHI_Dataset_Cleaned_Final.csv')
print(f"Dataset size: {len(df):,} rows")

# 2. PREPARE FEATURES AND TARGET
print("\n[2/5] Preparing features and target...")
features = ['NDVI', 'NDBI', 'Elevation', 'Population']
X = df[features]
y = df['LST']

print(f"Features: {features}")
print(f"Target: LST (Land Surface Temperature)")

# 3. TRAIN-TEST SPLIT
print("\n[3/5] Splitting data (80% train, 20% test)...")
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)
print(f"Training samples: {len(X_train):,}")
print(f"Testing samples: {len(X_test):,}")

# 4. SCALE FEATURES (important for some models)
print("\n[4/5] Scaling features...")
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# 5. DEFINE MODELS TO TEST
print("\n[5/5] Testing multiple ML models...")
print("="*90)

models = {
    # Linear Models
    'Linear Regression': LinearRegression(),
    'Ridge Regression': Ridge(alpha=1.0),
    'Lasso Regression': Lasso(alpha=0.1),
    
    # Tree-based Models
    'Decision Tree': DecisionTreeRegressor(max_depth=10, random_state=42),
    'Random Forest': RandomForestRegressor(n_estimators=100, max_depth=15, random_state=42, n_jobs=-1),
    'Gradient Boosting': GradientBoostingRegressor(n_estimators=100, max_depth=5, random_state=42),
    'AdaBoost': AdaBoostRegressor(n_estimators=100, random_state=42),
    
    # Advanced Gradient Boosting
    'XGBoost': XGBRegressor(n_estimators=100, max_depth=7, learning_rate=0.1, random_state=42, n_jobs=-1),
    'LightGBM': LGBMRegressor(n_estimators=100, max_depth=7, learning_rate=0.1, random_state=42, verbose=-1),
    'CatBoost': CatBoostRegressor(iterations=100, depth=7, learning_rate=0.1, random_state=42, verbose=0),
    
    # Other Models
    'Support Vector Regressor': SVR(kernel='rbf', C=100, gamma='scale'),
    'K-Nearest Neighbors': KNeighborsRegressor(n_neighbors=5, n_jobs=-1)
}

# Store results
results = []

# Test each model
for i, (name, model) in enumerate(models.items(), 1):
    print(f"\n[{i}/{len(models)}] Testing {name}...")
    print("-"*90)
    
    try:
        # Some models need scaled data, others don't
        # Linear models, SVR, KNN benefit from scaling
        use_scaled = name in ['Linear Regression', 'Ridge Regression', 'Lasso Regression', 
                              'Support Vector Regressor', 'K-Nearest Neighbors']
        
        X_train_use = X_train_scaled if use_scaled else X_train
        X_test_use = X_test_scaled if use_scaled else X_test
        
        # Training
        start_time = time.time()
        model.fit(X_train_use, y_train)
        train_time = time.time() - start_time
        
        # Prediction
        start_time = time.time()
        y_pred = model.predict(X_test_use)
        pred_time = time.time() - start_time
        
        # Metrics
        r2 = r2_score(y_test, y_pred)
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))
        mae = mean_absolute_error(y_test, y_pred)
        
        results.append({
            'Model': name,
            'R² Score': r2,
            'RMSE': rmse,
            'MAE': mae,
            'Train Time (s)': train_time,
            'Predict Time (s)': pred_time
        })
        
        print(f"  R² Score:      {r2:.4f}")
        print(f"  RMSE:          {rmse:.4f}°C")
        print(f"  MAE:           {mae:.4f}°C")
        print(f"  Train Time:    {train_time:.4f}s")
        print(f"  Predict Time:  {pred_time:.6f}s")
        print(f"  Status: ✓ Success")
        
    except Exception as e:
        print(f"  Status: ✗ Failed - {str(e)[:50]}")
        results.append({
            'Model': name,
            'R² Score': np.nan,
            'RMSE': np.nan,
            'MAE': np.nan,
            'Train Time (s)': np.nan,
            'Predict Time (s)': np.nan
        })

# 6. SUMMARY TABLE
print("\n\n" + "="*90)
print(" "*30 + "RESULTS SUMMARY")
print("="*90)

results_df = pd.DataFrame(results)
results_df = results_df.sort_values('R² Score', ascending=False)

print("\n" + results_df.to_string(index=False))

# 7. BEST MODEL
print("\n\n" + "="*90)
print(" "*30 + "BEST MODEL")
print("="*90)

best_model = results_df.iloc[0]
print(f"\n🏆 Winner: {best_model['Model']}")
print(f"   R² Score:      {best_model['R² Score']:.4f}")
print(f"   RMSE:          {best_model['RMSE']:.4f}°C")
print(f"   MAE:           {best_model['MAE']:.4f}°C")
print(f"   Train Time:    {best_model['Train Time (s)']:.4f}s")

# 8. SAVE RESULTS
results_df.to_csv('model_comparison_results.csv', index=False)
print(f"\n📁 Results saved to: model_comparison_results.csv")

# 9. PERFORMANCE RANKING
print("\n\n" + "="*90)
print(" "*30 + "RANKING BY METRIC")
print("="*90)

print("\n🥇 Top 3 by R² Score:")
for i, row in results_df.head(3).iterrows():
    print(f"   {i+1}. {row['Model']}: {row['R² Score']:.4f}")

print("\n⚡ Top 3 by Speed (Training):")
speed_rank = results_df.sort_values('Train Time (s)')
for i, (idx, row) in enumerate(speed_rank.head(3).iterrows(), 1):
    print(f"   {i}. {row['Model']}: {row['Train Time (s)']:.4f}s")

print("\n🎯 Top 3 by Accuracy (Lowest RMSE):")
accuracy_rank = results_df.sort_values('RMSE')
for i, (idx, row) in enumerate(accuracy_rank.head(3).iterrows(), 1):
    print(f"   {i}. {row['Model']}: {row['RMSE']:.4f}°C")

print("\n" + "="*90)
print("Model comparison complete!")
print("="*90)
