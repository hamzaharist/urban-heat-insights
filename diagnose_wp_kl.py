"""
Diagnostic script to test all aspects of W.P. Kuala Lumpur functionality
Run this and share the output with me
"""
import requests
import json

print("\n" + "="*80)
print("W.P. KUALA LUMPUR DIAGNOSTIC TEST")
print("="*80)

# Test 1: Check GeoJSON endpoint
print("\n[TEST 1] Checking GeoJSON for W.P. Kuala Lumpur...")
try:
    response = requests.get("http://localhost:8000/api/geojson/districts?enrich=true")
    if response.ok:
        data = response.json()
        kl_districts = [f for f in data['features'] 
                       if 'kuala lumpur' in f['properties']['name'].lower()]
        
        if kl_districts:
            for d in kl_districts:
                props = d['properties']
                print(f"✅ Found: {props['name']}")
                print(f"   Temperature: {props.get('avg_temperature', 'N/A')}°C")
                print(f"   NDVI: {props.get('avg_ndvi', 'N/A')}")
                print(f"   NDBI: {props.get('avg_ndbi', 'N/A')}")
        else:
            print("❌ W.P. Kuala Lumpur not found in GeoJSON")
    else:
        print(f"❌ GeoJSON API failed: {response.status_code}")
except Exception as e:
    print(f"❌ Error: {e}")

# Test 2: Test scenario API with "Kuala Lumpur" (normalized)
print("\n[TEST 2] Testing scenario API with 'Kuala Lumpur' (normalized)...")
try:
    payload = {
        "city": "Kuala Lumpur",
        "ndvi_change": 0.1,
        "ndbi_change": -0.1
    }
    response = requests.post(
        "http://localhost:8000/api/spatial/scenario-single",
        json=payload
    )
    print(f"   Status: {response.status_code}")
    if response.ok:
        result = response.json()
        print(f"   ✅ SUCCESS!")
        print(f"   Original temp: {result['original_temp']}°C")
        print(f"   Predicted temp: {result['predicted_temp']}°C")
        print(f"   Change: {result['temp_difference']:+.2f}°C")
    else:
        print(f"   ❌ FAILED: {response.text}")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Test 3: Test scenario API with "W.P. Kuala Lumpur" (non-normalized)
print("\n[TEST 3] Testing scenario API with 'W.P. Kuala Lumpur' (NOT normalized)...")
try:
    payload = {
        "city": "W.P. Kuala Lumpur",
        "ndvi_change": 0.1,
        "ndbi_change": -0.1
    }
    response = requests.post(
        "http://localhost:8000/api/spatial/scenario-single",
        json=payload
    )
    print(f"   Status: {response.status_code}")
    if response.ok:
        result = response.json()
        print(f"   ✅ SUCCESS (unexpected - normalization not needed?)")
    else:
        print(f"   ❌ FAILED (expected - needs normalization)")
        print(f"   Error: {response.text}")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Test 4: Check frontend is running
print("\n[TEST 4] Checking if frontend is accessible...")
try:
    response = requests.get("http://localhost:8080")
    print(f"   Status: {response.status_code}")
    if response.ok:
        print(f"   ✅ Frontend is running")
    else:
        print(f"   ❌ Frontend returned {response.status_code}")
except Exception as e:
    print(f"   ❌ Cannot reach frontend: {e}")

print("\n" + "="*80)
print("SUMMARY")
print("="*80)
print("\nBackend tests complete. If all tests pass, the issue is in the frontend.")
print("\nPLEASE ALSO:")
print("1. Open http://localhost:8080/scenarios in your browser")
print("2. Press F12 to open DevTools → Console tab")
print("3. Select W.P. Kuala Lumpur from dropdown")
print("4. Adjust sliders and click 'Predict Temperature'")
print("5. Copy ALL console messages and share them")
print("6. Tell me: Does an error ALERT pop up? If yes, what does it say?")
print("="*80 + "\n")
