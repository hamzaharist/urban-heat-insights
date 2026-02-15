"""
Quick test script to verify W.P. Kuala Lumpur scenario prediction
"""
import requests
import json

# Test with normalized name
print("=" * 70)
print("Testing W.P. Kuala Lumpur → Kuala Lumpur normalization")
print("=" * 70)

test_data = {
    "city": "Kuala Lumpur",  # After normalization
    "ndvi_change": 0.1,
    "ndbi_change": -0.1
}

print(f"\nRequest payload:")
print(json.dumps(test_data, indent=2))

try:
    response = requests.post(
        "http://localhost:8000/api/spatial/scenario-single",
        json=test_data
    )
    
    print(f"\nResponse status: {response.status_code}")
    
    if response.ok:
        result = response.json()
        print("\n✅ SUCCESS! Prediction results:")
        print(f"  Original temp:   {result['original_temp']}°C")
        print(f"  Predicted temp:  {result['predicted_temp']}°C")
        print(f"  Temperature change: {result['temp_difference']:+.2f}°C")
        print(f"  Confidence: {result['confidence_score']*100:.1f}%")
    else:
        print(f"\n❌ ERROR: {response.text}")
        
except Exception as e:
    print(f"\n❌ Exception: {e}")

print("\n" + "=" * 70)
print("If this test succeeds, the backend is working correctly.")
print("Issue might be in frontend JavaScript - check browser console!")
print("=" * 70)
