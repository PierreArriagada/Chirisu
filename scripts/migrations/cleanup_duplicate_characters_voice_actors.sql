-- ============================================
-- SCRIPT DE LIMPIEZA DE DUPLICADOS
-- Personajes y Actores de Voz
-- ============================================
-- ADVERTENCIA: Ejecutar solo UNA VEZ
-- Respaldo antes de ejecutar: pg_dump bd_chirisu > backup_before_cleanup.sql
-- ============================================

BEGIN;

-- 1. LIMPIAR PERSONAJES DUPLICADOS
-- Mantener el personaje con ID más bajo (más antiguo) y mayor favorites_count

-- Primero, crear tabla temporal con IDs a mantener
CREATE TEMP TABLE characters_to_keep AS
SELECT MIN(c.id) as id_to_keep, c.name
FROM app.characters c
GROUP BY c.name
HAVING COUNT(*) > 1;

-- Paso 1: Eliminar relaciones duplicadas de characterable_characters
DELETE FROM app.characterable_characters cc
WHERE cc.id IN (
    SELECT cc2.id
    FROM app.characterable_characters cc2
    INNER JOIN app.characters c ON cc2.character_id = c.id
    INNER JOIN characters_to_keep ctk ON c.name = ctk.name
    WHERE cc2.character_id != ctk.id_to_keep
    AND EXISTS (
        SELECT 1 FROM app.characterable_characters cc3
        WHERE cc3.character_id = ctk.id_to_keep
        AND cc3.characterable_type = cc2.characterable_type
        AND cc3.characterable_id = cc2.characterable_id
    )
);

-- Paso 2: Actualizar relaciones restantes para apuntar al personaje a mantener
UPDATE app.characterable_characters cc
SET character_id = (
    SELECT id_to_keep 
    FROM characters_to_keep ctk
    INNER JOIN app.characters c ON c.name = ctk.name
    WHERE c.id = cc.character_id
)
WHERE EXISTS (
    SELECT 1 FROM characters_to_keep ctk
    INNER JOIN app.characters c ON c.name = ctk.name
    WHERE c.id = cc.character_id
    AND cc.character_id != ctk.id_to_keep
);

-- Paso 3: Eliminar duplicados de character_voice_actors
DELETE FROM app.character_voice_actors cva
WHERE cva.id IN (
    SELECT cva2.id
    FROM app.character_voice_actors cva2
    INNER JOIN app.characters c ON cva2.character_id = c.id
    INNER JOIN characters_to_keep ctk ON c.name = ctk.name
    WHERE cva2.character_id != ctk.id_to_keep
    AND EXISTS (
        SELECT 1 FROM app.character_voice_actors cva3
        WHERE cva3.character_id = ctk.id_to_keep
        AND cva3.voice_actor_id = cva2.voice_actor_id
    )
);

-- Paso 4: Actualizar character_voice_actors restantes
UPDATE app.character_voice_actors cva
SET character_id = (
    SELECT id_to_keep 
    FROM characters_to_keep ctk
    INNER JOIN app.characters c ON c.name = ctk.name
    WHERE c.id = cva.character_id
)
WHERE EXISTS (
    SELECT 1 FROM characters_to_keep ctk
    INNER JOIN app.characters c ON c.name = ctk.name
    WHERE c.id = cva.character_id
    AND cva.character_id != ctk.id_to_keep
);

-- Paso 5: Eliminar duplicados de user_favorites
DELETE FROM app.user_favorites uf
WHERE uf.favorable_type = 'character'
AND uf.id IN (
    SELECT uf2.id
    FROM app.user_favorites uf2
    INNER JOIN app.characters c ON uf2.favorable_id = c.id
    INNER JOIN characters_to_keep ctk ON c.name = ctk.name
    WHERE uf2.favorable_id != ctk.id_to_keep
    AND EXISTS (
        SELECT 1 FROM app.user_favorites uf3
        WHERE uf3.user_id = uf2.user_id
        AND uf3.favorable_type = 'character'
        AND uf3.favorable_id = ctk.id_to_keep
    )
);

-- Paso 6: Actualizar user_favorites restantes
UPDATE app.user_favorites uf
SET favorable_id = (
    SELECT id_to_keep 
    FROM characters_to_keep ctk
    INNER JOIN app.characters c ON c.name = ctk.name
    WHERE c.id = uf.favorable_id
)
WHERE uf.favorable_type = 'character'
AND EXISTS (
    SELECT 1 FROM characters_to_keep ctk
    INNER JOIN app.characters c ON c.name = ctk.name
    WHERE c.id = uf.favorable_id
    AND uf.favorable_id != ctk.id_to_keep
);

