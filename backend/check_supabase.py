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
print("CHECKING SUPABASE HOTSPOTS DATA")
print("="*70 + "\n")

# Get all hotspots
result = sb.table('hotspots').select('*').execute()

print(f"Total hotspots in database: {len(result.data)}\n")

if len(result.data) == 0:
    print("⚠️  DATABASE IS EMPTY!")
    print("\nPossible reasons:")
    print("1. Upload failed silently")
    print("2. RLS (Row Level Security) is blocking reads")
    print("3. Data was cleared but not re-uploaded")
else:
    print("Sample hotspots:")
    print(f"{'City':<15} | {'District':<20} | {'Name':<35} | Temp")
    print("-" * 90)
    
    for h in result.data[:10]:
        city = h.get('city', 'N/A')
        district = h.get('district', 'N/A')
        name = h.get('name', 'N/A')
        temp = h.get('avg_temperature', 0)
        print(f"{city:<15} | {district:<20} | {name:<35} | {temp:.1f}°C")
    
    print("\n" + "="*70)
    print("CITY BREAKDOWN")
    print("="*70)
    
    cities = {}
    for h in result.data:
        city = h.get('city', 'Unknown')
        cities[city] = cities.get(city, 0) + 1
    
    for city, count in sorted(cities.items()):
        print(f"  {city}: {count} districts")

print("\n" + "="*70 + "\n")
