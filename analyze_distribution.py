import pandas as pd
import numpy as np

# Load data
train = pd.read_csv('backend/data/UHI_Dataset_Cleaned_Final.csv')
test = pd.read_csv('backend/data/Malaysia_UHI_2025_Only.csv')
test_clean = test[(test['LST'] >= 15) & (test['LST'] <= 50)]

print('=' * 70)
print('TEMPERATURE DISTRIBUTION IMBALANCE ANALYSIS')
print('=' * 70)

print('\nTRAINING DATA (Historical 2016-2024):')
print(f'  Samples: {len(train):,}')
print(f'  Mean:    {train["LST"].mean():.2f}°C')
print(f'  Std Dev: {train["LST"].std():.2f}°C')
print(f'  Range:   {train["LST"].min():.2f}°C - {train["LST"].max():.2f}°C')

print('\n  Distribution by temperature range:')
ranges = [
    (20, 25, '20-25°C (Cool)'),
    (25, 30, '25-30°C (Moderate)'),
    (30, 35, '30-35°C (Warm)'),
    (35, 40, '35-40°C (Hot)'),
    (40, 60, '40-60°C (Very Hot)')
]

for min_t, max_t, label in ranges:
    count = len(train[(train['LST'] >= min_t) & (train['LST'] < max_t)])
    pct = count / len(train) * 100
    bar = '█' * int(pct / 2)
    print(f'    {label:20s}: {count:6,} ({pct:5.1f}%) {bar}')

print('\n2025 TEST DATA (Cleaned):')
print(f'  Samples: {len(test_clean):,}')
print(f'  Mean:    {test_clean["LST"].mean():.2f}°C')
print(f'  Std Dev: {test_clean["LST"].std():.2f}°C')
print(f'  Range:   {test_clean["LST"].min():.2f}°C - {test_clean["LST"].max():.2f}°C')

print('\n  Distribution by temperature range:')
ranges_2025 = [
    (15, 25, '15-25°C (Cool)'),
    (25, 30, '25-30°C (Moderate)'),
    (30, 35, '30-35°C (Warm)'),
    (35, 40, '35-40°C (Hot)'),
    (40, 50, '40-50°C (Very Hot)')
]

for min_t, max_t, label in ranges_2025:
    count = len(test_clean[(test_clean['LST'] >= min_t) & (test_clean['LST'] < max_t)])
    pct = count / len(test_clean) * 100
    bar = '█' * int(pct / 2)
    print(f'    {label:20s}: {count:7,} ({pct:5.1f}%) {bar}')

print('\n' + '=' * 70)
print('IMBALANCE SUMMARY')
print('=' * 70)

train_cool = len(train[train['LST'] < 30]) / len(train) * 100
train_hot = len(train[train['LST'] >= 35]) / len(train) * 100

test_cool = len(test_clean[test_clean['LST'] < 30]) / len(test_clean) * 100
test_hot = len(test_clean[test_clean['LST'] >= 35]) / len(test_clean) * 100

print(f'\nTraining: {train_cool:.1f}% cool (<30°C), {train_hot:.1f}% hot (≥35°C)')
print(f'2025 Test: {test_cool:.1f}% cool (<30°C), {test_hot:.1f}% hot (≥35°C)')

print(f'\n⚠️  The model was trained on HOTTER data (avg {train["LST"].mean():.1f}°C)')
print(f'    but is being tested on COOLER data (avg {test_clean["LST"].mean():.1f}°C)')
print(f'    Temperature difference: {abs(train["LST"].mean() - test_clean["LST"].mean()):.1f}°C')

print('\nThis explains the poor R² performance!')
print('=' * 70)
