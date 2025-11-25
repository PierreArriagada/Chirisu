-- ============================================
-- SCRIPT: Insertar datos de prueba en nuevas tablas
-- ============================================
-- Propósito: Agregar contenido de ejemplo para probar endpoints y rankings
-- Tablas: donghua, manhua, manhwa, fan_comics
-- ============================================

-- Conectar a la base de datos
\c bd_chirisu;

SET search_path TO app, public;

-- ============================================
-- DONGHUA (Animación China)
-- ============================================
INSERT INTO app.donghua (
    created_by, updated_by, 
    title_romaji, title_english, title_spanish, title_native,
    synopsis, 
    type, status_id, country_of_origin,
    average_score, popularity, favourites, ratings_count,
    episode_count, episode_duration,
    start_date, is_published, is_nsfw
) VALUES 
-- Mo Dao Zu Shi (Grandmaster of Demonic Cultivation)
(1, 1,
 'Mo Dao Zu Shi', 'The Founder of Diabolism', 'El Fundador del Diabolismo', '魔道祖师',
 'Wei Wuxian fue el Gran Maestro de la Cultivación Demoníaca. Tras su muerte, renace en el cuerpo de un lunático y se encuentra con su antiguo compañero Lan Wangji.',
 'TV', 2, 'CN',
 92, 15000, 5200, 8900,
 15, 24,
 '2018-07-09', true, false),

-- Tian Guan Ci Fu (Heaven Official''s Blessing)
(1, 1,
 'Tian Guan Ci Fu', 'Heaven Official''s Blessing', 'La Bendición del Oficial Celestial', '天官赐福',
 'Xie Lian es un príncipe del reino de Xian Le que asciende al cielo por tercera vez. Sin embargo, es mal visto por los demás dioses debido a su pasado.',
 'TV', 2, 'CN',
 94, 18500, 6800, 9500,
 11, 24,
 '2020-10-31', true, false),

-- Quan Zhi Gao Shou (The King''s Avatar)
(1, 1,
 'Quan Zhi Gao Shou', 'The King''s Avatar', 'El Avatar del Rey', '全职高手',
 'Ye Xiu es forzado a retirarse del juego competitivo Glory. Sin embargo, regresa como un novato para reclamar su título.',
 'TV', 2, 'CN',
 88, 12000, 4100, 7200,
 12, 24,
 '2017-04-07', true, false),

-- Ling Long: Incarnation
(1, 1,
 'Ling Long', 'Ling Cage: Incarnation', 'Ling Cage: Encarnación', '灵笼',
 'En un futuro post-apocalíptico, la humanidad sobrevive en faros flotantes mientras enfrentan criaturas llamadas Polo en la superficie.',
 'Web', 2, 'CN',
 86, 9500, 3200, 6100,
 12, 25,
 '2019-07-13', true, false),

-- Yi Ren Zhi Xia (Under One Person)
(1, 1,
 'Yi Ren Zhi Xia', 'The Outcast', 'El Proscrito', '一人之下',
 'Zhang Chulan esconde su capacidad de usar el Qi desde la muerte de su abuelo. Sin embargo, su encuentro con Feng Baobao cambia todo.',
 'TV', 2, 'CN',
 85, 11000, 3800, 6800,
 12, 24,
 '2016-07-08', true, false);

-- ============================================
-- MANHUA (Cómics Chinos)
-- ============================================
INSERT INTO app.manhua (
    created_by, updated_by,
    title_romaji, title_english, title_spanish, title_native,
    synopsis,
    status_id, country_of_origin,
    average_score, popularity, favourites, ratings_count,
    chapters, volumes,
    start_date, is_approved, is_nsfw
) VALUES
-- Tales of Demons and Gods
(1, 1,
 'Yaoshenji', 'Tales of Demons and Gods', 'Cuentos de Demonios y Dioses', '妖神记',
 'Nie Li regresa al pasado después de morir luchando contra el Emperador Sabio. Ahora debe cambiar el destino de su ciudad.',
 2, 'CN',
 89, 14000, 4900, 7800,
 450, 45,
 '2015-03-01', true, false),

