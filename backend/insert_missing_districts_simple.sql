-- Simplified SQL INSERT statements for missing districts
-- These match the typical hotspots table structure

-- First, check what columns your hotspots table has:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'hotspots';

-- If the table doesn't have min/max temperature columns, use this simpler version:

INSERT INTO hotspots (district_name, city, state_name, avg_temperature, avg_ndvi, avg_ndbi, elevation, population, latitude, longitude)
VALUES ('Alur Gajah', 'Alur Gajah', 'Melaka', 33.434895, 0.740123, -0.304785, 44.187970, 1.942594, 2.392262, 102.203956);

INSERT INTO hotspots (district_name, city, state_name, avg_temperature, avg_ndvi, avg_ndbi, elevation, population, latitude, longitude)
VALUES ('Batu Pahit', 'Batu Pahit', 'Johor', 31.596545, 0.733798, -0.316636, 14.456897, 2.411956, 1.832480, 103.080025);

INSERT INTO hotspots (district_name, city, state_name, avg_temperature, avg_ndvi, avg_ndbi, elevation, population, latitude, longitude)
VALUES ('Bentung', 'Bentung', 'Pahang', 28.380047, 0.764755, -0.340348, 327.634675, 0.520905, 3.375319, 102.031770);

INSERT INTO hotspots (district_name, city, state_name, avg_temperature, avg_ndvi, avg_ndbi, elevation, population, latitude, longitude)
VALUES ('Kelang', 'Kelang', 'Selangor', 38.159775, 0.575773, -0.241288, 5.252336, 16.208064, 3.045738, 101.388622);

INSERT INTO hotspots (district_name, city, state_name, avg_temperature, avg_ndvi, avg_ndbi, elevation, population, latitude, longitude)
VALUES ('Labuk & Sugut', 'Labuk & Sugut', 'Sabah', 31.979871, 0.827134, -0.405816, 130.963265, 0.150301, 6.082199, 117.290200);

INSERT INTO hotspots (district_name, city, state_name, avg_temperature, avg_ndvi, avg_ndbi, elevation, population, latitude, longitude)
VALUES ('Pensiangan', 'Pensiangan', 'Sabah', 25.870440, 0.798909, -0.399922, 581.973982, 0.060900, 4.605633, 116.527639);

INSERT INTO hotspots (district_name, city, state_name, avg_temperature, avg_ndvi, avg_ndbi, elevation, population, latitude, longitude)
VALUES ('Temerluh', 'Temerluh', 'Pahang', 31.328877, 0.797114, -0.348322, 105.864198, 0.518283, 3.426940, 102.384491);
