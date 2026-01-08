"""
Debug script to check district enrichment
"""

import requests
import json

# Fetch from the API
response = requests.get('http://localhost:8000/api/geojson/districts?enrich=true')
data = response.json()

total = len(data['features'])
enriched = 0
missing = []

for feature in data['features']:
    props = feature['properties']
    temp = props.get('avg_temperature')

    if temp is not None:
        enriched += 1
    else:
        missing.append(props.get('name', 'Unknown'))

print('=' * 60)
print('DISTRICT ENRICHMENT DEBUG')
print('=' * 60)
print(f'Total districts in GeoJSON: {total}')
print(f'Districts with temperature: {enriched}')
print(f'Districts missing data: {len(missing)}')
print(f'Enrichment rate: {enriched/total*100:.1f}%')

if missing:
    print(f'\nMissing districts ({len(missing)}):')
    for d in sorted(missing):
        print(f'  - {d}')
else:
    print('\nSUCCESS! All districts have temperature data!')

# Sample a few districts to verify data
print('\nSample of 5 enriched districts:')
count = 0
for feature in data['features']:
    if count >= 5:
        break
    props = feature['properties']
    if props.get('avg_temperature'):
        print(f"  - {props.get('name')}: {props.get('avg_temperature'):.2f}°C")
        count += 1
