-- ============================================
-- SCRIPT: Datos de prueba para Jujutsu Kaisen
-- Fecha: 13 de Octubre, 2025
-- Descripción: Personajes, actores de voz, trailers
-- ============================================

SET search_path TO app, public;

-- ============================================
-- 1. ACTUALIZAR PERSONAJES EXISTENTES
-- ============================================

-- Yuji Itadori
UPDATE characters
SET name_romaji = 'Yuji Itadori',
    name_native = '虎杖悠仁',
    image_url = 'https://s4.anilist.co/file/anilistcdn/character/large/b163873-kSKXzlrM1dVH.png',
    description = 'Estudiante de secundaria con fuerza física excepcional que se convierte en el recipiente de Ryomen Sukuna.',
    favorites_count = 5000,
    slug = 'yuji-itadori'
WHERE id = 1;

-- Megumi Fushiguro
UPDATE characters
SET name_romaji = 'Megumi Fushiguro',
    name_native = '伏黒恵',
    image_url = 'https://s4.anilist.co/file/anilistcdn/character/large/b164869-k3KoIADzRf3O.png',
    description = 'Hechicero de primer año que puede invocar shikigami usando técnicas de sombra.',
    favorites_count = 4200,
    slug = 'megumi-fushiguro'
WHERE id = 2;

-- Nobara Kugisaki
UPDATE characters
SET name_romaji = 'Nobara Kugisaki',
    name_native = '釘崎野薔薇',
    image_url = 'https://s4.anilist.co/file/anilistcdn/character/large/b164870-WPt2AhY9sHjV.png',
    description = 'Hechicera confiada y directa que usa martillo y clavos en combate.',
    favorites_count = 3800,
    slug = 'nobara-kugisaki'
WHERE id = 3;

-- Gojo Satoru
UPDATE characters
SET name_romaji = 'Satoru Gojo',
    name_native = '五条悟',
    image_url = 'https://s4.anilist.co/file/anilistcdn/character/large/b127691-RyugAfYTQglj.jpg',
    description = 'El hechicero más fuerte del mundo, maestro carismático con el Limitless y los Seis Ojos.',
    favorites_count = 15000,
    slug = 'satoru-gojo'
WHERE id = 4;

-- ============================================
-- 2. INSERTAR PERSONAJES ADICIONALES
-- ============================================

