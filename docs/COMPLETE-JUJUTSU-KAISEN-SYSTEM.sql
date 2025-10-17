-- ============================================
-- COMPLETAR SISTEMA DE JUJUTSU KAISEN
-- ============================================
-- Este script agrega:
-- 1. Tabla de episodios
-- 2. Personajes principales
-- 3. Staff (directores, estudios)
-- 4. Relaciones anime/manga <-> personajes/staff
-- 5. Episodios de ejemplo
-- ============================================

SET search_path TO app, public;

-- ============================================
-- 1. CREAR TABLA DE EPISODIOS
-- ============================================

CREATE TABLE IF NOT EXISTS episodes (
    id BIGSERIAL PRIMARY KEY,
    anime_id BIGINT NOT NULL REFERENCES anime(id) ON DELETE CASCADE,
    episode_number INTEGER NOT NULL,
    title VARCHAR(500),
    title_romaji VARCHAR(500),
    title_japanese VARCHAR(500),
    synopsis TEXT,
    air_date DATE,
    duration INTEGER, -- Duración en minutos
    thumbnail_url VARCHAR(800),
    video_url VARCHAR(800),
    is_filler BOOLEAN DEFAULT FALSE,
    is_recap BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (anime_id, episode_number)
);

COMMENT ON TABLE episodes IS 'Episodios de anime';
CREATE INDEX IF NOT EXISTS idx_episodes_anime_id ON episodes(anime_id);
CREATE INDEX IF NOT EXISTS idx_episodes_air_date ON episodes(air_date);

-- Trigger para updated_at
CREATE TRIGGER trg_episodes_update_time 
BEFORE UPDATE ON episodes
FOR EACH ROW 
EXECUTE FUNCTION fn_update_updated_at();

-- ============================================
-- 2. AGREGAR PERSONAJES DE JUJUTSU KAISEN
-- ============================================

-- Personajes principales
INSERT INTO characters (id, name) VALUES
    (1, 'Yuji Itadori'),
    (2, 'Megumi Fushiguro'),
    (3, 'Nobara Kugisaki'),
    (4, 'Satoru Gojo'),
    (5, 'Ryomen Sukuna'),
    (6, 'Maki Zenin'),
    (7, 'Toge Inumaki'),
    (8, 'Panda'),
    (9, 'Kento Nanami'),
    (10, 'Suguru Geto')
ON CONFLICT (id) DO NOTHING;

-- Resetear secuencia
SELECT setval('app.characters_id_seq', (SELECT MAX(id) FROM app.characters));

-- ============================================
-- 3. AGREGAR STAFF DE JUJUTSU KAISEN
-- ============================================

-- Director y staff clave
INSERT INTO staff (id, name_romaji, name_native, image_url) VALUES
    (4, 'Sunghoo Park', '박성후', NULL),
    (5, 'Hiroshi Seko', '瀬古浩司', NULL),
    (6, 'Tadashi Hiramatsu', '平松禎史', NULL),
    (7, 'Yoshimasa Terui', '照井順政', NULL),
    (8, 'MAPPA', 'MAPPA', NULL)
ON CONFLICT (id) DO NOTHING;

-- Resetear secuencia
SELECT setval('app.staff_id_seq', (SELECT MAX(id) FROM app.staff));

-- ============================================
-- 4. CREAR STUDIOS SI NO EXISTEN
-- ============================================

INSERT INTO studios (id, name) VALUES
    (1, 'MAPPA'),
    (2, 'Wit Studio'),
    (3, 'Toei Animation')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 5. RELACIONAR PERSONAJES CON ANIME (id=3)
-- ============================================

INSERT INTO characterable_characters (character_id, characterable_type, characterable_id, role) VALUES
    (1, 'anime', 3, 'main'),      -- Yuji Itadori
    (2, 'anime', 3, 'main'),      -- Megumi Fushiguro
    (3, 'anime', 3, 'main'),      -- Nobara Kugisaki
    (4, 'anime', 3, 'main'),      -- Satoru Gojo
    (5, 'anime', 3, 'main'),      -- Ryomen Sukuna
    (6, 'anime', 3, 'supporting'), -- Maki Zenin
    (7, 'anime', 3, 'supporting'), -- Toge Inumaki
    (8, 'anime', 3, 'supporting'), -- Panda
    (9, 'anime', 3, 'supporting'), -- Kento Nanami
    (10, 'anime', 3, 'supporting') -- Suguru Geto
