-- ============================================
-- SCRIPT DE EXTENSIÓN DE BASE DE DATOS
-- Agrega campos necesarios para sistema completo de personajes, staff y actores de voz
-- ============================================

SET search_path = app, public;

-- ============================================
-- 1. EXTENDER TABLA voice_actors (ya existe)
-- ============================================

-- Agregar columnas adicionales a voice_actors si no existen
ALTER TABLE voice_actors 
ADD COLUMN IF NOT EXISTS favorites_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS gender VARCHAR(20),
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS blood_type VARCHAR(5),
ADD COLUMN IF NOT EXISTS hometown VARCHAR(255),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

COMMENT ON TABLE voice_actors IS 'Actores de voz con información detallada.';

-- ============================================
-- 2. EXTENDER TABLA characters
-- ============================================

-- Agregar columnas a characters
ALTER TABLE characters 
ADD COLUMN IF NOT EXISTS name_romaji VARCHAR(255),
ADD COLUMN IF NOT EXISTS name_native VARCHAR(255),
ADD COLUMN IF NOT EXISTS image_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS favorites_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS gender VARCHAR(20),
ADD COLUMN IF NOT EXISTS age VARCHAR(20), -- Puede ser "17", "Unknown", "1000+" etc.
ADD COLUMN IF NOT EXISTS blood_type VARCHAR(5),
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

COMMENT ON COLUMN characters.name IS 'Nombre simple para compatibilidad (puede ser igual a name_romaji)';
COMMENT ON COLUMN characters.name_romaji IS 'Nombre en romanji (principal)';
COMMENT ON COLUMN characters.name_native IS 'Nombre nativo (japonés, chino, etc.)';
COMMENT ON COLUMN characters.slug IS 'Slug único para URLs amigables';

-- ============================================
-- 3. EXTENDER TABLA staff
-- ============================================

ALTER TABLE staff
ADD COLUMN IF NOT EXISTS name VARCHAR(255), -- Nombre simple para compatibilidad
ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS primary_occupations TEXT[], -- Array de ocupaciones: ['Director', 'Writer']
ADD COLUMN IF NOT EXISTS gender VARCHAR(20),
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS hometown VARCHAR(255),
ADD COLUMN IF NOT EXISTS favorites_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

COMMENT ON COLUMN staff.name IS 'Nombre simple (puede ser igual a name_romaji)';
COMMENT ON COLUMN staff.primary_occupations IS 'Ocupaciones principales del staff';

-- ============================================
-- 4. VERIFICAR TABLA character_voice_actors (ya existe)
-- ============================================

-- La tabla character_voice_actors ya existe con estructura:
-- id, character_id, voice_actor_id, media_type, media_id, language
-- Solo verificamos indices

CREATE INDEX IF NOT EXISTS idx_char_va_character ON character_voice_actors(character_id);
CREATE INDEX IF NOT EXISTS idx_char_va_voice_actor ON character_voice_actors(voice_actor_id);
CREATE INDEX IF NOT EXISTS idx_char_va_media ON character_voice_actors(media_type, media_id);

-- ============================================
-- 5. FUNCIONES PARA GENERAR SLUGS AUTOMÁTICOS
-- ============================================

-- Función para generar slug desde un nombre
CREATE OR REPLACE FUNCTION generate_slug_from_name(name_text TEXT, entity_id INTEGER) 
RETURNS VARCHAR(255) AS $$
DECLARE
  base_slug VARCHAR(255);
BEGIN
  -- Convertir a minúsculas, quitar acentos, reemplazar espacios por guiones
  base_slug := lower(
    regexp_replace(
      regexp_replace(
        translate(
          name_text,
          'áéíóúñÁÉÍÓÚÑ',
          'aeiounAEIOUN'
        ),
        '[^a-zA-Z0-9\s-]', '', 'g'  -- Quitar caracteres especiales
      ),
      '\s+', '-', 'g'  -- Reemplazar espacios por guiones
    )
  );
  
  -- Limitar a 200 caracteres y agregar ID al final
  base_slug := substring(base_slug from 1 for 200) || '-' || entity_id::text;
  
  RETURN base_slug;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. TRIGGERS PARA AUTO-GENERAR SLUGS
