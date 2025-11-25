/**
 * ========================================
 * SCRIPT: PRUEBAS Y VERIFICACIÓN FINAL
 * ========================================
 * 
 * Este script:
 * 1. Inserta datos de prueba en cada tabla
 * 2. Verifica que los triggers funcionan
 * 3. Muestra estadísticas de las nuevas tablas
 */

SET search_path = app, public;

-- ========================================
-- PARTE 1: INSERTAR DATOS DE PRUEBA
-- ========================================

-- Obtener el ID del status 'publishing' para usar en las pruebas
DO $$
DECLARE
    v_publishing_id INTEGER;
    v_ongoing_id INTEGER;
    v_user_id INTEGER;
BEGIN
    -- Obtener IDs de status
    SELECT id INTO v_publishing_id FROM app.media_statuses WHERE code = 'publishing';
    SELECT id INTO v_ongoing_id FROM app.media_statuses WHERE code = 'ongoing';
    
    -- Obtener un usuario existente (el primero disponible)
    SELECT id INTO v_user_id FROM app.users ORDER BY id LIMIT 1;
    
    -- INSERTAR DOUGUA DE PRUEBA
    INSERT INTO app.dougua (
        title_native,
        title_romaji,
        title_english,
        synopsis,
        episode_count,
        duration,
        season,
        season_year,
        type,
        country_of_origin,
        created_by
    ) VALUES (
        '魔道祖师',
        'Mo Dao Zu Shi',
        'Grandmaster of Demonic Cultivation',
        'Wei Wuxian fue una vez uno de los cultivadores más destacados de su generación.',
        15,
        25,
        'Summer',
        2018,
        'TV',
        'CN',
        v_user_id
    ) ON CONFLICT (slug) DO NOTHING;
    
    -- INSERTAR MANHUA DE PRUEBA
    INSERT INTO app.manhua (
        title_native,
        title_romaji,
        title_english,
        synopsis,
        chapters,
        type,
        country_of_origin,
        created_by
    ) VALUES (
        '一人之下',
        'Yi Ren Zhi Xia',
        'The Outcast',
        'Zhang Chulan es un joven común que descubre que tiene poderes sobrenaturales.',
        200,
        'Manhua',
        'CN',
        v_user_id
    ) ON CONFLICT (slug) DO NOTHING;
    
    -- INSERTAR MANHWA DE PRUEBA
    INSERT INTO app.manhwa (
        title_native,
        title_romaji,
        title_english,
        synopsis,
        chapters,
        type,
        country_of_origin,
        created_by
    ) VALUES (
        '나 혼자만 레벨업',
        'Na Honjaman Level Up',
        'Solo Leveling',
        'En un mundo donde los cazadores luchan contra monstruos, Sung Jin-Woo es el más débil.',
        270,
        'Manhwa',
        'KR',
        v_user_id
    ) ON CONFLICT (slug) DO NOTHING;
    
    -- INSERTAR FAN COMIC DE PRUEBA
    INSERT INTO app.fan_comics (
        title,
        title_english,
        synopsis,
        chapters,
        source,
        type,
        created_by
    ) VALUES (
        'My Hero Academia: Vigilantes Extras',
        'My Hero Academia: Vigilantes Extras',
        'Historias adicionales del universo de My Hero Academia creadas por fans.',
        10,
        'My Hero Academia',
        'Fan Comic',
        v_user_id
    ) ON CONFLICT (slug) DO NOTHING;
    
    RAISE NOTICE 'Datos de prueba insertados correctamente';
END $$;

-- ========================================
-- PARTE 2: VERIFICAR SLUGS GENERADOS
-- ========================================

SELECT 'Verificando slugs generados automaticamente:' as status;

SELECT 
    'DOUGUA' as tabla,
    id,
    title_romaji,
    slug,
    CASE WHEN slug IS NOT NULL THEN 'OK' ELSE 'ERROR' END as slug_status
FROM app.dougua
LIMIT 3;

SELECT 
    'MANHUA' as tabla,
    id,
    title_romaji,
    slug,
    CASE WHEN slug IS NOT NULL THEN 'OK' ELSE 'ERROR' END as slug_status
FROM app.manhua
LIMIT 3;

SELECT 
    'MANHWA' as tabla,
    id,
    title_romaji,
    slug,
    CASE WHEN slug IS NOT NULL THEN 'OK' ELSE 'ERROR' END as slug_status
FROM app.manhwa
LIMIT 3;

