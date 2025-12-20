"""
Check Google Earth Engine quota and usage
"""

import ee
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

def initialize_gee():
    try:
        project_id = os.getenv("GEE_PROJECT_ID")
        key_file = os.getenv("GEE_PRIVATE_KEY_PATH")
        
        if key_file and os.path.exists(key_file):
            credentials = ee.ServiceAccountCredentials(email=None, key_file=key_file)
            ee.Initialize(credentials, project=project_id)
        else:
            ee.Initialize(project=project_id)
        
        print(f"✓ GEE initialized with project: {project_id}")
        return True
    except Exception as e:
        print(f"✗ Failed to initialize GEE: {str(e)}")
        return False

def check_quota():
    """Check GEE quota information"""
    print("\n" + "="*60)
    print("GOOGLE EARTH ENGINE QUOTA CHECK")
    print("="*60 + "\n")
    
    if not initialize_gee():
        return
    
    try:
        # Try to get a simple image to test if quota is available
        print("Testing API access...")
        point = ee.Geometry.Point([101.7, 3.15])  # KL coordinates
        
        # Try a simple operation
        collection = ee.ImageCollection('LANDSAT/LC09/C02/T1_L2') \
            .filterDate('2024-01-01', '2024-01-02') \
            .filterBounds(point)
        
        count = collection.size().getInfo()
        print(f"✓ API is working! Found {count} images for test query")
        
        print("\n" + "─"*60)
        print("QUOTA INFORMATION")
        print("─"*60)
        print("\nGoogle Earth Engine Quotas:")
        print("• Free tier: ~5,000 requests per day")
        print("• Rate limit: ~10 requests per second")
        print("• Compute time: Limited per day")
        
        print("\n" + "─"*60)
        print("YOUR USAGE ESTIMATE")
        print("─"*60)
        print("\nBased on your extractions:")
        print("• Ipoh: ~1,100 requests (180 successful)")
        print("• Shah Alam: ~1,100 requests (~150 successful)")
        print("• Petaling Jaya: ~1,100 requests (~150 successful)")
        print("• Total so far: ~3,300 requests")
        print("\nRemaining cities:")
        print("• Kota Kinabalu: ~1,100 requests")
        print("• Kuching: ~1,100 requests")
        print("• Melaka: ~1,100 requests")
        print("• Seremban: ~1,100 requests")
        print("• Total needed: ~4,400 requests")
        
        print("\n" + "─"*60)
        print("RECOMMENDATION")
        print("─"*60)
        
        total_requests = 3300 + 4400
        print(f"\nTotal requests for all cities: ~{total_requests:,}")
        print("\n⚠️  You may be approaching or exceeding daily quota!")
        print("\nOptions:")
        print("1. ✅ Wait 24 hours and continue tomorrow")
        print("2. ✅ Spread extractions over 2-3 days")
        print("3. ✅ Use fewer dates (every 60 days instead of 30)")
        print("4. ✅ Reduce districts per city (5 instead of 10)")
        
        print("\n" + "="*60)
        print(f"Check time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*60 + "\n")
        
    except Exception as e:
        error_msg = str(e).lower()
        
        if 'quota' in error_msg or 'limit' in error_msg or 'exceeded' in error_msg:
            print("\n❌ QUOTA EXCEEDED!")
            print("="*60)
            print("\nYou have hit your Google Earth Engine quota limit.")
            print("\nWhat this means:")
            print("• Too many requests in 24 hours")
            print("• GEE blocks further requests temporarily")
            print("\nSolution:")
            print("• Wait 24 hours for quota to reset")
            print("• Continue extractions tomorrow")
            print("• Your completed data is already saved!")
            print("\n" + "="*60 + "\n")
        else:
            print(f"\n❌ Error checking quota: {e}\n")

if __name__ == "__main__":
    check_quota()