-- ============================================

-- Trigger para characters
CREATE OR REPLACE FUNCTION auto_generate_character_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL AND NEW.id IS NOT NULL THEN
    NEW.slug := generate_slug_from_name(
      COALESCE(NEW.name_romaji, NEW.name),
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_character_slug ON characters;
CREATE TRIGGER trg_character_slug
  BEFORE INSERT OR UPDATE ON characters
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_character_slug();

-- Trigger AFTER INSERT para characters (si el ID aún no existía)
CREATE OR REPLACE FUNCTION auto_generate_character_slug_after()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL THEN
    UPDATE characters 
    SET slug = generate_slug_from_name(COALESCE(NEW.name_romaji, NEW.name), NEW.id)
    WHERE id = NEW.id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_character_slug_after ON characters;
CREATE TRIGGER trg_character_slug_after
  AFTER INSERT ON characters
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_character_slug_after();

-- Trigger para staff
CREATE OR REPLACE FUNCTION auto_generate_staff_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL AND NEW.id IS NOT NULL THEN
    NEW.slug := generate_slug_from_name(
      COALESCE(NEW.name_romaji, NEW.name),
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_staff_slug ON staff;
CREATE TRIGGER trg_staff_slug
  BEFORE INSERT OR UPDATE ON staff
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_staff_slug();

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

-- Trigger para voice_actors
CREATE OR REPLACE FUNCTION auto_generate_va_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL AND NEW.id IS NOT NULL THEN
    NEW.slug := generate_slug_from_name(NEW.name_romaji, NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_va_slug ON voice_actors;
CREATE TRIGGER trg_va_slug
  BEFORE INSERT OR UPDATE ON voice_actors
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_va_slug();

CREATE OR REPLACE FUNCTION auto_generate_va_slug_after()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL THEN
    UPDATE voice_actors 
    SET slug = generate_slug_from_name(NEW.name_romaji, NEW.id)
    WHERE id = NEW.id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_va_slug_after ON voice_actors;
CREATE TRIGGER trg_va_slug_after
  AFTER INSERT ON voice_actors
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_va_slug_after();

-- ============================================
-- 7. GENERAR SLUGS PARA REGISTROS EXISTENTES
-- ============================================

-- Generar slugs para characters existentes
UPDATE characters
SET slug = generate_slug_from_name(COALESCE(name_romaji, name), id)
WHERE slug IS NULL;

-- Generar slugs para staff existentes
UPDATE staff
SET slug = generate_slug_from_name(COALESCE(name_romaji, name), id)
WHERE slug IS NULL;

-- Generar slugs para voice_actors existentes
UPDATE voice_actors
SET slug = generate_slug_from_name(name_romaji, id)
WHERE slug IS NULL;

-- ============================================
-- 8. INDICES PARA OPTIMIZACIÓN
-- ============================================

CREATE INDEX IF NOT EXISTS idx_characters_slug ON characters(slug);
CREATE INDEX IF NOT EXISTS idx_staff_slug ON staff(slug);
CREATE INDEX IF NOT EXISTS idx_voice_actors_slug ON voice_actors(slug);
CREATE INDEX IF NOT EXISTS idx_voice_actors_language ON voice_actors(language);

-- ============================================
-- FIN DEL SCRIPT
-- ============================================

-- Verificar las columnas agregadas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'app' 
  AND table_name = 'characters'
ORDER BY ordinal_position;

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'app' 
  AND table_name = 'staff'
ORDER BY ordinal_position;

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'app' 
  AND table_name = 'voice_actors'
ORDER BY ordinal_position;