-- Battle Through the Heavens
(1, 1,
 'Doupo Cangqiong', 'Battle Through the Heavens', 'Batalla a Través de los Cielos', '斗破苍穹',
 'Xiao Yan pierde sus poderes de cultivación y es ridiculizado. Pero con la ayuda de un misterioso anillo, comienza su camino de regreso al poder.',
 2, 'CN',
 87, 16000, 5600, 8900,
 850, 85,
 '2009-04-14', true, false),

-- Martial Peak
(1, 1,
 'Wudong Qiankun', 'Martial Peak', 'Cima Marcial', '武动乾坤',
 'Yang Kai es un siervo en el Cielo Alto Pabellón. A través de pruebas y tribulaciones, asciende al pináculo de las artes marciales.',
 2, 'CN',
 84, 18000, 6200, 9200,
 3500, 350,
 '2013-11-08', true, false),

-- Soul Land
(1, 1,
 'Douluo Dalu', 'Soul Land', 'Tierra de Almas', '斗罗大陆',
 'Tang San reencarna en un mundo donde las personas poseen espíritus marciales. Debe cultivar su poder para alcanzar la cima.',
 2, 'CN',
 91, 20000, 7100, 10500,
 780, 78,
 '2008-12-14', true, false),

-- The Ravages of Time
(1, 1,
 'Huo Feng Liao Yuan', 'The Ravages of Time', 'Los Estragos del Tiempo', '火凤燎原',
 'Una reinterpretación del período de los Tres Reinos de China con un enfoque en estrategias militares complejas.',
 2, 'CN',
 93, 8500, 2900, 5200,
 650, 65,
 '2001-03-06', true, false);

-- ============================================
-- MANHWA (Cómics Coreanos)
-- ============================================
INSERT INTO app.manhwa (
    created_by, updated_by,
    title_romaji, title_english, title_spanish, title_native,
    synopsis,
    status_id, country_of_origin,
    average_score, popularity, favourites, ratings_count,
    chapters, volumes,
    start_date, is_approved, is_nsfw
) VALUES
-- Solo Leveling
(1, 1,
 'Na Honjaman Level Up', 'Solo Leveling', 'Subiendo de Nivel Solo', '나 혼자만 레벨업',
 'Sung Jin-Woo es el cazador más débil. Tras sobrevivir a una mazmorra mortal, obtiene el poder de subir de nivel como en un videojuego.',
 3, 'KR',
 95, 25000, 9800, 15200,
 179, 18,
 '2018-03-04', true, false),

-- Tower of God
(1, 1,
 'Sinui Tap', 'Tower of God', 'Torre de Dios', '신의 탑',
 'Bam entra a la Torre para encontrar a su amiga Rachel. Para subir debe superar pruebas mortales en cada piso.',
 2, 'KR',
 92, 22000, 8200, 12800,
 550, 55,
 '2010-06-30', true, false),

-- The Breaker
(1, 1,
 'The Breaker', 'The Breaker', 'El Destructor', '브레이커',
 'Shi-Woon es un estudiante intimidado que conoce a Han Chun-Woo, un maestro de artes marciales del mundo Murim.',
 3, 'KR',
 90, 15000, 5800, 9200,
 72, 10,
 '2007-06-01', true, false),

-- The God of High School
(1, 1,
 'Galsin', 'The God of High School', 'El Dios de la Preparatoria', '갓 오브 하이스쿨',
 'Jin Mori participa en un torneo de artes marciales donde el ganador puede cumplir cualquier deseo.',
 2, 'KR',
 88, 18000, 6900, 11200,
 550, 55,
 '2011-04-08', true, false),

-- Noblesse
(1, 1,
 'Noblesse', 'Noblesse', 'Nobleza', '노블레스',
 'Cadis Etrama Di Raizel despierta después de 820 años y debe adaptarse al mundo moderno mientras protege a sus amigos.',
 3, 'KR',
 89, 16000, 6200, 10100,
 544, 54,
 '2007-12-30', true, false);

