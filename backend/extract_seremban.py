"""Seremban (2016-2024) - 5 districts"""
import ee, pandas as pd, os
from datetime import datetime, timedelta
from dotenv import load_dotenv
load_dotenv()

def init_gee():
    try:
        pid, kf = os.getenv("GEE_PROJECT_ID"), os.getenv("GEE_PRIVATE_KEY_PATH")
        ee.Initialize(ee.ServiceAccountCredentials(None, kf) if kf and os.path.exists(kf) else None, project=pid)
        print("✓ GEE OK")
        return True
    except: return False

DISTRICTS = [
    {'name': 'Seremban City', 'lat': 2.7258, 'lon': 101.9424},
    {'name': 'Senawang', 'lat': 2.7000, 'lon': 101.9667},
    {'name': 'Nilai', 'lat': 2.8167, 'lon': 101.8000},
    {'name': 'Port Dickson', 'lat': 2.5167, 'lon': 101.8000},
    {'name': 'Rasah', 'lat': 2.7333, 'lon': 101.9500},
    {'name': 'Seremban 2', 'lat': 2.7000, 'lon': 101.9333},
    {'name': 'Paroi', 'lat': 2.7500, 'lon': 101.9833},
    {'name': 'Mantin', 'lat': 2.8167, 'lon': 101.9000},
    {'name': 'Labu', 'lat': 2.7667, 'lon': 101.8333},
    {'name': 'Ampangan', 'lat': 2.7167, 'lon': 101.9167},
]

def get_data(lat, lon, date_str):
    try:
        pt, dt = ee.Geometry.Point([lon, lat]), ee.Date(date_str)
        for cn in ['LANDSAT/LC09/C02/T1_L2', 'LANDSAT/LC08/C02/T1_L2']:
            col = ee.ImageCollection(cn).filterDate(dt, dt.advance(1, 'day')).filterBounds(pt)
            if col.size().getInfo() > 0:
                img = col.first()
                temp = img.select('ST_B10').multiply(0.00341802).add(149.0).subtract(273.15).reduceRegion(reducer=ee.Reducer.mean(), geometry=pt, scale=30).get('ST_B10').getInfo()
                nir, red = img.select('SR_B5'), img.select('SR_B4')
                ndvi = nir.subtract(red).divide(nir.add(red)).reduceRegion(reducer=ee.Reducer.mean(), geometry=pt, scale=30).get('SR_B5').getInfo()
                ndbi = img.select('SR_B6').subtract(nir).divide(img.select('SR_B6').add(nir)).reduceRegion(reducer=ee.Reducer.mean(), geometry=pt, scale=30).get('SR_B6').getInfo()
                if temp: return {'temperature': round(temp, 2), 'ndvi': round(ndvi, 3) if ndvi else None, 'ndbi': round(ndbi, 3) if ndbi else None}
    except: pass
    return None

if __name__ == "__main__":
    print("\nSEREMBAN (2016-2024)\n" + "="*60)
    if not init_gee(): exit()
    data, dates = [], []
    d = datetime(2016, 1, 1)
    while d <= datetime(2024, 12, 31):
        dates.append(d)
        d += timedelta(days=30)
    print(f"{len(DISTRICTS)} districts × {len(dates)} dates = {len(DISTRICTS)*len(dates)}\n")
    for dist in DISTRICTS:
        print(f"📍 {dist['name']}")
        s = 0
        for i, dt in enumerate(dates):
            if (i+1) % 5 == 0 or i == 0: print(f"  [{i+1}/{len(dates)}]...", end=' ')
            r = get_data(dist['lat'], dist['lon'], dt.strftime('%Y-%m-%d'))
            if r:
                data.append({'city': 'Seremban', 'district': dist['name'], 'latitude': dist['lat'], 'longitude': dist['lon'], 'date': dt.strftime('%Y-%m-%d'), 'temperature': r['temperature'], 'ndvi': r['ndvi'], 'ndbi': r['ndbi'], 'year': dt.year, 'month': dt.month})
                s += 1
                if (i+1) % 5 == 0 or i == 0: print("✓")
            else:
                if (i+1) % 5 == 0 or i == 0: print("✗")
        print(f"  {s}/{len(dates)}\n")
    if data:
        os.makedirs('data', exist_ok=True)
        pd.DataFrame(data).to_parquet('data/seremban_2016_2024.parquet', index=False)
        print(f"✓ Saved ({len(data)} records)\n")
