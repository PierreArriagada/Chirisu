-- Script para consolidar personajes y actores duplicados
-- Mantiene el que tiene más favoritos y actualiza todas las referencias

-- ============================================
-- PASO 1: Consolidar personajes duplicados
-- ============================================

-- 1.1: Para cada grupo de duplicados, eliminar relaciones que quedarían duplicadas
WITH duplicates AS (
    SELECT 
        name_romaji,
        ARRAY_AGG(id ORDER BY favorites_count DESC NULLS LAST, id) as all_ids,
        all_ids[1] as keep_id
    FROM app.characters
    WHERE name_romaji IS NOT NULL
    GROUP BY name_romaji
    HAVING COUNT(*) > 1
)
DELETE FROM app.characterable_characters
WHERE (character_id, characterable_type, characterable_id) IN (
    SELECT cc.character_id, cc.characterable_type, cc.characterable_id
    FROM app.characterable_characters cc
    INNER JOIN duplicates d ON cc.character_id = ANY(d.all_ids)
    WHERE cc.character_id != d.keep_id
      AND EXISTS (
          -- Ya existe una relación con el personaje que vamos a mantener
          SELECT 1 FROM app.characterable_characters cc2
          WHERE cc2.character_id = d.keep_id
            AND cc2.characterable_type = cc.characterable_type
            AND cc2.characterable_id = cc.characterable_id
      )
);

-- 1.2: Actualizar las relaciones restantes para apuntar al personaje a mantener
WITH duplicates AS (
    SELECT 
        name_romaji,
        ARRAY_AGG(id ORDER BY favorites_count DESC NULLS LAST, id) as all_ids
    FROM app.characters
    WHERE name_romaji IS NOT NULL
    GROUP BY name_romaji
    HAVING COUNT(*) > 1
)
UPDATE app.characterable_characters cc
SET character_id = d.all_ids[1]
FROM duplicates d
WHERE cc.character_id = ANY(d.all_ids)
  AND cc.character_id != d.all_ids[1];

-- 1.3: Consolidar relaciones character_voice_actors
WITH duplicates AS (
    SELECT 
        name_romaji,
        ARRAY_AGG(id ORDER BY favorites_count DESC NULLS LAST, id) as all_ids
    FROM app.characters
    WHERE name_romaji IS NOT NULL
    GROUP BY name_romaji
    HAVING COUNT(*) > 1
)
DELETE FROM app.character_voice_actors
WHERE (character_id, voice_actor_id, language) IN (
    SELECT cva.character_id, cva.voice_actor_id, cva.language
    FROM app.character_voice_actors cva
    INNER JOIN duplicates d ON cva.character_id = ANY(d.all_ids)
    WHERE cva.character_id != d.all_ids[1]
      AND EXISTS (
          SELECT 1 FROM app.character_voice_actors cva2
          WHERE cva2.character_id = d.all_ids[1]
            AND cva2.voice_actor_id = cva.voice_actor_id
            AND cva2.language = cva.language
      )
);

-- 1.4: Actualizar character_voice_actors restantes
WITH duplicates AS (
    SELECT 
        name_romaji,
        ARRAY_AGG(id ORDER BY favorites_count DESC NULLS LAST, id) as all_ids
    FROM app.characters
    WHERE name_romaji IS NOT NULL
    GROUP BY name_romaji
    HAVING COUNT(*) > 1
)
UPDATE app.character_voice_actors cva
SET character_id = d.all_ids[1]
FROM duplicates d
WHERE cva.character_id = ANY(d.all_ids)
  AND cva.character_id != d.all_ids[1];

-- 1.5: Eliminar personajes duplicados
WITH duplicates AS (
    SELECT 
        name_romaji,
        ARRAY_AGG(id ORDER BY favorites_count DESC NULLS LAST, id) as all_ids
    FROM app.characters
    WHERE name_romaji IS NOT NULL
    GROUP BY name_romaji
    HAVING COUNT(*) > 1
)
DELETE FROM app.characters
WHERE id IN (
    SELECT unnest(all_ids[2:])  -- Todos excepto el primero
    FROM duplicates
);

-- ============================================
-- PASO 2: Consolidar actores de voz duplicados
-- ============================================

-- 2.1: Eliminar relaciones duplicadas
WITH duplicates AS (
    SELECT 
        name_romaji,
        ARRAY_AGG(id ORDER BY favorites_count DESC NULLS LAST, id) as all_ids
    FROM app.voice_actors
    WHERE name_romaji IS NOT NULL
    GROUP BY name_romaji
    HAVING COUNT(*) > 1
)
DELETE FROM app.character_voice_actors
WHERE (voice_actor_id, character_id, language) IN (
    SELECT cva.voice_actor_id, cva.character_id, cva.language
    FROM app.character_voice_actors cva
    INNER JOIN duplicates d ON cva.voice_actor_id = ANY(d.all_ids)
    WHERE cva.voice_actor_id != d.all_ids[1]
      AND EXISTS (
          SELECT 1 FROM app.character_voice_actors cva2
          WHERE cva2.voice_actor_id = d.all_ids[1]
            AND cva2.character_id = cva.character_id
            AND cva2.language = cva.language
      )
);

-- 2.2: Actualizar relaciones restantes
WITH duplicates AS (
    SELECT 
        name_romaji,
        ARRAY_AGG(id ORDER BY favorites_count DESC NULLS LAST, id) as all_ids
    FROM app.voice_actors
    WHERE name_romaji IS NOT NULL
    GROUP BY name_romaji
    HAVING COUNT(*) > 1
)
UPDATE app.character_voice_actors cva
SET voice_actor_id = d.all_ids[1]
FROM duplicates d
WHERE cva.voice_actor_id = ANY(d.all_ids)
  AND cva.voice_actor_id != d.all_ids[1];

-- 2.3: Eliminar actores duplicados
WITH duplicates AS (
    SELECT 
        name_romaji,
        ARRAY_AGG(id ORDER BY favorites_count DESC NULLS LAST, id) as all_ids
    FROM app.voice_actors
    WHERE name_romaji IS NOT NULL
    GROUP BY name_romaji
    HAVING COUNT(*) > 1
)
DELETE FROM app.voice_actors
WHERE id IN (
    SELECT unnest(all_ids[2:])
    FROM duplicates
);

-- ============================================
-- RESUMEN FINAL
-- ============================================
SELECT 'Personajes únicos' as tabla, COUNT(*) as total FROM app.characters
UNION ALL
SELECT 'Actores únicos', COUNT(*) FROM app.voice_actors
UNION ALL
SELECT 'Relaciones personaje-media', COUNT(*) FROM app.characterable_characters
UNION ALL
SELECT 'Relaciones actor-personaje', COUNT(*) FROM app.character_voice_actors
UNION ALL
SELECT 'Personajes duplicados restantes', COUNT(*) FROM (
    SELECT name_romaji
    FROM app.characters
    WHERE name_romaji IS NOT NULL
    GROUP BY name_romaji
    HAVING COUNT(*) > 1
) sub
UNION ALL
SELECT 'Actores duplicados restantes', COUNT(*) FROM (
    SELECT name_romaji
    FROM app.voice_actors
    WHERE name_romaji IS NOT NULL
    GROUP BY name_romaji
    HAVING COUNT(*) > 1
) sub;
