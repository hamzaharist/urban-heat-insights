from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

url = os.getenv('VITE_SUPABASE_URL')
key = os.getenv('VITE_SUPABASE_PUBLISHABLE_KEY')

sb = create_client(url, key)
result = sb.table('hotspots').select('name,city,avg_ndvi,avg_ndbi').execute()

print("\n" + "="*60)
print("Hotspot Data in Supabase:")
print("="*60)
for r in result.data:
    ndvi = r.get('avg_ndvi', 'NULL')
    ndbi = r.get('avg_ndbi', 'NULL')
    print(f"{r['name']:20} ({r['city']:15}): NDVI={ndvi}, NDBI={ndbi}")
print("="*60 + "\n")
