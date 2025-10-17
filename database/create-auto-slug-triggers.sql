-- ============================================================================
-- TRIGGERS AUTOMÁTICOS PARA GENERACIÓN DE SLUGS
-- ============================================================================
-- Este script crea triggers que generan slugs automáticamente al insertar
-- o actualizar registros en las tablas: characters, voice_actors, staff
-- 
-- Los slugs se generan SIN ID, solo con el nombre:
--   - yuji-itadori (NO yuji-itadori-1)
--   - gege-akutami (NO gege-akutami-2)
-- ============================================================================

-- ============================================================================
-- FUNCIÓN GENÉRICA PARA GENERAR SLUGS
-- ============================================================================
CREATE OR REPLACE FUNCTION app.generate_slug_from_name(base_text TEXT)
RETURNS TEXT AS $$
DECLARE
  slug TEXT;
BEGIN
  -- Convertir a minúsculas y reemplazar caracteres no alfanuméricos con guiones
  slug := LOWER(REGEXP_REPLACE(base_text, '[^a-zA-Z0-9]+', '-', 'g'));
  
  -- Eliminar guiones al inicio y al final
  slug := REGEXP_REPLACE(slug, '^-+|-+$', '', 'g');
  
  RETURN slug;
END;
$$ LANGUAGE plpgsql IMMUTABLE;


-- ============================================================================
-- TRIGGER PARA CHARACTERS
-- ============================================================================
CREATE OR REPLACE FUNCTION app.generate_character_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Solo generar si el slug está vacío
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    -- Usar name_romaji primero, si no existe usar name
    base_slug := app.generate_slug_from_name(COALESCE(NEW.name_romaji, NEW.name));
    final_slug := base_slug;
    
    -- Verificar si ya existe, si existe agregar número incremental
    WHILE EXISTS (SELECT 1 FROM app.characters WHERE slug = final_slug AND id != COALESCE(NEW.id, 0)) LOOP
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;
    
    NEW.slug := final_slug;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar trigger existente si existe
DROP TRIGGER IF EXISTS trg_generate_character_slug ON app.characters;

-- Crear trigger para characters
CREATE TRIGGER trg_generate_character_slug
  BEFORE INSERT OR UPDATE ON app.characters
  FOR EACH ROW
  EXECUTE FUNCTION app.generate_character_slug();


-- ============================================================================
-- TRIGGER PARA VOICE_ACTORS
-- ============================================================================
CREATE OR REPLACE FUNCTION app.generate_voice_actor_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Solo generar si el slug está vacío
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    -- Usar name_romaji primero, si no existe usar name_native
    base_slug := app.generate_slug_from_name(COALESCE(NEW.name_romaji, NEW.name_native));
    final_slug := base_slug;
    
    -- Verificar si ya existe, si existe agregar número incremental
    WHILE EXISTS (SELECT 1 FROM app.voice_actors WHERE slug = final_slug AND id != COALESCE(NEW.id, 0)) LOOP
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;
    
    NEW.slug := final_slug;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar trigger existente si existe
DROP TRIGGER IF EXISTS trg_generate_voice_actor_slug ON app.voice_actors;

-- Crear trigger para voice_actors
CREATE TRIGGER trg_generate_voice_actor_slug
  BEFORE INSERT OR UPDATE ON app.voice_actors
  FOR EACH ROW
  EXECUTE FUNCTION app.generate_voice_actor_slug();


-- ============================================================================
-- TRIGGER PARA STAFF
-- ============================================================================
CREATE OR REPLACE FUNCTION app.generate_staff_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Solo generar si el slug está vacío
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    -- Usar name_romaji primero, si no existe usar name
    base_slug := app.generate_slug_from_name(COALESCE(NEW.name_romaji, NEW.name));
    final_slug := base_slug;
    
    -- Verificar si ya existe, si existe agregar número incremental
    WHILE EXISTS (SELECT 1 FROM app.staff WHERE slug = final_slug AND id != COALESCE(NEW.id, 0)) LOOP
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;
    
    NEW.slug := final_slug;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar trigger existente si existe
DROP TRIGGER IF EXISTS trg_generate_staff_slug ON app.staff;

-- Crear trigger para staff
CREATE TRIGGER trg_generate_staff_slug
  BEFORE INSERT OR UPDATE ON app.staff
  FOR EACH ROW
  EXECUTE FUNCTION app.generate_staff_slug();


-- ============================================================================
-- REGENERAR SLUGS EXISTENTES (SIN ID)
-- ============================================================================

-- Resetear slugs de characters
UPDATE app.characters 
SET slug = NULL;

-- Regenerar slugs de characters (el trigger se ejecutará automáticamente)
UPDATE app.characters 
SET slug = app.generate_slug_from_name(COALESCE(name_romaji, name))
WHERE id > 0;

-- Resetear slugs de voice_actors
UPDATE app.voice_actors 
SET slug = NULL;

-- Regenerar slugs de voice_actors (el trigger se ejecutará automáticamente)
UPDATE app.voice_actors 
SET slug = app.generate_slug_from_name(COALESCE(name_romaji, name_native))
WHERE id > 0;

-- Resetear slugs de staff
UPDATE app.staff 
SET slug = NULL;

-- Regenerar slugs de staff (el trigger se ejecutará automáticamente)
UPDATE app.staff 
SET slug = app.generate_slug_from_name(COALESCE(name_romaji, name))
WHERE id > 0;


-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
-- Verificar characters
SELECT id, name, name_romaji, slug 
FROM app.characters 
ORDER BY id;

-- Verificar voice_actors
SELECT id, name_romaji, slug 
FROM app.voice_actors 
ORDER BY id;

-- Verificar staff
SELECT id, name_romaji, slug 
FROM app.staff 
ORDER BY id;


-- ============================================================================
-- PRUEBA DE INSERCIÓN
-- ============================================================================
-- Descomentar para probar (esto NO insertará, solo muestra cómo funcionaría):
/*
-- Prueba 1: Insertar character sin slug
INSERT INTO app.characters (name, name_romaji) 
VALUES ('Sasuke Uchiha', 'Sasuke Uchiha');
-- Resultado esperado: slug = 'sasuke-uchiha'

-- Prueba 2: Insertar otro Sasuke (duplicado)
INSERT INTO app.characters (name, name_romaji) 
VALUES ('Sasuke Uchiha', 'Sasuke Uchiha');
-- Resultado esperado: slug = 'sasuke-uchiha-1' (evita duplicados)

-- Prueba 3: Insertar con slug personalizado
INSERT INTO app.characters (name, name_romaji, slug) 
VALUES ('Naruto Uzumaki', 'Naruto Uzumaki', 'naruto-custom');
-- Resultado esperado: slug = 'naruto-custom' (respeta el slug manual)
*/

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================
COMMENT ON FUNCTION app.generate_slug_from_name(TEXT) IS 
'Genera un slug a partir de un texto: minúsculas, solo a-z 0-9, separado por guiones';

COMMENT ON FUNCTION app.generate_character_slug() IS 
'Trigger function para generar slugs automáticos en characters';

COMMENT ON FUNCTION app.generate_voice_actor_slug() IS 
'Trigger function para generar slugs automáticos en voice_actors';

COMMENT ON FUNCTION app.generate_staff_slug() IS 
'Trigger function para generar slugs automáticos en staff';