ON CONFLICT (character_id, characterable_type, characterable_id) DO NOTHING;

-- ============================================
-- 6. RELACIONAR PERSONAJES CON MANGA (id=2)
-- ============================================

INSERT INTO characterable_characters (character_id, characterable_type, characterable_id, role) VALUES
    (1, 'manga', 2, 'main'),
    (2, 'manga', 2, 'main'),
    (3, 'manga', 2, 'main'),
    (4, 'manga', 2, 'main'),
    (5, 'manga', 2, 'main'),
    (6, 'manga', 2, 'supporting'),
    (7, 'manga', 2, 'supporting'),
    (8, 'manga', 2, 'supporting'),
    (9, 'manga', 2, 'supporting'),
    (10, 'manga', 2, 'supporting')
ON CONFLICT (character_id, characterable_type, characterable_id) DO NOTHING;

-- ============================================
-- 7. RELACIONAR STAFF CON ANIME
-- ============================================

INSERT INTO staffable_staff (staff_id, staffable_type, staffable_id, role) VALUES
    (2, 'anime', 3, 'Original Creator'),    -- Gege Akutami
    (4, 'anime', 3, 'Director'),            -- Sunghoo Park
    (5, 'anime', 3, 'Series Composition'),  -- Hiroshi Seko
    (6, 'anime', 3, 'Character Design'),    -- Tadashi Hiramatsu
    (7, 'anime', 3, 'Music')                -- Yoshimasa Terui
ON CONFLICT (staff_id, staffable_type, staffable_id, role) DO NOTHING;

-- ============================================
-- 8. RELACIONAR STAFF CON MANGA
-- ============================================

INSERT INTO staffable_staff (staff_id, staffable_type, staffable_id, role) VALUES
    (2, 'manga', 2, 'Story & Art')  -- Gege Akutami
ON CONFLICT (staff_id, staffable_type, staffable_id, role) DO NOTHING;

-- ============================================
-- 9. RELACIONAR ESTUDIO CON ANIME
-- ============================================

INSERT INTO studiable_studios (studio_id, studiable_type, studiable_id, is_main_studio) VALUES
    (1, 'anime', 3, TRUE)  -- MAPPA
ON CONFLICT (studio_id, studiable_type, studiable_id) DO NOTHING;

-- ============================================
-- 10. AGREGAR EPISODIOS DE JUJUTSU KAISEN
-- ============================================

INSERT INTO episodes (anime_id, episode_number, title, title_romaji, synopsis, air_date, duration, is_filler) VALUES
    (3, 1, 'Ryomen Sukuna', 'Ryoumen Sukuna', 
     'Yuji Itadori es un estudiante de secundaria con una fuerza física extraordinaria. Un día, para salvar a un amigo que ha sido atacado por maldiciones, come uno de los dedos de Sukuna, convirtiéndose en su anfitrión.',
     '2020-10-03', 24, FALSE),
    
    (3, 2, 'For Myself', 'Jibun no Tame ni',
     'Yuji es llevado a Tokyo Jujutsu High para ser ejecutado, pero Satoru Gojo, su sensei, tiene otros planes para él.',
     '2020-10-10', 24, FALSE),
    
    (3, 3, 'Girl of Steel', 'Hagane no Onna',
     'Yuji conoce a sus compañeros de clase: Megumi Fushiguro y Nobara Kugisaki. Juntos, se embarcan en su primera misión oficial.',
     '2020-10-17', 24, FALSE),
    
    (3, 4, 'Curse Womb Must Die', 'Jurei wa Shinu Beki',
     'Los estudiantes son enviados a rescatar a cinco personas atrapadas en un centro de detención juvenil, pero la misión resulta ser más peligrosa de lo esperado.',
     '2020-10-24', 24, FALSE),
    
    (3, 5, 'Curse Womb Must Die -II-', 'Jurei wa Shinu Beki -ni-',
     'Enfrentados a un espíritu de nivel especial, Yuji toma una decisión drástica para salvar a Megumi y Nobara.',
     '2020-10-31', 24, FALSE),
    
    (3, 6, 'After Rain', 'Ame no Ato',
     'Yuji comienza a entrenar bajo la tutela de Gojo mientras lidia con las consecuencias de su encuentro con el espíritu de grado especial.',
     '2020-11-07', 24, FALSE),
    
    (3, 7, 'Assault', 'Kyoushuu',
     'Dos grupos de hechiceros jujutsu de Kyoto llegan a Tokio para participar en el Evento de Intercambio.',
     '2020-11-14', 24, FALSE),
    
    (3, 8, 'Boredom', 'Taikutsu',
     'Comienza el Evento de Intercambio. Los estudiantes deben exorcizar espíritus de grado 2 en una competencia contra la escuela de Kyoto.',
     '2020-11-21', 24, FALSE),
    
    (3, 9, 'Small Fry and Reverse Retribution', 'Zako to Gyakufuku',
     'Durante el evento, Nobara y Maki enfrentan a las gemelas Mai y Momo de Kyoto, revelando más sobre sus poderes.',
     '2020-11-28', 24, FALSE),
    
    (3, 10, 'Idle Transfiguration', 'Mui Tenpen',
     'Yuji y Nanami investigan una serie de misteriosas muertes causadas por espíritus malditos modificados.',
     '2020-12-05', 24, FALSE)
