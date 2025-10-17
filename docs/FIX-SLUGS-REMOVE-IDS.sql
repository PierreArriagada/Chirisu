-- ============================================
-- Script para CORREGIR SLUGS - Remover IDs numéricos
-- ============================================
-- Este script modifica la función generate_slug() para NO incluir
-- el ID al final del slug, haciendo URLs más limpias
-- ============================================

-- ============================================
-- 1. MODIFICAR función generate_slug() SIN el ID
-- ============================================
CREATE OR REPLACE FUNCTION generate_slug(title TEXT, id INTEGER) 
RETURNS VARCHAR(255) AS $$
DECLARE
  base_slug VARCHAR(255);
  final_slug VARCHAR(255);
  counter INTEGER := 0;
BEGIN
  -- Convertir a minúsculas, quitar acentos, reemplazar espacios por guiones
  base_slug := lower(
    regexp_replace(
      regexp_replace(
        translate(
          title,
          'áéíóúñÁÉÍÓÚÑàèìòùÀÈÌÒÙäëïöüÄËÏÖÜ',
          'aeiounAEIOUNaeiouAEIOUaeiouAEIOU'
        ),
        '[^a-zA-Z0-9\s-]', '', 'g'  -- Quitar caracteres especiales
      ),
      '\s+', '-', 'g'  -- Reemplazar espacios por guiones
    )
  );
  
  -- Limitar a 250 caracteres (sin agregar ID)
  base_slug := substring(base_slug from 1 for 250);
  
  -- Remover guiones al inicio o final
  base_slug := regexp_replace(base_slug, '^-+|-+$', '', 'g');
  
  RETURN base_slug;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. ACTUALIZAR slugs en tabla ANIME
-- ============================================
UPDATE app.anime
SET slug = generate_slug(
  COALESCE(title_romaji, title_english, title_native),
  id
);

-- ============================================
-- 3. ACTUALIZAR slugs en tabla MANGA
-- ============================================
UPDATE app.manga
SET slug = generate_slug(
  COALESCE(title_romaji, title_english, title_native),
  id
);

-- ============================================
-- 4. ACTUALIZAR slugs en tabla NOVELS
-- ============================================
UPDATE app.novels
SET slug = generate_slug(
  COALESCE(title_romaji, title_english, title_native),
  id
);

-- ============================================
-- 5. ACTUALIZAR slugs en tabla MANHUA (si existe)
-- ============================================
-- Descomentar si la tabla existe y tiene datos
-- UPDATE app.manhua
-- SET slug = generate_slug(
--   COALESCE(title_romaji, title_english, title_native),
--   id
-- );

-- ============================================
-- 6. ACTUALIZAR slugs en tabla MANWHA (si existe)
-- ============================================
-- Descomentar si la tabla existe y tiene datos
-- UPDATE app.manwha
-- SET slug = generate_slug(
--   COALESCE(title_romaji, title_english, title_native),
--   id
-- );

-- ============================================
-- 7. ACTUALIZAR slugs en tabla FAN_COMICS (si existe)
-- ============================================
-- Descomentar si la tabla existe y tiene datos
-- UPDATE app.fan_comics
-- SET slug = generate_slug(
--   COALESCE(title_romaji, title_english, title_native),
--   id
-- );

-- ============================================
-- 8. ACTUALIZAR slugs en tabla DOUGUA (si existe)
-- ============================================
-- Descomentar si la tabla existe y tiene datos
-- UPDATE app.dougua
-- SET slug = generate_slug(
--   COALESCE(title_romaji, title_english, title_native),
--   id
-- );

-- ============================================
-- 9. RECREAR triggers con la función actualizada
-- ============================================

-- Función de trigger (usa la función generate_slug actualizada)
CREATE OR REPLACE FUNCTION auto_generate_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_slug(
      COALESCE(NEW.title_romaji, NEW.title_english, NEW.title_native),
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recrear triggers para cada tabla
DROP TRIGGER IF EXISTS anime_slug_trigger ON app.anime;
CREATE TRIGGER anime_slug_trigger
  BEFORE INSERT OR UPDATE ON app.anime
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_slug();

DROP TRIGGER IF EXISTS manga_slug_trigger ON app.manga;
CREATE TRIGGER manga_slug_trigger
  BEFORE INSERT OR UPDATE ON app.manga
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_slug();

DROP TRIGGER IF EXISTS novels_slug_trigger ON app.novels;
CREATE TRIGGER novels_slug_trigger
  BEFORE INSERT OR UPDATE ON app.novels
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_slug();

-- Descomentar para las demás tablas si existen
-- DROP TRIGGER IF EXISTS manhua_slug_trigger ON app.manhua;
-- CREATE TRIGGER manhua_slug_trigger
--   BEFORE INSERT OR UPDATE ON app.manhua
--   FOR EACH ROW
--   EXECUTE FUNCTION auto_generate_slug();

-- DROP TRIGGER IF EXISTS manwha_slug_trigger ON app.manwha;
-- CREATE TRIGGER manwha_slug_trigger
--   BEFORE INSERT OR UPDATE ON app.manwha
--   FOR EACH ROW
--   EXECUTE FUNCTION auto_generate_slug();

-- DROP TRIGGER IF EXISTS fan_comics_slug_trigger ON app.fan_comics;
-- CREATE TRIGGER fan_comics_slug_trigger
--   BEFORE INSERT OR UPDATE ON app.fan_comics
--   FOR EACH ROW
--   EXECUTE FUNCTION auto_generate_slug();

-- DROP TRIGGER IF EXISTS dougua_slug_trigger ON app.dougua;
-- CREATE TRIGGER dougua_slug_trigger
--   BEFORE INSERT OR UPDATE ON app.dougua
--   FOR EACH ROW
--   EXECUTE FUNCTION auto_generate_slug();

-- ============================================
-- 10. VERIFICAR resultados
-- ============================================
SELECT 'anime' as table_name, id, title_romaji, slug 
FROM app.anime 
WHERE id IN (3)
UNION ALL
SELECT 'manga' as table_name, id, title_romaji, slug 
FROM app.manga 
WHERE id IN (2)
ORDER BY table_name, id;

-- ============================================
-- NOTAS IMPORTANTES:
-- ============================================
-- 1. Los slugs ahora NO incluyen el ID al final
-- 2. URLs más limpias: /anime/jujutsu-kaisen en vez de /anime/jujutsu-kaisen-3
-- 3. Si hay títulos duplicados, el constraint UNIQUE del slug evitará duplicados
-- 4. Para títulos duplicados, deberás agregar manualmente un sufijo distintivo
-- 5. Los triggers automáticos ahora generan slugs sin IDs para nuevos registros
-- ============================================
