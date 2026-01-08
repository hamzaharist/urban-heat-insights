import pandas as pd

df = pd.read_csv('model_comparison_results.csv')

# Sort by R² Score
df_sorted = df.sort_values('R² Score', ascending=False).reset_index(drop=True)

print("="*100)
print(" "*30 + "ML MODEL COMPARISON RESULTS")
print(" "*25 + "UHI Temperature Prediction (LST)")
print("="*100)

print(f"\nDataset: 77,668 samples | Features: NDVI, NDBI, Elevation, Population")
print(f"Split: 80% Train ({int(77668*0.8):,} samples) / 20% Test ({int(77668*0.2):,} samples)")

print("\n" + "="*100)
print("COMPLETE RESULTS (Ranked by R² Score)")
print("="*100)
print()

# Format the dataframe nicely
for i, row in df_sorted.iterrows():
    rank = i + 1
    medal = "🥇" if rank == 1 else "🥈" if rank == 2 else "🥉" if rank == 3 else f"{rank}."
    
    print(f"{medal} {row['Model']}")
    print(f"   R² Score:      {row['R² Score']:.4f}  (Higher is better)")
    print(f"   RMSE:          {row['RMSE']:.4f}°C (Lower is better)")
    print(f"   MAE:           {row['MAE']:.4f}°C  (Lower is better)")
    print(f"   Train Time:    {row['Train Time (s)']:.3f}s")
    print(f"   Predict Time:  {row['Predict Time (s)']:.6f}s")
    print()

print("="*100)
print("TOP 3 ANALYSIS")
print("="*100)

print("\n🥇 BEST OVERALL: Random Forest")
print("   Why: Highest R² (0.8362) and low RMSE (2.47°C)")
print("   Trade-off: Moderate training time (3.6s), slower prediction")

print("\n🥈 RUNNER-UP: XGBoost")  
print("   Why: Excellent R² (0.7782), faster than Random Forest")
print("   Trade-off: Slightly lower accuracy but 40% faster training")

print("\n🥉 THIRD PLACE: LightGBM")
print("   Why: Very fast training (1.0s), good R² (0.7627)")
print("   Trade-off: Production-ready speed with minimal accuracy loss")

print("\n" + "="*100)
print("RECOMMENDATIONS")
print("="*100)

print("""
🎯 For BEST ACCURACY:
   → Use Random Forest (R²=0.8362, RMSE=2.47°C)
   → Perfect for research and high-precision applications

⚡ For PRODUCTION/SPEED:
   → Use LightGBM (R²=0.7627, Train=1.0s, Predict=0.016s)
   → Great balance of accuracy and speed for real-time systems

🚀 For BALANCED APPROACH:
   → Use XGBoost (R²=0.7782, Train=2.1s)
   → Industry standard with excellent accuracy-speed balance

❌ AVOID:
   → Support Vector Regressor (243s training, 101s prediction - too slow)
   → Linear models (R²=0.696 - insufficient accuracy)
""")

print("="*100)

# Additional statistics
print("\nSTATISTICAL SUMMARY:")
print("-"*100)
print(f"Best R² Score:        {df_sorted.iloc[0]['R² Score']:.4f} ({df_sorted.iloc[0]['Model']})")
print(f"Worst R² Score:       {df_sorted.iloc[-1]['R² Score']:.4f} ({df_sorted.iloc[-1]['Model']})")
print(f"Average R² Score:     {df_sorted['R² Score'].mean():.4f}")
print(f"Median R² Score:      {df_sorted['R² Score'].median():.4f}")

best_rmse_idx = df_sorted['RMSE'].idxmin()
print(f"\nLowest RMSE:          {df_sorted.loc[best_rmse_idx, 'RMSE']:.4f}°C ({df_sorted.loc[best_rmse_idx, 'Model']})")
print(f"Highest RMSE:         {df_sorted['RMSE'].max():.4f}°C")
print(f"Average RMSE:         {df_sorted['RMSE'].mean():.4f}°C")

fastest_train = df_sorted.loc[df_sorted['Train Time (s)'].idxmin()]
print(f"\nFastest Training:     {fastest_train['Train Time (s)']:.4f}s ({fastest_train['Model']})")
print(f"Slowest Training:     {df_sorted['Train Time (s)'].max():.2f}s")

print("\n" + "="*100)