ON CONFLICT (anime_id, episode_number) DO NOTHING;

-- ============================================
-- 11. ACTUALIZAR INFORMACIÓN DEL ANIME
-- ============================================

UPDATE anime 
SET 
    title_spanish = 'Jujutsu Kaisen',
    synopsis = 'Yuji Itadori es un estudiante de preparatoria con habilidades físicas excepcionales. Un día, para salvar a un amigo que ha sido atacado por Maldiciones, come el dedo del Rey de las Maldiciones, Ryomen Sukuna, convirtiéndose en su anfitrión. Guiado por el hechicero más poderoso, Satoru Gojo, Itadori es admitido en la Escuela Técnica Metropolitana de Magia Jujutsu de Tokio, una organización que combate las Maldiciones, comenzando su camino como hechicero.',
    episode_count = 24,
    duration = 24,
    type = 'TV',
    season = 'Fall 2020',
    season_year = 2020,
    source = 'Manga',
    start_date = '2020-10-03',
    end_date = '2021-03-27',
    average_score = 8.78,
    is_approved = TRUE,
    is_published = TRUE
WHERE id = 3;

-- ============================================
-- 12. ACTUALIZAR INFORMACIÓN DEL MANGA
-- ============================================

UPDATE manga
SET
    title_spanish = 'Jujutsu Kaisen',
    synopsis = 'Yuji Itadori es un estudiante de preparatoria con una fuerza sobrehumana que vive con su abuelo. Cuando su abuelo está en su lecho de muerte, le pide a Yuji que siempre ayude a las personas y que muera rodeado de amigos. Poco después, sus amigos del club de ocultismo desatan una maldición en su escuela, y Yuji traga un dedo maldito para salvarlos.',
    type = 'Manga',
    start_date = '2018-03-05',
    volumes = 24,
    chapters = 236,
    average_score = 8.65,
    is_approved = TRUE
WHERE id = 2;

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Ver personajes del anime
SELECT '=== PERSONAJES DEL ANIME JUJUTSU KAISEN ===' AS info;
SELECT c.id, c.name, cc.role
FROM characterable_characters cc
JOIN characters c ON c.id = cc.character_id
WHERE cc.characterable_type = 'anime' AND cc.characterable_id = 3
ORDER BY cc.role, c.id;

-- Ver staff del anime
SELECT '=== STAFF DEL ANIME JUJUTSU KAISEN ===' AS info;
SELECT s.id, s.name_romaji, ss.role
FROM staffable_staff ss
JOIN staff s ON s.id = ss.staff_id
WHERE ss.staffable_type = 'anime' AND ss.staffable_id = 3
ORDER BY ss.role;

-- Ver estudio del anime
SELECT '=== ESTUDIO DEL ANIME JUJUTSU KAISEN ===' AS info;
SELECT st.name
FROM studiable_studios ss
JOIN studios st ON st.id = ss.studio_id
WHERE ss.studiable_type = 'anime' AND ss.studiable_id = 3;

-- Ver episodios
SELECT '=== EPISODIOS DE JUJUTSU KAISEN ===' AS info;
SELECT episode_number, title, air_date, duration
FROM episodes
WHERE anime_id = 3
ORDER BY episode_number
LIMIT 5;

SELECT '✅ Sistema completado exitosamente!' AS status;

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
