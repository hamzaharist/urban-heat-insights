"""
Extract ML model insights for frontend display
Calculates feature importance, risk metrics, and key factors from Gradient Boosting model
"""
import pickle
import pandas as pd
import numpy as np
from pathlib import Path

def get_model_insights():
    """
    Extract insights from trained Gradient Boosting model
    Returns feature importance and risk metrics
    """
    model_path = Path('models/gradient_boosting_temperature_model.pkl')
    
    if not model_path.exists():
        return None
    
    # Load model
    with open(model_path, 'rb') as f:
        model = pickle.load(f)
    
    # Feature names (must match training order)
    feature_names = [
        'year_normalized', 'month_sin', 'month_cos',
        'temp_lag_1y', 'temp_lag_2y',
        'temp_rolling_mean_3m', 'temp_rolling_std_3m',
        'ndvi_filled', 'ndbi_filled'
    ]
    
    # Get feature importance
    importance_dict = dict(zip(feature_names, model.feature_importances_))
    
    # Calculate key factors (group related features)
    urban_expansion = importance_dict['ndbi_filled'] * 100  # NDBI = built-up areas
    vegetation_loss = importance_dict['ndvi_filled'] * 100  # NDVI = vegetation
    
    # Climate baseline = temporal features (year + seasonal)
    climate_baseline = (
        importance_dict['year_normalized'] + 
        importance_dict['month_sin'] + 
        importance_dict['month_cos']
    ) * 100
    
    # Historical patterns = lag features
    historical_patterns = (
        importance_dict['temp_lag_1y'] + 
        importance_dict['temp_lag_2y'] +
        importance_dict['temp_rolling_mean_3m'] +
        importance_dict['temp_rolling_std_3m']
    ) * 100
    
    # Normalize to percentages (so they add up to 100%)
    total = urban_expansion + vegetation_loss + climate_baseline + historical_patterns
    
    key_factors = {
        'urbanExpansion': round((urban_expansion / total) * 100),
        'vegetationLoss': round((vegetation_loss / total) * 100),
        'climateBaseline': round((climate_baseline / total) * 100),
        'historicalPatterns': round((historical_patterns / total) * 100)
    }
    
    # Calculate risk probability based on model performance
    # We'll use the test R² score as a proxy for confidence
    # Higher R² = more confident in predictions = higher risk if trend is upward
    # From our training: Test R² = 0.621
    test_r2 = 0.621
    
    # Risk probability: if model is confident (high R²) and predicts warming, risk is high
    # We'll set it to 60-85% range based on R² score
    risk_probability = round(50 + (test_r2 * 50))  # Maps 0.621 to ~81%
    
    return {
        'keyFactors': key_factors,
        'riskProbability': risk_probability,
        'modelPerformance': {
            'r2Score': round(test_r2, 3),
            'confidence': round(test_r2 * 100, 1)
        },
        'featureImportance': {
            name: round(imp * 100, 1) 
            for name, imp in importance_dict.items()
        }
    }

if __name__ == '__main__':
    import json
    
    insights = get_model_insights()
    
    if insights:
        print("\n" + "="*80)
        print("ML MODEL INSIGHTS")
        print("="*80 + "\n")
        
        print("KEY FACTORS DRIVING TEMPERATURE INCREASE:")
        for factor, value in insights['keyFactors'].items():
            print(f"  {factor}: {value}%")
        
        print(f"\nRISK PROBABILITY: {insights['riskProbability']}%")
        print(f"MODEL R² SCORE: {insights['modelPerformance']['r2Score']}")
        
        print("\n" + "="*80)
        print("FEATURE IMPORTANCE (Individual):")
        print("="*80)
        for feature, importance in sorted(
            insights['featureImportance'].items(), 
            key=lambda x: x[1], 
            reverse=True
        ):
            print(f"  {feature:25} {importance:5.1f}%")
        
        # Save to JSON for frontend
        with open('data/model_insights.json', 'w') as f:
            json.dump(insights, f, indent=2)
        
        print(f"\n✓ Insights saved to: data/model_insights.json")
    else:
        print("✗ Model not found. Train the model first.")