INSERT INTO characters (name, name_romaji, name_native, image_url, description, favorites_count, slug)
VALUES
    ('Sukuna', 'Ryomen Sukuna', '両面宿儺', 
     'https://s4.anilist.co/file/anilistcdn/character/large/b165646-nxNRZCDa26B4.jpg',
     'El Rey de las Maldiciones, una entidad de más de 1000 años con poder inmenso.',
     8000, 'ryomen-sukuna'),
    
    ('Maki Zenin', 'Maki Zenin', '禪院真希',
     'https://s4.anilist.co/file/anilistcdn/character/large/b164872-5GgXxFLFPEOO.png',
     'Estudiante de segundo año sin energía maldita pero con fuerza física extraordinaria.',
     3500, 'maki-zenin'),
    
    ('Toge Inumaki', 'Toge Inumaki', '狗巻棘',
     'https://s4.anilist.co/file/anilistcdn/character/large/b164874-JgBJ5Dy3pzDB.png',
     'Hechicero que usa el Cursed Speech, solo puede hablar en ingredientes de onigiri.',
     3200, 'toge-inumaki'),
    
    ('Panda', 'Panda', 'パンダ',
     'https://s4.anilist.co/file/anilistcdn/character/large/b164875-TqHJxCUXbDNQ.png',
     'Un muñeco maldito con conciencia propia creado por el director Yaga.',
     2800, 'panda'),
    
    ('Kento Nanami', 'Kento Nanami', '七海建人',
     'https://s4.anilist.co/file/anilistcdn/character/large/b165643-6qxLUHZHyGU0.png',
     'Ex-asalariado convertido en hechicero de grado 1, mentor responsable de Yuji.',
     5500, 'kento-nanami'),
    
    ('Mahito', 'Mahito', '真人',
     'https://s4.anilist.co/file/anilistcdn/character/large/b165644-LZhsCUkHVPzj.png',
     'Maldición especial sádica con la capacidad de manipular almas.',
     4000, 'mahito'),
    
    ('Aoi Todo', 'Aoi Todo', '東堂葵',
     'https://s4.anilist.co/file/anilistcdn/character/large/b165645-VPxTY7rIFb9a.png',
     'Estudiante de tercer año de Kioto con fuerza descomunal y una personalidad excéntrica.',
     2500, 'aoi-todo'),
    
    ('Yuta Okkotsu', 'Yuta Okkotsu', '乙骨憂太',
     'https://s4.anilist.co/file/anilistcdn/character/large/b126635-OQTKf8GkJgCo.png',
     'Estudiante de segundo año y uno de los cuatro hechiceros de grado especial.',
     6000, 'yuta-okkotsu'),
    
    ('Momo Nishimiya', 'Momo Nishimiya', '西宮桃',
     'https://s4.anilist.co/file/anilistcdn/character/large/b165648-0rH1Xu1BPi56.png',
     'Estudiante de tercer año de Kioto que vuela en una escoba.',
     1500, 'momo-nishimiya'),
    
    ('Mai Zenin', 'Mai Zenin', '禪院真依',
     'https://s4.anilist.co/file/anilistcdn/character/large/b165649-3gvUkRmaqf7F.png',
     'Hermana gemela de Maki, estudiante de Kioto con habilidad de construcción.',
     2000, 'mai-zenin'),
    
    ('Kasumi Miwa', 'Kasumi Miwa', '三輪霞',
     'https://s4.anilist.co/file/anilistcdn/character/large/b165647-DPRN8tBgSUFb.png',
     'Estudiante de segundo año de Kioto, espadachina modesta y trabajadora.',
     3000, 'kasumi-miwa');

-- ============================================
-- 3. ACTORES DE VOZ JAPONESES
-- ============================================

INSERT INTO voice_actors (name_romaji, name_native, image_url, language, bio, favorites_count, slug)
VALUES
    ('Yuuji Itadori', '榎木淳弥', 'https://s4.anilist.co/file/anilistcdn/staff/large/n119869-6Eq6pGM35kKd.jpg',
     'ja', 'Actor de voz conocido por Jujutsu Kaisen, Toilet-bound Hanako-kun', 800, 'junya-enoki'),
    
    ('Yuuma Uchida', '内田雄馬', 'https://s4.anilist.co/file/anilistcdn/staff/large/n105175-VWUvFJvR5SBl.jpg',
     'ja', 'Actor de voz de Megumi Fushiguro, hermano de Uchida Maaya', 1200, 'yuuma-uchida'),
    
    ('Asami Seto', '瀬戸麻沙美', 'https://s4.anilist.co/file/anilistcdn/staff/large/n105437-PGfKy7OiITFY.jpg',
     'ja', 'Actriz de voz de Nobara Kugisaki y Mai Sakurajima (Bunny Girl Senpai)', 900, 'asami-seto'),
    
    ('Yuuichi Nakamura', '中村悠一', 'https://s4.anilist.co/file/anilistcdn/staff/large/n95131-k10KKkvvh4Hr.jpg',
     'ja', 'Veterano seiyuu de Gojo Satoru, Greed (FMA), Hawks (MHA)', 2500, 'yuuichi-nakamura'),
    
    ('Junichi Suwabe', '諏訪部順一', 'https://s4.anilist.co/file/anilistcdn/staff/large/n95133-TrCVhiZT1n6t.jpg',
     'ja', 'Voz profunda característica, Sukuna, Archer (Fate), Aomine (Kuroko)', 2200, 'junichi-suwabe'),
    
    ('Kenjiro Tsuda', '津田健次郎', 'https://s4.anilist.co/file/anilistcdn/staff/large/n95246-Cd4v8zJiZKxC.jpg',
     'ja', 'Actor de voz de Nanami, Overhaul (MHA), Seto Kaiba (Yu-Gi-Oh!)', 1800, 'kenjiro-tsuda'),
    
    ('Nobunaga Shimazaki', '島﨑信長', 'https://s4.anilist.co/file/anilistcdn/staff/large/n106890-ySGqTQADVCrE.jpg',
     'ja', 'Voz de Mahito, Yuno (Black Clover), Haruka (Free!)', 1500, 'nobunaga-shimazaki'),
    
    ('Megumi Ogata', '緒方恵美', 'https://s4.anilist.co/file/anilistcdn/staff/large/n95126-yBILaJy4YFX2.jpg',
     'ja', 'Legendaria seiyuu de Yuji Itadori joven, Shinji (Evangelion), Yugi (Yu-Gi-Oh!)', 3000, 'megumi-ogata');

