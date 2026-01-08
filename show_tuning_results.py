import json

# Load the metadata
with open('backend/models/model_metadata.json', 'r') as f:
    data = json.load(f)

print("="*90)
print(" "*25 + "HYPERPARAMETER TUNING RESULTS")
print(" "*30 + "Random Forest Model")
print("="*90)

print("\n🏆 BEST HYPERPARAMETERS FOUND:")
print("-"*90)
for param, value in data['best_params'].items():
    print(f"  {param:25s}: {value}")

print("\n" + "="*90)
print("PERFORMANCE COMPARISON")
print("="*90)

baseline_r2 = data['baseline_r2']
tuned_r2 = data['tuned_r2']
baseline_rmse = data['baseline_rmse']
tuned_rmse = data['tuned_rmse']

print(f"\n{'Metric':<20} {'Baseline':<15} {'Tuned':<15} {'Improvement'}")
print("-"*90)
print(f"{'R² Score':<20} {baseline_r2:<15.4f} {tuned_r2:<15.4f} +{(tuned_r2-baseline_r2):.4f} ({((tuned_r2-baseline_r2)/baseline_r2*100):+.2f}%)")
print(f"{'RMSE (°C)':<20} {baseline_rmse:<15.4f} {tuned_rmse:<15.4f} {(tuned_rmse-baseline_rmse):+.4f} ({((tuned_rmse-baseline_rmse)/baseline_rmse*100):+.2f}%)")

print("\n" + "="*90)
print("FEATURE IMPORTANCE (Most Important to Least)")
print("="*90)
print()

for feature_data in data['feature_importance']:
    feature = feature_data['Feature']
    importance = feature_data['Importance']
    bar_length = int(importance * 50)
    bar = '█' * bar_length
    print(f"{feature:12s} │ {bar} {importance:.4f}")

print("\n" + "="*90)
print("MODEL FILES SAVED")
print("="*90)
print("""
✓ backend/models/uhi_rf_model_tuned.pkl     - Optimized Random Forest model
✓ backend/models/uhi_rf_model_baseline.pkl  - Baseline model for comparison
✓ backend/models/feature_names.pkl          - Feature list for predictions
✓ backend/models/model_metadata.json        - Complete model information
""")

print("="*90)
print("SUMMARY")
print("="*90)
print(f"""
✨ Hyperparameter tuning completed successfully!

Final Model Performance:
  • R² Score: {tuned_r2:.4f} (Explains {tuned_r2*100:.2f}% of temperature variance)
  • RMSE: {tuned_rmse:.4f}°C (Average prediction error)
  • Improvement: {((tuned_r2-baseline_r2)/baseline_r2*100):+.2f}% better than baseline

Training Details:
  • Dataset: {data['training_samples']:,} training samples
  • Test Set: {data['test_samples']:,} samples
  • Tuning Time: {data['tuning_time_seconds']:.1f} seconds ({data['tuning_time_seconds']/60:.1f} minutes)
  
🚀 The model is ready for deployment!
""")
print("="*90)
