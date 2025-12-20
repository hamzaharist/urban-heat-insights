@echo off
REM Quick start script for data extraction and upload

echo ========================================
echo GEE Data Extraction Pipeline
echo ========================================
echo.

echo Step 1: Extracting data from Google Earth Engine...
echo This will take 30-60 minutes.
echo.
python extract_gee_data.py

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Data extraction failed!
    echo Please check your GEE credentials and try again.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Step 2: Uploading data to Supabase...
echo ========================================
echo.
python upload_to_supabase.py

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Upload failed!
    echo Please check your Supabase credentials.
    pause
    exit /b 1
)

echo.
echo ========================================
echo SUCCESS! Data extraction complete.
echo ========================================
echo.
echo Next steps:
echo 1. Check Supabase dashboard to verify data
echo 2. Refresh your frontend
echo 3. Test the application
echo.
pause
