"""
Test Supabase update with detailed error checking
"""
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

url = os.getenv('VITE_SUPABASE_URL')
key = os.getenv('VITE_SUPABASE_PUBLISHABLE_KEY')

print("\n" + "="*60)
print("Testing Supabase Update")
print("="*60)

sb = create_client(url, key)

# Get first hotspot
result = sb.table('hotspots').select('*').limit(1).execute()
hotspot = result.data[0]

print(f"\nTesting with: {hotspot['name']} (ID: {hotspot['id']})")
print(f"Current NDVI: {hotspot.get('avg_ndvi')}")
print(f"Current NDBI: {hotspot.get('avg_ndbi')}")

# Try to update
print("\nAttempting update...")
try:
    update_result = sb.table('hotspots').update({
        'avg_ndvi': 0.123,
        'avg_ndbi': 0.456
    }).eq('id', hotspot['id']).execute()
    
    print(f"✓ Update successful!")
    print(f"Response: {update_result}")
    
    # Verify
    verify = sb.table('hotspots').select('avg_ndvi,avg_ndbi').eq('id', hotspot['id']).execute()
    print(f"\nVerification:")
    print(f"NDVI: {verify.data[0].get('avg_ndvi')}")
    print(f"NDBI: {verify.data[0].get('avg_ndbi')}")
    
except Exception as e:
    print(f"✗ Update failed: {e}")

print("="*60 + "\n")
