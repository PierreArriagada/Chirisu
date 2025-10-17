-- ============================================
-- Script para agregar columna SLUG a todas las tablas de media
-- ============================================
-- Ejecutar este script en tu base de datos PostgreSQL
-- ============================================

-- 1. Agregar columna slug a tabla anime
ALTER TABLE app.anime 
ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;

-- 2. Agregar columna slug a tabla manga
ALTER TABLE app.manga 
ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;

-- 3. Agregar columna slug a tabla novels
ALTER TABLE app.novels 
ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;

-- 4. Agregar columna slug a tabla manhua (si existe)
ALTER TABLE app.manhua 
ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;

-- 5. Agregar columna slug a tabla manwha (si existe)
ALTER TABLE app.manwha 
ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;

-- 6. Agregar columna slug a tabla fan_comics (si existe)
ALTER TABLE app.fan_comics 
ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;

-- 7. Agregar columna slug a tabla dougua (si existe)
ALTER TABLE app.dougua 
ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;

-- ============================================
-- GENERAR SLUGS AUTOMÁTICAMENTE PARA REGISTROS EXISTENTES
-- ============================================

-- Función para generar slug desde un título
CREATE OR REPLACE FUNCTION generate_slug(title TEXT, id INTEGER) 
RETURNS VARCHAR(255) AS $$
DECLARE
  base_slug VARCHAR(255);
BEGIN
  -- Convertir a minúsculas, quitar acentos, reemplazar espacios por guiones
  base_slug := lower(
    regexp_replace(
      regexp_replace(
        translate(
          title,
          'áéíóúñÁÉÍÓÚÑ',
          'aeiounAEIOUN'
        ),
        '[^a-zA-Z0-9\s-]', '', 'g'  -- Quitar caracteres especiales
      ),
      '\s+', '-', 'g'  -- Reemplazar espacios por guiones
    )
  );
  
  -- Limitar a 200 caracteres y agregar ID al final
  base_slug := substring(base_slug from 1 for 200) || '-' || id::text;
  
  RETURN base_slug;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Generar slugs para anime
-- ============================================
UPDATE app.anime
SET slug = generate_slug(
  COALESCE(title_romaji, title_english, title_native),
  id
)
WHERE slug IS NULL;

-- ============================================
-- Generar slugs para manga
-- ============================================
UPDATE app.manga
SET slug = generate_slug(
  COALESCE(title_romaji, title_english, title_native),
  id
)
WHERE slug IS NULL;

-- ============================================
-- Generar slugs para novels
-- ============================================
UPDATE app.novels
SET slug = generate_slug(
  COALESCE(title_romaji, title_english, title_native),
  id
)
WHERE slug IS NULL;

-- ============================================
-- Generar slugs para manhua (ajustar si el nombre de tabla es diferente)
-- ============================================
-- Descomentar si la tabla existe
-- UPDATE app.manhua
-- SET slug = generate_slug(
--   COALESCE(title_romaji, title_english, title_native),
--   id
-- )
-- WHERE slug IS NULL;

-- ============================================
-- Generar slugs para manwha (ajustar si el nombre de tabla es diferente)
-- ============================================
-- Descomentar si la tabla existe
-- UPDATE app.manwha
-- SET slug = generate_slug(
--   COALESCE(title_romaji, title_english, title_native),
--   id
-- )
-- WHERE slug IS NULL;

-- ============================================
-- Generar slugs para fan_comics (ajustar si el nombre de tabla es diferente)
-- ============================================
-- Descomentar si la tabla existe
-- UPDATE app.fan_comics
-- SET slug = generate_slug(
--   COALESCE(title_romaji, title_english, title_native),
--   id
-- )
-- WHERE slug IS NULL;

-- ============================================
-- Generar slugs para dougua (ajustar si el nombre de tabla es diferente)
-- ============================================
-- Descomentar si la tabla existe
-- UPDATE app.dougua
-- SET slug = generate_slug(
--   COALESCE(title_romaji, title_english, title_native),
--   id
-- )
-- WHERE slug IS NULL;

-- ============================================
-- TRIGGER para generar slug automáticamente en nuevos registros
-- ============================================

-- Función de trigger
CREATE OR REPLACE FUNCTION auto_generate_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL THEN
    NEW.slug := generate_slug(
      COALESCE(NEW.title_romaji, NEW.title_english, NEW.title_native),
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear triggers para cada tabla
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
-- VERIFICACIÓN
-- ============================================

-- Ver algunos slugs generados para anime
SELECT id, title_romaji, title_english, slug 
FROM app.anime 
LIMIT 5;

-- Ver algunos slugs generados para manga
SELECT id, title_romaji, title_english, slug 
FROM app.manga 
LIMIT 5;

-- Ver algunos slugs generados para novels
SELECT id, title_romaji, title_english, slug 
FROM app.novels 
LIMIT 5;

-- ============================================
-- FIN DEL SCRIPT
-- ============================================

/*
NOTAS IMPORTANTES:

1. La columna slug será UNIQUE para evitar duplicados
2. El formato del slug será: "titulo-en-kebab-case-123" (donde 123 es el ID)
3. Los triggers generarán slugs automáticamente para nuevos registros
4. Los slugs existentes se generan a partir de title_romaji, title_english o title_native

EJEMPLOS de slugs generados:
- "jujutsu-kaisen-1"
- "one-piece-42"
- "chainsaw-man-156"

Para ejecutar este script:
1. Abre tu cliente PostgreSQL (pgAdmin, DBeaver, etc.)
2. Copia y pega este script
3. Ejecuta todo el script
4. Verifica los resultados con las queries SELECT al final
*/
