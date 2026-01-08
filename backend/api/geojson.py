"""
GeoJSON API endpoints for choropleth map
Returns enriched GeoJSON with temperature aggregations
"""

from fastapi import APIRouter, HTTPException
from supabase import create_client, Client
import os
import json
import re

router = APIRouter()

def normalize_name(name: str) -> str:
    """Normalize district/state name for matching"""
    if not name:
        return ""
    # Convert to lowercase, remove extra spaces
    name = name.lower().strip()
    # Common variations (order matters - do specific replacements first)
    name = name.replace('kuala terengganu', 'terengganu')
    name = name.replace('alur gajah', 'alor gajah')
    name = name.replace('batu pahit', 'batu pahat')
    name = name.replace('bentung', 'bentong')
    name = name.replace('kelang', 'klang')
    name = name.replace('temerluh', 'temerloh')
    name = name.replace('labuk & sugut', 'labuk-sugut')
    name = name.replace('labuk and sugut', 'labuk-sugut')
    # Remove common prefixes/suffixes
    name = re.sub(r'\s+', ' ', name)  # normalize spaces
    return name

def find_best_match(target_name: str, available_names: dict) -> str:
    """Find best matching district name from available names"""
    target_norm = normalize_name(target_name)

    # Try exact match first
    if target_norm in available_names:
        return target_norm

    # Try partial match (one name contains the other)
    for available_name in available_names.keys():
        if target_norm in available_name or available_name in target_norm:
            return available_name

    # Try word-by-word match
    target_words = set(target_norm.split())
    best_match = None
    best_score = 0

    for available_name in available_names.keys():
        available_words = set(available_name.split())
        common_words = target_words & available_words
        score = len(common_words)

        if score > best_score and score > 0:
            best_score = score
            best_match = available_name

    return best_match

# Initialize Supabase client (lazy loaded)
_supabase_client = None

def get_supabase():
    """Get or create Supabase client (lazy initialization)"""
    global _supabase_client
    if _supabase_client is None:
        url = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
        key = os.getenv("SUPABASE_ANON_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")
        if url and key:
            _supabase_client = create_client(url, key)
    return _supabase_client

# Load base GeoJSON files
BASE_DIR = os.path.dirname(__file__)
STATES_GEOJSON_PATH = os.path.join(BASE_DIR, "data", "malaysia_states.geojson")
DISTRICTS_GEOJSON_PATH = os.path.join(BASE_DIR, "data", "malaysia_districts_filtered.geojson")

def load_geojson(filepath):
    """Load GeoJSON file"""
    if not os.path.exists(filepath):
        return {"type": "FeatureCollection", "features": []}
    
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

@router.get("/api/geojson/states")
async def get_states(enrich: bool = False):
    """Get states GeoJSON, optionally enriched with temperature data"""
    geojson = load_geojson(STATES_GEOJSON_PATH)

    if not enrich:
        return geojson

    # Get aggregations from Supabase
    try:
        supabase = get_supabase()
        if not supabase:
            return geojson

        print("[GeoJSON] Aggregating state data from district_aggregates...")

        # Aggregate from district_aggregates table by state_name
        result = supabase.table('district_aggregates').select(
            'state_name, avg_temperature, min_temperature, max_temperature, '
            'avg_ndvi, avg_ndbi, data_points'
        ).execute()

        if not result.data:
            print("[GeoJSON] No district data found for state aggregation")
            return geojson

        # Aggregate by state
        state_aggregations = {}
        for row in result.data:
            state_name = row['state_name']
            if not state_name:
                continue

            if state_name not in state_aggregations:
                state_aggregations[state_name] = {
                    'temps': [],
                    'min_temps': [],
                    'max_temps': [],
                    'ndvi': [],
                    'ndbi': [],
                    'hotspot_count': 0
                }

            agg = state_aggregations[state_name]
            if row['avg_temperature']:
                agg['temps'].append(float(row['avg_temperature']))
            if row['min_temperature']:
                agg['min_temps'].append(float(row['min_temperature']))
            if row['max_temperature']:
                agg['max_temps'].append(float(row['max_temperature']))
            if row['avg_ndvi']:
                agg['ndvi'].append(float(row['avg_ndvi']))
            if row['avg_ndbi']:
                agg['ndbi'].append(float(row['avg_ndbi']))
            if row.get('data_points'):
                agg['hotspot_count'] += int(row['data_points'])

        # Compute averages
        aggregations = {}
        for state_name, data in state_aggregations.items():
            aggregations[normalize_name(state_name)] = {
                'avg_temperature': sum(data['temps']) / len(data['temps']) if data['temps'] else None,
                'min_temperature': min(data['min_temps']) if data['min_temps'] else None,
                'max_temperature': max(data['max_temps']) if data['max_temps'] else None,
                'avg_ndvi': sum(data['ndvi']) / len(data['ndvi']) if data['ndvi'] else None,
                'avg_ndbi': sum(data['ndbi']) / len(data['ndbi']) if data['ndbi'] else None,
                'hotspot_count': data['hotspot_count'],
                'state_name': state_name
            }

        print(f"[GeoJSON] Created {len(aggregations)} state aggregations")
        print(f"[GeoJSON] Sample states: {list(aggregations.keys())[:5]}")

        # Enrich features
        for feature in geojson['features']:
            # Get state name from properties
            state_name = feature['properties'].get('name')
            if not state_name:
                continue

            # Try to match
            matched_name = find_best_match(state_name, aggregations)

            if matched_name and matched_name in aggregations:
                agg = aggregations[matched_name]
                feature['properties'].update({
                    'avg_temperature': float(agg['avg_temperature']) if agg['avg_temperature'] else None,
                    'min_temperature': float(agg['min_temperature']) if agg['min_temperature'] else None,
                    'max_temperature': float(agg['max_temperature']) if agg['max_temperature'] else None,
                    'hotspot_count': int(agg['hotspot_count']) if agg['hotspot_count'] else 0,
                    'avg_ndvi': float(agg['avg_ndvi']) if agg.get('avg_ndvi') else None,
                    'avg_ndbi': float(agg['avg_ndbi']) if agg.get('avg_ndbi') else None,
                    'state_name': agg.get('state_name'),
                })
    except Exception as e:
        print(f"[GeoJSON] Error enriching states: {e}")
        import traceback
        traceback.print_exc()

    return geojson