-- ============================================
-- 4. RELACIONES PERSONAJES-ACTORES
-- ============================================

-- Obtener IDs de characters
DO $$
DECLARE
    char_yuji INT := (SELECT id FROM characters WHERE slug = 'yuji-itadori');
    char_megumi INT := (SELECT id FROM characters WHERE slug = 'megumi-fushiguro');
    char_nobara INT := (SELECT id FROM characters WHERE slug = 'nobara-kugisaki');
    char_gojo INT := (SELECT id FROM characters WHERE slug = 'satoru-gojo');
    char_sukuna INT := (SELECT id FROM characters WHERE slug = 'ryomen-sukuna');
    char_nanami INT := (SELECT id FROM characters WHERE slug = 'kento-nanami');
    char_mahito INT := (SELECT id FROM characters WHERE slug = 'mahito');
    
    va_enoki INT := (SELECT id FROM voice_actors WHERE slug = 'junya-enoki');
    va_uchida INT := (SELECT id FROM voice_actors WHERE slug = 'yuuma-uchida');
    va_seto INT := (SELECT id FROM voice_actors WHERE slug = 'asami-seto');
    va_nakamura INT := (SELECT id FROM voice_actors WHERE slug = 'yuuichi-nakamura');
    va_suwabe INT := (SELECT id FROM voice_actors WHERE slug = 'junichi-suwabe');
    va_tsuda INT := (SELECT id FROM voice_actors WHERE slug = 'kenjiro-tsuda');
    va_shimazaki INT := (SELECT id FROM voice_actors WHERE slug = 'nobunaga-shimazaki');
    
    anime_id INT := 1; -- Jujutsu Kaisen
BEGIN
    INSERT INTO character_voice_actors (character_id, voice_actor_id, media_type, media_id)
    VALUES
        (char_yuji, va_enoki, 'anime', anime_id),
        (char_megumi, va_uchida, 'anime', anime_id),
        (char_nobara, va_seto, 'anime', anime_id),
        (char_gojo, va_nakamura, 'anime', anime_id),
        (char_sukuna, va_suwabe, 'anime', anime_id),
        (char_nanami, va_tsuda, 'anime', anime_id),
        (char_mahito, va_shimazaki, 'anime', anime_id)
    ON CONFLICT DO NOTHING;
END$$;

-- ============================================
-- 5. ACTUALIZAR CHARACTERABLE_CHARACTERS
-- ============================================

-- Asegurarse de que los personajes estén vinculados al anime
INSERT INTO characterable_characters (character_id, characterable_type, characterable_id, role)
SELECT id, 'anime', 1, 
    CASE 
        WHEN slug IN ('yuji-itadori', 'megumi-fushiguro', 'nobara-kugisaki', 'satoru-gojo') THEN 'main'
        WHEN slug IN ('ryomen-sukuna', 'kento-nanami', 'yuta-okkotsu') THEN 'supporting'
        ELSE 'background'
    END
