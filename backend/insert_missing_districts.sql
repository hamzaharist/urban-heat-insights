-- SQL INSERT statements for missing districts
-- Copy and paste these into Supabase SQL Editor

INSERT INTO hotspots (
  district_name, city, state_name,
  avg_temperature, min_temperature, max_temperature,
  avg_ndvi, avg_ndbi, elevation, population,
  latitude, longitude, hotspot_count
) VALUES (
  'Alur Gajah', 'Alur Gajah', 'Melaka',
  33.434895, 28.411614, 39.966230,
  0.740123, -0.304785, 44.187970, 1.942594,
  2.392262, 102.203956, 133
);

INSERT INTO hotspots (
  district_name, city, state_name,
  avg_temperature, min_temperature, max_temperature,
  avg_ndvi, avg_ndbi, elevation, population,
  latitude, longitude, hotspot_count
) VALUES (
  'Batu Pahit', 'Batu Pahit', 'Johor',
  31.596545, 25.815628, 54.942285,
  0.733798, -0.316636, 14.456897, 2.411956,
  1.832480, 103.080025, 116
);

INSERT INTO hotspots (
  district_name, city, state_name,
  avg_temperature, min_temperature, max_temperature,
  avg_ndvi, avg_ndbi, elevation, population,
  latitude, longitude, hotspot_count
) VALUES (
  'Bentung', 'Bentung', 'Pahang',
  28.380047, 17.277414, 38.195696,
  0.764755, -0.340348, 327.634675, 0.520905,
  3.375319, 102.031770, 323
);

INSERT INTO hotspots (
  district_name, city, state_name,
  avg_temperature, min_temperature, max_temperature,
  avg_ndvi, avg_ndbi, elevation, population,
  latitude, longitude, hotspot_count
) VALUES (
  'Kelang', 'Kelang', 'Selangor',
  38.159775, 30.980256, 49.372621,
  0.575773, -0.241288, 5.252336, 16.208064,
  3.045738, 101.388622, 107
);

INSERT INTO hotspots (
  district_name, city, state_name,
  avg_temperature, min_temperature, max_temperature,
  avg_ndvi, avg_ndbi, elevation, population,
  latitude, longitude, hotspot_count
) VALUES (
  'Labuk & Sugut', 'Labuk & Sugut', 'Sabah',
  31.979871, 22.982089, 40.784846,
  0.827134, -0.405816, 130.963265, 0.150301,
  6.082199, 117.290200, 1470
);

INSERT INTO hotspots (
  district_name, city, state_name,
  avg_temperature, min_temperature, max_temperature,
  avg_ndvi, avg_ndbi, elevation, population,
  latitude, longitude, hotspot_count
) VALUES (
  'Pensiangan', 'Pensiangan', 'Sabah',
  25.870440, 14.091819, 32.538873,
  0.798909, -0.399922, 581.973982, 0.060900,
  4.605633, 116.527639, 884
);

INSERT INTO hotspots (
  district_name, city, state_name,
  avg_temperature, min_temperature, max_temperature,
  avg_ndvi, avg_ndbi, elevation, population,
  latitude, longitude, hotspot_count
) VALUES (
  'Temerluh', 'Temerluh', 'Pahang',
  31.328877, 17.106513, 37.659067,
  0.797114, -0.348322, 105.864198, 0.518283,
  3.426940, 102.384491, 810
);

-- After running these, your choropleth should show 137/160 districts (85.6%)