-- ============================================
-- FAN COMICS (Cómics de Fans)
-- ============================================
INSERT INTO app.fan_comics (
    created_by, updated_by,
    title_romaji, title_english, title_spanish, title_native,
    synopsis,
    status_id, country_of_origin,
    average_score, popularity, favourites, ratings_count,
    chapters,
    start_date, is_approved, is_nsfw
) VALUES
-- My Hero Academia: Vigilantes
(1, 1,
 'Boku no Hero Academia: Vigilante', 'My Hero Academia: Vigilantes', 'My Hero Academia: Vigilantes', '僕のヒーローアカデミア ヴィジランテ',
 'Años antes de que Izuku Midoriya soñara con ser un héroe, los vigilantes ilegales protegían las calles.',
 3, 'JP',
 86, 12000, 4200, 7500,
 126,
 '2016-08-15', true, false),

-- Naruto: The Seventh Hokage
(1, 1,
 'Naruto Gaiden', 'Naruto: The Seventh Hokage', 'Naruto: El Séptimo Hokage', 'NARUTO外伝',
 'La historia de Sarada Uchiha y su búsqueda por conocer la verdad sobre su padre.',
 3, 'JP',
 84, 15000, 5100, 8200,
 10,
 '2015-04-27', true, false),

-- Attack on Titan: No Regrets
(1, 1,
 'Shingeki no Kyojin: Kuinaki Sentaku', 'Attack on Titan: No Regrets', 'Ataque a los Titanes: Sin Arrepentimientos', '進撃の巨人 悔いなき選択',
 'La historia del pasado de Levi antes de unirse a la Legión de Reconocimiento.',
 3, 'JP',
 88, 11000, 3800, 6900,
 15,
 '2013-12-09', true, false),

-- One Piece: Strong World
(1, 1,
 'One Piece: Strong World', 'One Piece: Strong World', 'One Piece: Mundo Fuerte', 'ワンピース ストロングワールド',
 'Los Piratas de Sombrero de Paja se enfrentan a Shiki el León Dorado, un legendario pirata.',
 3, 'JP',
 85, 14000, 4800, 8100,
 3,
 '2009-12-12', true, false),

-- Dragon Ball: Episode of Bardock
(1, 1,
 'Dragon Ball: Episode of Bardock', 'Dragon Ball: Episode of Bardock', 'Dragon Ball: Episodio de Bardock', 'ドラゴンボール エピソード オブ バーダック',
 'Bardock sobrevive al ataque de Freezer y viaja al pasado del planeta Vegeta.',
 3, 'JP',
 82, 13000, 4500, 7800,
 3,
 '2011-12-21', true, false);

-- ============================================
-- VERIFICACIÓN
-- ============================================
\echo ''
\echo '✅ VERIFICACIÓN DE DATOS INSERTADOS'
\echo '===================================='

SELECT 'Donghua' as tabla, COUNT(*) as total FROM app.donghua WHERE deleted_at IS NULL
UNION ALL
SELECT 'Manhua' as tabla, COUNT(*) as total FROM app.manhua WHERE deleted_at IS NULL
UNION ALL
SELECT 'Manhwa' as tabla, COUNT(*) as total FROM app.manhwa WHERE deleted_at IS NULL
UNION ALL
SELECT 'Fan Comics' as tabla, COUNT(*) as total FROM app.fan_comics WHERE deleted_at IS NULL;

\echo ''
\echo '📊 TOP 3 DONGHUA POR RANKING:'
SELECT ranking, title_romaji, average_score, popularity 
FROM app.donghua 
WHERE deleted_at IS NULL AND is_published = true
ORDER BY ranking ASC NULLS LAST
LIMIT 3;

\echo ''
\echo '📊 TOP 3 MANHUA POR RANKING:'
SELECT ranking, title_romaji, average_score, popularity 
FROM app.manhua 
WHERE deleted_at IS NULL AND is_approved = true
ORDER BY ranking ASC NULLS LAST
LIMIT 3;

\echo ''
\echo '📊 TOP 3 MANHWA POR RANKING:'
SELECT ranking, title_romaji, average_score, popularity 
FROM app.manhwa 
WHERE deleted_at IS NULL AND is_approved = true
ORDER BY ranking ASC NULLS LAST
LIMIT 3;

\echo ''
\echo '📊 TOP 3 FAN COMICS POR RANKING:'
SELECT ranking, title_romaji, average_score, popularity 
FROM app.fan_comics 
WHERE deleted_at IS NULL AND is_approved = true
ORDER BY ranking ASC NULLS LAST
LIMIT 3;

\echo ''
\echo '✅ Script completado exitosamente!'