-- Paso 7: Eliminar personajes duplicados
DELETE FROM app.characters
WHERE id NOT IN (SELECT id_to_keep FROM characters_to_keep)
AND name IN (SELECT name FROM characters_to_keep);

-- 2. LIMPIAR ACTORES DE VOZ DUPLICADOS
-- Mantener el actor con ID más bajo y mayor favorites_count

CREATE TEMP TABLE voice_actors_to_keep AS
SELECT MIN(va.id) as id_to_keep, va.name_romaji
FROM app.voice_actors va
GROUP BY va.name_romaji
HAVING COUNT(*) > 1;

-- Paso 1: Eliminar duplicados de character_voice_actors
DELETE FROM app.character_voice_actors cva
WHERE cva.id IN (
    SELECT cva2.id
    FROM app.character_voice_actors cva2
    INNER JOIN app.voice_actors va ON cva2.voice_actor_id = va.id
    INNER JOIN voice_actors_to_keep vatk ON va.name_romaji = vatk.name_romaji
    WHERE cva2.voice_actor_id != vatk.id_to_keep
    AND EXISTS (
        SELECT 1 FROM app.character_voice_actors cva3
        WHERE cva3.voice_actor_id = vatk.id_to_keep
        AND cva3.character_id = cva2.character_id
    )
);

-- Paso 2: Actualizar character_voice_actors restantes
UPDATE app.character_voice_actors cva
SET voice_actor_id = (
    SELECT id_to_keep 
    FROM voice_actors_to_keep vatk
    INNER JOIN app.voice_actors va ON va.name_romaji = vatk.name_romaji
    WHERE va.id = cva.voice_actor_id
)
WHERE EXISTS (
    SELECT 1 FROM voice_actors_to_keep vatk
    INNER JOIN app.voice_actors va ON va.name_romaji = vatk.name_romaji
    WHERE va.id = cva.voice_actor_id
    AND cva.voice_actor_id != vatk.id_to_keep
);

-- Paso 3: Eliminar duplicados de user_favorites
DELETE FROM app.user_favorites uf
WHERE uf.favorable_type = 'voice_actor'
AND uf.id IN (
    SELECT uf2.id
    FROM app.user_favorites uf2
    INNER JOIN app.voice_actors va ON uf2.favorable_id = va.id
    INNER JOIN voice_actors_to_keep vatk ON va.name_romaji = vatk.name_romaji
    WHERE uf2.favorable_id != vatk.id_to_keep
    AND EXISTS (
        SELECT 1 FROM app.user_favorites uf3
        WHERE uf3.user_id = uf2.user_id
        AND uf3.favorable_type = 'voice_actor'
        AND uf3.favorable_id = vatk.id_to_keep
    )
);

-- Paso 4: Actualizar user_favorites restantes
UPDATE app.user_favorites uf
SET favorable_id = (
    SELECT id_to_keep 
    FROM voice_actors_to_keep vatk
    INNER JOIN app.voice_actors va ON va.name_romaji = vatk.name_romaji
    WHERE va.id = uf.favorable_id
)
WHERE uf.favorable_type = 'voice_actor'
AND EXISTS (
    SELECT 1 FROM voice_actors_to_keep vatk
    INNER JOIN app.voice_actors va ON va.name_romaji = vatk.name_romaji
    WHERE va.id = uf.favorable_id
    AND uf.favorable_id != vatk.id_to_keep
);

-- Paso 5: Eliminar actores de voz duplicados
DELETE FROM app.voice_actors
WHERE id NOT IN (SELECT id_to_keep FROM voice_actors_to_keep)
AND name_romaji IN (SELECT name_romaji FROM voice_actors_to_keep);

-- 3. REPORTE FINAL
SELECT 
    'Personajes duplicados eliminados' as operacion,
    (SELECT COUNT(*) FROM characters_to_keep) as total;

SELECT 
    'Actores de voz duplicados eliminados' as operacion,
    (SELECT COUNT(*) FROM voice_actors_to_keep) as total;

-- Limpiar tablas temporales
DROP TABLE characters_to_keep;
DROP TABLE voice_actors_to_keep;

COMMIT;

-- ============================================
-- VERIFICACIÓN POST-LIMPIEZA
-- ============================================

-- Verificar que no quedan duplicados de personajes
SELECT name, COUNT(*) as duplicados 
FROM app.characters 
GROUP BY name 
HAVING COUNT(*) > 1 
ORDER BY duplicados DESC 
LIMIT 10;

-- Verificar que no quedan duplicados de actores
SELECT name_romaji, COUNT(*) as duplicados 
FROM app.voice_actors 
GROUP BY name_romaji 
HAVING COUNT(*) > 1 
ORDER BY duplicados DESC 
LIMIT 10;

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
