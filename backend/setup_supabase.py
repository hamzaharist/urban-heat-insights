"""
Automated Supabase Setup Script
Creates tables and uploads data in one go
"""

from supabase import create_client
import os
from dotenv import load_dotenv
import pandas as pd

# Load environment
load_dotenv('../.env')

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_PUBLISHABLE_KEY")

print("\n" + "="*60)
print("Supabase Automated Setup")
print("="*60)
print(f"\nURL: {SUPABASE_URL}")
print(f"Connecting...")

try:
    client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("✓ Connected successfully!\n")
except Exception as e:
    print(f"✗ Connection failed: {e}")
    exit(1)

# SQL to create tables
CREATE_TABLES_SQL = """
-- Create hotspots table
CREATE TABLE IF NOT EXISTS public.hotspots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    city VARCHAR(100) NOT NULL,
    name VARCHAR(200) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    avg_temperature DECIMAL(5, 2),
    intensity VARCHAR(20),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create predictions table
CREATE TABLE IF NOT EXISTS public.predictions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    city VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    predicted_temp DECIMAL(5, 2) NOT NULL,
    confidence_level DECIMAL(3, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create temperature_readings table
CREATE TABLE IF NOT EXISTS public.temperature_readings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    city VARCHAR(100) NOT NULL,
    location_name VARCHAR(200),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    temperature DECIMAL(5, 2),
    feels_like DECIMAL(5, 2),
    humidity INTEGER,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    source VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.hotspots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.temperature_readings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access on hotspots" ON public.hotspots;
DROP POLICY IF EXISTS "Allow public read access on predictions" ON public.predictions;
DROP POLICY IF EXISTS "Allow public read access on temperature_readings" ON public.temperature_readings;

-- Create read policies
CREATE POLICY "Allow public read access on hotspots"
    ON public.hotspots FOR SELECT USING (true);

CREATE POLICY "Allow public read access on predictions"
    ON public.predictions FOR SELECT USING (true);

CREATE POLICY "Allow public read access on temperature_readings"
    ON public.temperature_readings FOR SELECT USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_hotspots_city ON public.hotspots(city);
CREATE INDEX IF NOT EXISTS idx_predictions_city_year ON public.predictions(city, year);
CREATE INDEX IF NOT EXISTS idx_temperature_readings_city_date ON public.temperature_readings(city, recorded_at);
"""

print("Step 1: Creating database tables...")
try:
    # Execute SQL via RPC or direct query
    # Note: Supabase Python client doesn't have direct SQL execution
    # User needs to run this in SQL Editor
    print("\n" + "="*60)
    print("IMPORTANT: Run this SQL in Supabase SQL Editor")
    print("="*60)
    print("\n1. Go to: https://supabase.com/dashboard/project/xntorsihhrdzjwhrohkr/sql/new")
    print("2. Copy the SQL from: supabase/quick_setup.sql")
    print("3. Paste and click 'Run'")
    print("4. Then come back and press Enter to continue...")
    print("="*60 + "\n")
    
    input("Press Enter after running the SQL...")
    
except Exception as e:
    print(f"Note: {e}")

print("\nStep 2: Uploading data...")
print("Running upload script...\n")

# Run the upload script
import subprocess
result = subprocess.run(['python', 'upload_to_supabase.py'], 
                       capture_output=True, text=True)
print(result.stdout)
if result.returncode != 0:
    print("Error:", result.stderr)
else:
    print("\n" + "="*60)
    print("✓ Setup Complete!")
    print("="*60)
    print("\nYour Supabase database is ready!")
    print("Refresh your frontend to see the data.")
    print("="*60 + "\n")
