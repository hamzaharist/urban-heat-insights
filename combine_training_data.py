import pandas as pd
import glob
import os

# Change to the data directory
os.chdir('backend/data')

# 1. FIND ALL FILES
# This looks for any file starting with "UHI_Training_Data_Malaysia_" and ending in ".csv"
all_files = glob.glob("UHI_Training_Data_Malaysia_*.csv")

print(f"Found {len(all_files)} files:")
for f in all_files:
    print(f"  - {f}")

# 2. COMBINE THEM
# We read each file and stack them on top of each other
df_list = []
for filename in all_files:
    temp_df = pd.read_csv(filename)
    print(f"\n{filename}: {len(temp_df)} rows, {len(temp_df.columns)} columns")
    df_list.append(temp_df)

# Concatenate into one big DataFrame
full_data = pd.concat(df_list, ignore_index=True)

print(f"\n--- BEFORE CLEANING ---")
print(f"Total Rows: {len(full_data)}")
print(f"Columns: {full_data.columns.tolist()}")

# 3. CLEANING
# Remove rows with missing values (just in case)
rows_before = len(full_data)
full_data = full_data.dropna()
rows_after = len(full_data)
print(f"\nDropped {rows_before - rows_after} rows with missing values")

# Shuffle the data (Crucial for ML!)
# We don't want the model to learn "2015 first, then 2018..." 
# We want it to see a mix of years to learn the underlying patterns better.
full_data = full_data.sample(frac=1, random_state=42).reset_index(drop=True)

# 4. VERIFY
print("\n--- DATA MERGE COMPLETE ---")
print(f"Total Rows: {len(full_data)}")
print(f"\nFirst few rows:")
print(full_data.head())
print(f"\nData types:")
print(full_data.dtypes)
print(f"\nBasic statistics:")
print(full_data.describe())

# 5. SAVE THE MASTER FILE
output_file = "UHI_Training_Data_Malaysia_Combined.csv"
full_data.to_csv(output_file, index=False)
print(f"\n✅ Saved as '{output_file}'. You are ready to train!")
print(f"📁 Full path: {os.path.abspath(output_file)}")