FROM characters
WHERE id IN (
    SELECT id FROM characters WHERE slug IN (
        'yuji-itadori', 'megumi-fushiguro', 'nobara-kugisaki', 'satoru-gojo',
        'ryomen-sukuna', 'maki-zenin', 'toge-inumaki', 'panda',
        'kento-nanami', 'mahito', 'aoi-todo', 'yuta-okkotsu',
        'momo-nishimiya', 'mai-zenin', 'kasumi-miwa'
    )
)
ON CONFLICT DO NOTHING;

-- ============================================
-- 6. TRAILERS DE JUJUTSU KAISEN
-- ============================================

INSERT INTO media_trailers (mediable_type, mediable_id, title, url, thumbnail_url, views_count, duration_seconds, published_at)
VALUES
    ('anime', 1, 'Jujutsu Kaisen - Official Trailer',
     'https://www.youtube.com/watch?v=pkKu9hLT-t8',
     'https://img.youtube.com/vi/pkKu9hLT-t8/maxresdefault.jpg',
     250000, 90, '2020-09-19'),
    
    ('anime', 1, 'Jujutsu Kaisen 0 - Movie Trailer',
     'https://www.youtube.com/watch?v=e8NKCiXyb4s',
     'https://img.youtube.com/vi/e8NKCiXyb4s/maxresdefault.jpg',
     180000, 105, '2021-11-20'),
    
    ('anime', 1, 'Jujutsu Kaisen Season 2 - Shibuya Arc Trailer',
     'https://www.youtube.com/watch?v=O6cC80LNfg0',
     'https://img.youtube.com/vi/O6cC80LNfg0/maxresdefault.jpg',
     320000, 95, '2023-06-01'),
    
    ('anime', 1, 'Jujutsu Kaisen OP 1 - "Kaikai Kitan" by Eve',
     'https://www.youtube.com/watch?v=1tk1pqwrOys',
     'https://img.youtube.com/vi/1tk1pqwrOys/maxresdefault.jpg',
     500000, 90, '2020-10-03'),
    
    ('anime', 1, 'Jujutsu Kaisen - Character PV: Gojo Satoru',
     'https://www.youtube.com/watch?v=4A_X-Dvl0ws',
     'https://img.youtube.com/vi/4A_X-Dvl0ws/maxresdefault.jpg',
     420000, 60, '2020-09-25'),
    
    ('anime', 1, 'Jujutsu Kaisen Season 2 OP - "Ao no Sumika" by Tatsuya Kitani',
     'https://www.youtube.com/watch?v=2zqy1H-XarY',
     'https://img.youtube.com/vi/2zqy1H-XarY/maxresdefault.jpg',
     380000, 90, '2023-07-06');

-- ============================================
-- 7. VISTAS SIMULADAS DE TRAILERS (últimas 24h)
-- ============================================

-- Simular vistas del día para rankings
DO $$
DECLARE
    trailer_record RECORD;
    i INT;
    random_views INT;
BEGIN
    FOR trailer_record IN 
        SELECT id FROM media_trailers WHERE mediable_type = 'anime' AND mediable_id = 1
    LOOP
        -- Generar entre 50 y 200 vistas por trailer
        random_views := 50 + floor(random() * 150);
        
        FOR i IN 1..random_views LOOP
            INSERT INTO trailer_views (trailer_id, ip_address, user_agent, viewed_at, session_id)
            VALUES (
                trailer_record.id,
                '192.168.1.' || floor(random() * 255)::TEXT,
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                NOW() - (random() * INTERVAL '24 hours'),
                'session_' || floor(random() * 10000)::TEXT
            );
        END LOOP;
    END LOOP;
END$$;

-- ============================================
-- FINALIZACIÓN
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Personajes actualizados: 4 principales + 11 nuevos = 15 personajes';
    RAISE NOTICE '✅ Actores de voz insertados: 8 seiyuus japoneses';
    RAISE NOTICE '✅ Relaciones character_voice_actors: 7 vinculaciones';
    RAISE NOTICE '✅ Trailers insertados: 6 trailers oficiales';
    RAISE NOTICE '✅ Vistas simuladas: ~800 vistas en últimas 24h';
    RAISE NOTICE '✅ Datos de prueba completados exitosamente';
END$$;
