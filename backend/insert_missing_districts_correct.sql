-- Correct SQL INSERT statements matching your hotspots table structure
-- Columns: city, name, latitude, longitude, avg_temperature, avg_ndvi, avg_ndbi,
--          district, state, elevation, population, state_name, district_name

INSERT INTO hotspots (city, name, latitude, longitude, avg_temperature, avg_ndvi, avg_ndbi, district, state, elevation, population, state_name, district_name)
VALUES ('Alur Gajah', 'Alur Gajah', 2.392262, 102.203956, 33.434895, 0.740123, -0.304785, 'Alur Gajah', 'Melaka', 44.187970, 1.942594, 'Melaka', 'Alur Gajah');

INSERT INTO hotspots (city, name, latitude, longitude, avg_temperature, avg_ndvi, avg_ndbi, district, state, elevation, population, state_name, district_name)
VALUES ('Batu Pahit', 'Batu Pahit', 1.832480, 103.080025, 31.596545, 0.733798, -0.316636, 'Batu Pahit', 'Johor', 14.456897, 2.411956, 'Johor', 'Batu Pahit');

INSERT INTO hotspots (city, name, latitude, longitude, avg_temperature, avg_ndvi, avg_ndbi, district, state, elevation, population, state_name, district_name)
VALUES ('Bentung', 'Bentung', 3.375319, 102.031770, 28.380047, 0.764755, -0.340348, 'Bentung', 'Pahang', 327.634675, 0.520905, 'Pahang', 'Bentung');

INSERT INTO hotspots (city, name, latitude, longitude, avg_temperature, avg_ndvi, avg_ndbi, district, state, elevation, population, state_name, district_name)
VALUES ('Kelang', 'Kelang', 3.045738, 101.388622, 38.159775, 0.575773, -0.241288, 'Kelang', 'Selangor', 5.252336, 16.208064, 'Selangor', 'Kelang');

INSERT INTO hotspots (city, name, latitude, longitude, avg_temperature, avg_ndvi, avg_ndbi, district, state, elevation, population, state_name, district_name)
VALUES ('Labuk & Sugut', 'Labuk & Sugut', 6.082199, 117.290200, 31.979871, 0.827134, -0.405816, 'Labuk & Sugut', 'Sabah', 130.963265, 0.150301, 'Sabah', 'Labuk & Sugut');

INSERT INTO hotspots (city, name, latitude, longitude, avg_temperature, avg_ndvi, avg_ndbi, district, state, elevation, population, state_name, district_name)
VALUES ('Pensiangan', 'Pensiangan', 4.605633, 116.527639, 25.870440, 0.798909, -0.399922, 'Pensiangan', 'Sabah', 581.973982, 0.060900, 'Sabah', 'Pensiangan');

INSERT INTO hotspots (city, name, latitude, longitude, avg_temperature, avg_ndvi, avg_ndbi, district, state, elevation, population, state_name, district_name)
VALUES ('Temerluh', 'Temerluh', 3.426940, 102.384491, 31.328877, 0.797114, -0.348322, 'Temerluh', 'Pahang', 105.864198, 0.518283, 'Pahang', 'Temerluh');

-- Success! After running these, refresh your choropleth map to see the 7 new districts colored in!
