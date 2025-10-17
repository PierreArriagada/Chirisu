-- ============================================
-- SCRIPT DE EXTENSIÓN FINAL - Solo campos faltantes
-- Ejecutar en: bd_chirisu
-- ============================================

SET search_path = app, public;

-- ============================================
-- 1. EXTENDER TABLA characters
-- ============================================

ALTER TABLE characters 
ADD COLUMN IF NOT EXISTS gender VARCHAR(20),
ADD COLUMN IF NOT EXISTS age VARCHAR(20),
ADD COLUMN IF NOT EXISTS blood_type VARCHAR(5),
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

COMMENT ON COLUMN characters.age IS 'Edad del personaje (puede ser texto: "17", "Unknown", "1000+")';
COMMENT ON COLUMN characters.gender IS 'Género del personaje (Male, Female, Non-binary, Unknown)';

-- ============================================
-- 2. EXTENDER TABLA staff
-- ============================================

ALTER TABLE staff
ADD COLUMN IF NOT EXISTS name VARCHAR(255),
ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS primary_occupations TEXT[],
ADD COLUMN IF NOT EXISTS gender VARCHAR(20),
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS hometown VARCHAR(255),
ADD COLUMN IF NOT EXISTS favorites_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

COMMENT ON COLUMN staff.name IS 'Nombre simple (puede ser igual a name_romaji para compatibilidad)';
COMMENT ON COLUMN staff.primary_occupations IS 'Array de ocupaciones: {Director, Writer, Producer}';
COMMENT ON COLUMN staff.slug IS 'Slug único para URLs /staff/[slug]';

-- Actualizar campo name con name_romaji para registros existentes
UPDATE staff 
SET name = name_romaji 
WHERE name IS NULL AND name_romaji IS NOT NULL;

-- ============================================
-- 3. EXTENDER TABLA voice_actors
-- ============================================

ALTER TABLE voice_actors
ADD COLUMN IF NOT EXISTS gender VARCHAR(20),
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS blood_type VARCHAR(5),
ADD COLUMN IF NOT EXISTS hometown VARCHAR(255),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

COMMENT ON COLUMN voice_actors.gender IS 'Género del actor de voz';
COMMENT ON COLUMN voice_actors.hometown IS 'Ciudad de origen del actor de voz';

-- ============================================
-- 4. FUNCIONES PARA GENERAR SLUGS (staff)
-- ============================================

-- Función para generar slug desde un nombre
CREATE OR REPLACE FUNCTION generate_slug_from_name(name_text TEXT, entity_id INTEGER) 
RETURNS VARCHAR(255) AS $$
DECLARE
  base_slug VARCHAR(255);
BEGIN
  IF name_text IS NULL THEN
    RETURN 'person-' || entity_id::text;
  END IF;

  -- Convertir a minúsculas, quitar acentos, reemplazar espacios por guiones
  base_slug := lower(
    regexp_replace(
      regexp_replace(
        translate(
          name_text,
          'áéíóúñÁÉÍÓÚÑ',
          'aeiounAEIOUN'
        ),
        '[^a-zA-Z0-9\s-]', '', 'g'
      ),
      '\s+', '-', 'g'
    )
  );
  
  -- Limitar a 200 caracteres y agregar ID al final
  base_slug := substring(base_slug from 1 for 200) || '-' || entity_id::text;
  
  RETURN base_slug;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. GENERAR SLUGS PARA staff (registros existentes)
-- ============================================

UPDATE staff
SET slug = generate_slug_from_name(COALESCE(name_romaji, name), id)
WHERE slug IS NULL;

-- ============================================
-- 6. TRIGGERS PARA AUTO-GENERAR SLUGS EN staff
-- ============================================

-- Trigger BEFORE INSERT/UPDATE para staff
CREATE OR REPLACE FUNCTION auto_generate_staff_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL AND NEW.id IS NOT NULL THEN
    NEW.slug := generate_slug_from_name(COALESCE(NEW.name_romaji, NEW.name), NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_staff_slug ON staff;
CREATE TRIGGER trg_staff_slug
  BEFORE INSERT OR UPDATE ON staff
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_staff_slug();

-- Trigger AFTER INSERT para staff (generar slug con ID recién creado)
CREATE OR REPLACE FUNCTION auto_generate_staff_slug_after()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL THEN
    UPDATE staff 
    SET slug = generate_slug_from_name(COALESCE(NEW.name_romaji, NEW.name), NEW.id)
    WHERE id = NEW.id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_staff_slug_after ON staff;
CREATE TRIGGER trg_staff_slug_after
  AFTER INSERT ON staff
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_staff_slug_after();

-- ============================================
-- 7. INDICES PARA OPTIMIZACIÓN
-- ============================================

CREATE INDEX IF NOT EXISTS idx_staff_slug ON staff(slug);
CREATE INDEX IF NOT EXISTS idx_staff_favorites ON staff(favorites_count DESC);

-- ============================================
-- 8. VERIFICACIÓN FINAL
-- ============================================

-- Ver columnas finales de characters
SELECT 'CHARACTERS COLUMNS:' as info;
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'app' AND table_name = 'characters'
ORDER BY ordinal_position;

-- Ver columnas finales de staff
SELECT 'STAFF COLUMNS:' as info;
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'app' AND table_name = 'staff'
ORDER BY ordinal_position;

-- Ver columnas finales de voice_actors
SELECT 'VOICE_ACTORS COLUMNS:' as info;
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'app' AND table_name = 'voice_actors'
ORDER BY ordinal_position;

SELECT 'SCRIPT COMPLETADO EXITOSAMENTE ✅' as status;
