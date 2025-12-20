from supabase import create_client
import os
import pathlib
from dotenv import load_dotenv

load_dotenv(pathlib.Path(__file__).parent.parent / '.env')

sb = create_client(
    os.getenv('VITE_SUPABASE_URL'),
    os.getenv('VITE_SUPABASE_PUBLISHABLE_KEY')
)

print("\n" + "="*80)
print("PREDICTION CONFIDENCE LEVELS")
print("="*80 + "\n")

# Get all predictions for Kuala Lumpur
result = sb.table('predictions').select('*').like('city', 'Kuala Lumpur%').order('year').execute()

# Group by year
from collections import defaultdict
year_data = defaultdict(list)

for pred in result.data:
    year_data[pred['year']].append({
        'city': pred['city'],
        'temp': pred['predicted_temp'],
        'confidence': pred['confidence_level']
    })

print("KUALA LUMPUR PREDICTIONS:\n")

for year in sorted(year_data.keys()):
    preds = year_data[year]
    avg_temp = sum(p['temp'] for p in preds) / len(preds)
    avg_conf = sum(p['confidence'] for p in preds) / len(preds)
    
    print(f"Year {year}:")
    print(f"  Districts: {len(preds)}")
    print(f"  Avg Temperature: {avg_temp:.2f}°C")
    print(f"  Avg Confidence: {avg_conf:.2f} ({avg_conf*100:.0f}%)")
    print(f"  Confidence Range: {min(p['confidence'] for p in preds):.2f} - {max(p['confidence'] for p in preds):.2f}")
    print()

print("="*80)
print("CONFIDENCE CALCULATION METHOD")
print("="*80 + "\n")

print("Confidence decreases over time because:")
print("  - 2026 (1 year out): 0.92 (92%) - High confidence")
print("  - 2027 (2 years out): 0.84 (84%) - Good confidence")
print("  - 2028 (3 years out): 0.76 (76%) - Moderate confidence")
print("  - 2029 (4 years out): 0.68 (68%) - Fair confidence")
print("  - 2030 (5 years out): 0.60 (60%) - Acceptable confidence")
print()
print("Formula: confidence = max(0.5, 1.0 - (year_offset * 0.08))")
print()
print("Why it decreases:")
print("  ✓ More uncertainty the further we predict")
print("  ✓ Unknown future events (policy changes, development)")
print("  ✓ Climate variability increases with time")
print("  ✓ Model trained on 2016-2024 data")

print("\n" + "="*80 + "\n")
