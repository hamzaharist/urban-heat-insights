"""
Simple manual update test - just set hardcoded values for testing
"""
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

url = os.getenv('VITE_SUPABASE_URL')
key = os.getenv('VITE_SUPABASE_PUBLISHABLE_KEY')

sb = create_client(url, key)

# Manually set values for all hotspots
hotspots = [
    {'name': 'KLCC', 'ndvi': 0.111, 'ndbi': -0.009},
    {'name': 'Bukit Bintang', 'ndvi': 0.118, 'ndbi': -0.009},
    {'name': 'Cheras', 'ndvi': 0.125, 'ndbi': -0.051},
    {'name': 'Petaling Jaya', 'ndvi': 0.105, 'ndbi': -0.015},
    {'name': 'Mont Kiara', 'ndvi': 0.132, 'ndbi': -0.020},
]

print("\nManually updating hotspots with calculated values...")
print("="*60)

for h in hotspots:
    try:
        result = sb.table('hotspots').update({
            'avg_ndvi': h['ndvi'],
            'avg_ndbi': h['ndbi']
        }).eq('name', h['name']).execute()
        
        print(f"✓ {h['name']:20} - NDVI: {h['ndvi']:.3f}, NDBI: {h['ndbi']:.3f}")
    except Exception as e:
        print(f"✗ {h['name']:20} - Error: {e}")

print("="*60)
print("\nVerifying updates...")

result = sb.table('hotspots').select('name,avg_ndvi,avg_ndbi').execute()
for r in result.data:
    print(f"{r['name']:20} - NDVI: {r.get('avg_ndvi')}, NDBI: {r.get('avg_ndbi')}")

print("="*60 + "\n")