@router.get("/api/geojson/districts")
async def get_districts(enrich: bool = False):
    """Get districts GeoJSON, optionally enriched with temperature data"""
    geojson = load_geojson(DISTRICTS_GEOJSON_PATH)

    if not enrich:
        return geojson

    # Get aggregations from Supabase
    try:
        supabase = get_supabase()
        if not supabase:
            return geojson

        # NEW OPTIMIZED APPROACH: Use pre-aggregated district_aggregates table
        # This fetches 131 rows instead of 42K+ rows - instant response!
        print("[GeoJSON] Fetching district aggregates from pre-computed table...")

        result = supabase.table('district_aggregates').select(
            'district_name, state_name, avg_temperature, min_temperature, max_temperature, '
            'avg_ndvi, avg_ndbi, data_points, total_population'
        ).execute()

        if not result.data:
            print("[GeoJSON] No district aggregates found")
            return geojson

        print(f"[GeoJSON] Loaded {len(result.data)} district aggregates")

        # Create aggregations dict
        aggregations = {}
        for row in result.data:
            district_name = row['district_name']
            if district_name:
                normalized = normalize_name(district_name)
                aggregations[normalized] = {
                    'district_name': district_name,
                    'avg_temperature': row['avg_temperature'],
                    'min_temperature': row['min_temperature'],
                    'max_temperature': row['max_temperature'],
                    'hotspot_count': row.get('data_points', 0),
                    'avg_ndvi': row['avg_ndvi'],
                    'avg_ndbi': row['avg_ndbi'],
                    'state_name': row['state_name'],
                    'total_population': row.get('total_population', 0)
                }

        print(f"[GeoJSON] Created {len(aggregations)} district aggregations")
        print(f"[GeoJSON] Sample: {list(aggregations.keys())[:5]}")

        # Enrich features with smart matching
        for feature in geojson['features']:
            district_name = feature['properties'].get('name', '')

            # Try to find best match
            matched_name = find_best_match(district_name, aggregations)

            if matched_name and matched_name in aggregations:
                agg = aggregations[matched_name]
                feature['properties'].update({
                    'avg_temperature': float(agg['avg_temperature']) if agg['avg_temperature'] else None,
                    'min_temperature': float(agg['min_temperature']) if agg['min_temperature'] else None,
                    'max_temperature': float(agg['max_temperature']) if agg['max_temperature'] else None,
                    'hotspot_count': int(agg['hotspot_count']) if agg['hotspot_count'] else 0,
                    'avg_ndvi': float(agg['avg_ndvi']) if agg.get('avg_ndvi') else None,
                    'avg_ndbi': float(agg['avg_ndbi']) if agg.get('avg_ndbi') else None,
                    'district_name': agg.get('district_name'),
                    'state_name': agg.get('state_name'),
                    'total_population': float(agg['total_population']) if agg.get('total_population') else None,
                })
    except Exception as e:
        print(f"Error enriching districts: {e}")
        import traceback
        traceback.print_exc()

    return geojson
