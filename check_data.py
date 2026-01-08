import pandas as pd

# Load the combined dataset
df = pd.read_csv('backend/data/UHI_Training_Data_Malaysia_Combined.csv')

print("Columns in dataset:")
for i, col in enumerate(df.columns):
    print(f"  {i}: '{col}'")

print(f"\nTotal rows: {len(df)}")
print(f"\nData types:")
print(df.dtypes)

# Get statistics for numeric columns only
numeric_df = df.select_dtypes(include=['float64', 'int64'])
print(f"\nNumeric columns: {list(numeric_df.columns)}")

print("\n" + "="*80)
print("STATISTICS FOR ALL NUMERIC COLUMNS (Except Year):")
print("="*80)

# Exclude Year column
cols_to_analyze = [col for col in numeric_df.columns if 'year' not in col.lower()]
print(f"\nAnalyzing: {cols_to_analyze}")

stats = df[cols_to_analyze].describe()
print("\n" + stats.to_string())
