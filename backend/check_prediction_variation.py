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
print("KUALA LUMPUR PREDICTIONS - CHECKING FOR VARIATION")
print("="*80 + "\n")

# Get all KL predictions
result = sb.table('predictions').select('*').like('city', 'Kuala Lumpur%').order('year').execute()

# Group by year
from collections import defaultdict
year_groups = defaultdict(list)

for pred in result.data:
    year_groups[pred['year']].append(pred['predicted_temp'])

print(f"Total KL predictions: {len(result.data)}\n")

for year in sorted(year_groups.keys()):
    temps = year_groups[year]
    avg = sum(temps) / len(temps)
    min_temp = min(temps)
    max_temp = max(temps)
    print(f"Year {year}:")
    print(f"  Count: {len(temps)} districts")
    print(f"  Average: {avg:.2f}°C")
    print(f"  Range: {min_temp:.2f}°C - {max_temp:.2f}°C")
    print(f"  Sample temps: {[round(t, 2) for t in temps[:5]]}")
    print()

print("="*80 + "\n")
