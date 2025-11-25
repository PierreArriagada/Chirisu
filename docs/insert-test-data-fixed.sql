-- INSERT TEST DATA - CORRECTED
\c bd_chirisu;
SET search_path TO app, public;
SET client_encoding TO 'UTF8';

-- First, create a test user if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM app.users WHERE id = 1) THEN
    INSERT INTO app.users (id, username, email, password_hash, role_id)
    VALUES (1, 'admin', 'admin@chirisu.com', '$2b$10$test', 10);
  END IF;
END $$;

-- DONGHUA (Note: column is 'duration' not 'episode_duration')
INSERT INTO app.donghua (
    created_by, updated_by, 
    title_romaji, title_english, title_spanish,
    synopsis, 
    type, status_id, country_of_origin,
    average_score, popularity, favourites, ratings_count,
    episode_count, duration,
    start_date, is_published, is_nsfw
) VALUES 
(1, 1,
 'Mo Dao Zu Shi', 'The Founder of Diabolism', 'El Fundador del Diabolismo',
 'Wei Wuxian fue el Gran Maestro de la Cultivacion Demoniaca.',
 'TV', 2, 'CN',
 92, 15000, 5200, 8900,
 15, 24,
 '2018-07-09', true, false),

(1, 1,
 'Tian Guan Ci Fu', 'Heaven Official Blessing', 'La Bendicion del Oficial Celestial',
 'Xie Lian es un principe que asciende al cielo por tercera vez.',
 'TV', 2, 'CN',
 94, 18500, 6800, 9500,
 11, 24,
 '2020-10-31', true, false),

(1, 1,
 'Quan Zhi Gao Shou', 'The King Avatar', 'El Avatar del Rey',
 'Ye Xiu regresa como un novato para reclamar su titulo.',
 'TV', 2, 'CN',
 88, 12000, 4100, 7200,
 12, 24,
 '2017-04-07', true, false);

-- MANHUA
INSERT INTO app.manhua (
    created_by, updated_by,
    title_romaji, title_english, title_spanish,
    synopsis,
    status_id, country_of_origin,
    average_score, popularity, favourites, ratings_count,
    chapters, volumes,
    start_date, is_approved, is_nsfw
) VALUES
(1, 1,
 'Yaoshenji', 'Tales of Demons and Gods', 'Cuentos de Demonios y Dioses',
 'Nie Li regresa al pasado y debe cambiar el destino de su ciudad.',
 2, 'CN',
 89, 14000, 4900, 7800,
 450, 45,
 '2015-03-01', true, false),

(1, 1,
 'Doupo Cangqiong', 'Battle Through the Heavens', 'Batalla a Traves de los Cielos',
 'Xiao Yan comienza su camino de regreso al poder.',
 2, 'CN',
 87, 16000, 5600, 8900,
 850, 85,
 '2009-04-14', true, false),

(1, 1,
 'Douluo Dalu', 'Soul Land', 'Tierra de Almas',
 'Tang San reencarna en un mundo de espiritus marciales.',
 2, 'CN',
 91, 20000, 7100, 10500,
 780, 78,
 '2008-12-14', true, false);

-- MANHWA
INSERT INTO app.manhwa (
    created_by, updated_by,
    title_romaji, title_english, title_spanish,
    synopsis,
    status_id, country_of_origin,
    average_score, popularity, favourites, ratings_count,
    chapters, volumes,
    start_date, is_approved, is_nsfw
) VALUES
(1, 1,
 'Na Honjaman Level Up', 'Solo Leveling', 'Subiendo de Nivel Solo',
 'Sung Jin-Woo obtiene el poder de subir de nivel como en un videojuego.',
 3, 'KR',
 95, 25000, 9800, 15200,
 179, 18,
 '2018-03-04', true, false),

(1, 1,
 'Sinui Tap', 'Tower of God', 'Torre de Dios',
 'Bam entra a la Torre para encontrar a su amiga Rachel.',
 2, 'KR',
 92, 22000, 8200, 12800,
 550, 55,
 '2010-06-30', true, false),

(1, 1,
 'The Breaker', 'The Breaker', 'El Destructor',
 'Shi-Woon conoce a un maestro de artes marciales del mundo Murim.',
 3, 'KR',
 90, 15000, 5800, 9200,
 72, 10,
 '2007-06-01', true, false);

-- FAN COMICS (Note: column is 'title' not 'title_romaji')
INSERT INTO app.fan_comics (
    created_by, updated_by,
    title, title_english, title_spanish,
    synopsis,
    status_id, country_of_origin,
    average_score, popularity, favourites, ratings_count,
    chapters,
    start_date, is_approved, is_nsfw
) VALUES
(1, 1,
 'Boku no Hero Academia Vigilante', 'My Hero Academia Vigilantes', 'My Hero Academia Vigilantes',
 'Años antes de Izuku Midoriya, los vigilantes protegian las calles.',
 3, 'JP',
 86, 12000, 4200, 7500,
 126,
 '2016-08-15', true, false),

(1, 1,
 'Naruto Gaiden', 'Naruto The Seventh Hokage', 'Naruto El Septimo Hokage',
 'La historia de Sarada Uchiha buscando la verdad sobre su padre.',
 3, 'JP',
 84, 15000, 5100, 8200,
 10,
 '2015-04-27', true, false),

(1, 1,
 'Attack on Titan No Regrets', 'Attack on Titan No Regrets', 'Ataque a los Titanes Sin Arrepentimientos',
 'La historia del pasado de Levi en la Legion de Reconocimiento.',
 3, 'JP',
 88, 11000, 3800, 6900,
 15,
 '2013-12-09', true, false);

-- RECALCULATE RANKINGS
SELECT app.fn_recalculate_all_rankings();

-- VERIFICATION
SELECT 'Donghua' as tabla, COUNT(*) as total FROM app.donghua WHERE deleted_at IS NULL
UNION ALL
SELECT 'Manhua' as tabla, COUNT(*) as total FROM app.manhua WHERE deleted_at IS NULL
UNION ALL
SELECT 'Manhwa' as tabla, COUNT(*) as total FROM app.manhwa WHERE deleted_at IS NULL
UNION ALL
SELECT 'Fan Comics' as tabla, COUNT(*) as total FROM app.fan_comics WHERE deleted_at IS NULL;

-- TOP RANKINGS
SELECT 'DONGHUA TOP' as tipo, ranking, title_romaji as title, average_score, popularity 
FROM app.donghua 
WHERE deleted_at IS NULL AND is_published = true
ORDER BY ranking ASC NULLS LAST
LIMIT 3;

SELECT 'MANHUA TOP' as tipo, ranking, title_romaji as title, average_score, popularity 
FROM app.manhua 
WHERE deleted_at IS NULL AND is_approved = true
ORDER BY ranking ASC NULLS LAST
LIMIT 3;

SELECT 'MANHWA TOP' as tipo, ranking, title_romaji as title, average_score, popularity 
FROM app.manhwa 
WHERE deleted_at IS NULL AND is_approved = true
ORDER BY ranking ASC NULLS LAST
LIMIT 3;

SELECT 'FAN COMICS TOP' as tipo, ranking, title, average_score, popularity 
FROM app.fan_comics 
WHERE deleted_at IS NULL AND is_approved = true
ORDER BY ranking ASC NULLS LAST
LIMIT 3;