SELECT 
    'FAN_COMICS' as tabla,
    id,
    title,
    slug,
    CASE WHEN slug IS NOT NULL THEN 'OK' ELSE 'ERROR' END as slug_status
FROM app.fan_comics
LIMIT 3;

-- ========================================
-- PARTE 3: VERIFICAR STATUS DEFAULT
-- ========================================

SELECT 'Verificando status default asignados:' as status;

SELECT 
    'DOUGUA' as tabla,
    d.id,
    d.title_romaji,
    ms.code as status_code,
    ms.label_es as status_label
FROM app.dougua d
LEFT JOIN app.media_statuses ms ON d.status_id = ms.id
LIMIT 3;

SELECT 
    'MANHUA' as tabla,
    m.id,
    m.title_romaji,
    ms.code as status_code,
    ms.label_es as status_label
FROM app.manhua m
LEFT JOIN app.media_statuses ms ON m.status_id = ms.id
LIMIT 3;

SELECT 
    'MANHWA' as tabla,
    m.id,
    m.title_romaji,
    ms.code as status_code,
    ms.label_es as status_label
FROM app.manhwa m
LEFT JOIN app.media_statuses ms ON m.status_id = ms.id
LIMIT 3;

SELECT 
    'FAN_COMICS' as tabla,
    f.id,
    f.title,
    ms.code as status_code,
    ms.label_es as status_label
FROM app.fan_comics f
LEFT JOIN app.media_statuses ms ON f.status_id = ms.id
LIMIT 3;

-- ========================================
-- PARTE 4: ESTADÍSTICAS FINALES
-- ========================================

SELECT 'Estadisticas de las nuevas tablas:' as status;

SELECT 
    'DOUGUA' as tabla,
    COUNT(*) as total_registros,
    COUNT(slug) as con_slug,
    COUNT(status_id) as con_status,
    SUM(CASE WHEN is_published THEN 1 ELSE 0 END) as publicados,
    SUM(CASE WHEN is_approved THEN 1 ELSE 0 END) as aprobados
FROM app.dougua;

SELECT 
    'MANHUA' as tabla,
    COUNT(*) as total_registros,
    COUNT(slug) as con_slug,
    COUNT(status_id) as con_status,
    SUM(CASE WHEN is_approved THEN 1 ELSE 0 END) as aprobados
FROM app.manhua;

SELECT 
    'MANHWA' as tabla,
    COUNT(*) as total_registros,
    COUNT(slug) as con_slug,
    COUNT(status_id) as con_status,
    SUM(CASE WHEN is_approved THEN 1 ELSE 0 END) as aprobados
FROM app.manhwa;

SELECT 
    'FAN_COMICS' as tabla,
    COUNT(*) as total_registros,
    COUNT(slug) as con_slug,
    COUNT(status_id) as con_status,
    SUM(CASE WHEN is_approved THEN 1 ELSE 0 END) as aprobados
FROM app.fan_comics;

-- ========================================
-- PARTE 5: VERIFICAR TRIGGERS ACTIVOS
-- ========================================

SELECT 'Resumen de triggers activos en nuevas tablas:' as status;

SELECT 
    tgrelid::regclass as tabla,
    COUNT(*) as total_triggers,
    STRING_AGG(tgname, ', ' ORDER BY tgname) as trigger_names
FROM pg_trigger
WHERE tgrelid IN (
    'app.dougua'::regclass,
    'app.manhua'::regclass,
    'app.manhwa'::regclass,
    'app.fan_comics'::regclass
)
AND tgname NOT LIKE 'RI_%'
GROUP BY tgrelid::regclass
ORDER BY tabla;

-- ========================================
-- RESUMEN FINAL
-- ========================================

SELECT '========================================' as separador;
SELECT 'RESUMEN FINAL' as titulo;
SELECT '========================================' as separador;
SELECT 'Tablas creadas: 4 (dougua, manhua, manhwa, fan_comics)' as info
UNION ALL
SELECT 'Funciones de slug: 4'
UNION ALL
SELECT 'Triggers por tabla: 4 (slug, updated_at, status, ranking)'
UNION ALL
SELECT 'Total triggers: 16'
UNION ALL
SELECT 'Indices por tabla: 7'
UNION ALL
SELECT 'Total indices: 28'
UNION ALL
SELECT 'Funciones actualizadas: 3 (recalculate_rankings, update_ranking, review_stats)';

SELECT 'Todas las tablas estan listas para usar' as conclusion;
