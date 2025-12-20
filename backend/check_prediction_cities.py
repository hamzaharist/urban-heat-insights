from supabase import create_client
import os
import pathlib
from dotenv import load_dotenv

load_dotenv(pathlib.Path(__file__).parent.parent / '.env')

sb = create_client(
    os.getenv('VITE_SUPABASE_URL'),
    os.getenv('VITE_SUPABASE_PUBLISHABLE_KEY')
)

print("\n" + "="*70)
print("PREDICTIONS CITY NAMES")
print("="*70 + "\n")

result = sb.table('predictions').select('city').execute()

# Get unique cities
cities = set([p['city'] for p in result.data])

print(f"Total predictions: {len(result.data)}")
print(f"Unique cities: {len(cities)}\n")

for city in sorted(cities):
    count = len([p for p in result.data if p['city'] == city])
    print(f"  {city}: {count} predictions")

print("\n" + "="*70 + "\n")
