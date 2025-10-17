-- ============================================================================
-- SISTEMA DE LISTAS DE FAVORITOS PARA CHARACTERS, VOICE ACTORS Y STAFF
-- ============================================================================
-- Este script configura el sistema para que los usuarios puedan:
-- 1. Agregar characters, voice_actors y staff a listas de favoritos
-- 2. Crear automáticamente 3 listas predeterminadas al registrarse
-- 3. Gestionar listas personalizadas
-- ============================================================================

-- ============================================================================
-- FUNCIÓN: Crear listas de favoritos predeterminadas para nuevos usuarios
-- ============================================================================
CREATE OR REPLACE FUNCTION app.create_default_favorite_lists()
RETURNS TRIGGER AS $$
BEGIN
  -- Lista 1: Favoritos - Personajes
  INSERT INTO app.lists (user_id, name, slug, description, is_public, is_default)
  VALUES (
    NEW.id,
    'Favoritos - Personajes',
    'favoritos-personajes',
    'Mis personajes favoritos de anime, manga y novelas',
    false,
    true
  );

  -- Lista 2: Favoritos - Actores de Voz
  INSERT INTO app.lists (user_id, name, slug, description, is_public, is_default)
  VALUES (
    NEW.id,
    'Favoritos - Actores de Voz',
    'favoritos-actores',
    'Mis actores de voz favoritos',
    false,
    true
  );

  -- Lista 3: Favoritos - Staff
  INSERT INTO app.lists (user_id, name, slug, description, is_public, is_default)
  VALUES (
    NEW.id,
    'Favoritos - Staff',
    'favoritos-staff',
    'Mis creadores y staff favoritos',
    false,
    true
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: Ejecutar creación de listas al registrar nuevo usuario
-- ============================================================================
DROP TRIGGER IF EXISTS trg_create_default_lists ON app.users;

CREATE TRIGGER trg_create_default_lists
  AFTER INSERT ON app.users
  FOR EACH ROW
  EXECUTE FUNCTION app.create_default_favorite_lists();


-- ============================================================================
-- VERIFICAR: Tipos permitidos en list_items
-- ============================================================================
-- listable_type puede ser:
--   - 'anime', 'manga', 'novel' (medios)
--   - 'character' (personajes)
--   - 'voice_actor' (actores de voz)
--   - 'staff' (staff/producción)


-- ============================================================================
-- FUNCIONES AUXILIARES: Obtener lista de favoritos por tipo
-- ============================================================================

-- Obtener ID de lista de favoritos de personajes
CREATE OR REPLACE FUNCTION app.get_character_favorites_list_id(p_user_id BIGINT)
RETURNS BIGINT AS $$
DECLARE
  v_list_id BIGINT;
BEGIN
  SELECT id INTO v_list_id
  FROM app.lists
  WHERE user_id = p_user_id
    AND slug = 'favoritos-personajes'
    AND is_default = true
  LIMIT 1;
  
  RETURN v_list_id;
END;
$$ LANGUAGE plpgsql;

-- Obtener ID de lista de favoritos de voice actors
CREATE OR REPLACE FUNCTION app.get_voice_actor_favorites_list_id(p_user_id BIGINT)
RETURNS BIGINT AS $$
DECLARE
  v_list_id BIGINT;
BEGIN
  SELECT id INTO v_list_id
  FROM app.lists
  WHERE user_id = p_user_id
    AND slug = 'favoritos-actores'
    AND is_default = true
  LIMIT 1;
  
  RETURN v_list_id;
END;
$$ LANGUAGE plpgsql;

-- Obtener ID de lista de favoritos de staff
CREATE OR REPLACE FUNCTION app.get_staff_favorites_list_id(p_user_id BIGINT)
RETURNS BIGINT AS $$
DECLARE
  v_list_id BIGINT;
BEGIN
  SELECT id INTO v_list_id
  FROM app.lists
  WHERE user_id = p_user_id
    AND slug = 'favoritos-staff'
    AND is_default = true
  LIMIT 1;
  
  RETURN v_list_id;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- VERIFICAR: ¿El usuario ya tiene un item en favoritos?
-- ============================================================================
CREATE OR REPLACE FUNCTION app.is_in_favorites(
  p_user_id BIGINT,
  p_item_type VARCHAR(20),
  p_item_id BIGINT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_list_id BIGINT;
  v_exists BOOLEAN;
BEGIN
  -- Obtener la lista de favoritos según el tipo
  CASE p_item_type
    WHEN 'character' THEN
      v_list_id := app.get_character_favorites_list_id(p_user_id);
    WHEN 'voice_actor' THEN
      v_list_id := app.get_voice_actor_favorites_list_id(p_user_id);
    WHEN 'staff' THEN
      v_list_id := app.get_staff_favorites_list_id(p_user_id);
    ELSE
      RETURN false;
  END CASE;

  -- Verificar si existe el item
  SELECT EXISTS(
    SELECT 1
    FROM app.list_items
    WHERE list_id = v_list_id
      AND listable_type = p_item_type
      AND listable_id = p_item_id
  ) INTO v_exists;

  RETURN v_exists;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- CREAR LISTAS PREDETERMINADAS PARA USUARIOS EXISTENTES
-- ============================================================================
-- Solo para usuarios que NO tienen las listas de favoritos
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT id FROM app.users 
    WHERE NOT EXISTS (
      SELECT 1 FROM app.lists 
      WHERE user_id = users.id 
        AND slug IN ('favoritos-personajes', 'favoritos-actores', 'favoritos-staff')
    )
  LOOP
    -- Crear listas para este usuario
    INSERT INTO app.lists (user_id, name, slug, description, is_public, is_default)
    VALUES 
      (user_record.id, 'Favoritos - Personajes', 'favoritos-personajes', 'Mis personajes favoritos', false, true),
      (user_record.id, 'Favoritos - Actores de Voz', 'favoritos-actores', 'Mis actores de voz favoritos', false, true),
      (user_record.id, 'Favoritos - Staff', 'favoritos-staff', 'Mis creadores favoritos', false, true);
    
    RAISE NOTICE 'Listas creadas para usuario ID: %', user_record.id;
  END LOOP;
END $$;


-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
-- Ver listas de favoritos creadas
SELECT 
  u.id as user_id,
  u.username,
  l.id as list_id,
  l.name,
  l.slug,
  l.is_default
FROM app.users u
JOIN app.lists l ON l.user_id = u.id
WHERE l.is_default = true
ORDER BY u.id, l.slug;


-- ============================================================================
-- EJEMPLOS DE USO
-- ============================================================================
/*
-- Ejemplo 1: Agregar personaje a favoritos
INSERT INTO app.list_items (list_id, listable_type, listable_id)
SELECT 
  app.get_character_favorites_list_id(5), -- user_id = 5
  'character',
  1 -- character_id = 1 (Yuji Itadori)
WHERE NOT EXISTS (
  SELECT 1 FROM app.list_items
  WHERE list_id = app.get_character_favorites_list_id(5)
    AND listable_type = 'character'
    AND listable_id = 1
);

-- Ejemplo 2: Verificar si está en favoritos
SELECT app.is_in_favorites(5, 'character', 1);

-- Ejemplo 3: Ver favoritos de un usuario
SELECT 
  c.id,
  c.name,
  c.name_romaji,
  c.image_url,
  c.slug
FROM app.list_items li
JOIN app.characters c ON c.id = li.listable_id
WHERE li.list_id = app.get_character_favorites_list_id(5)
  AND li.listable_type = 'character'
ORDER BY li.created_at DESC;

-- Ejemplo 4: Eliminar de favoritos
DELETE FROM app.list_items
WHERE list_id = app.get_character_favorites_list_id(5)
  AND listable_type = 'character'
  AND listable_id = 1;
*/


-- ============================================================================
-- COMENTARIOS
-- ============================================================================
COMMENT ON FUNCTION app.create_default_favorite_lists() IS 
'Crea automáticamente 3 listas de favoritos (personajes, voice actors, staff) cuando se registra un nuevo usuario';

COMMENT ON FUNCTION app.get_character_favorites_list_id(BIGINT) IS 
'Obtiene el ID de la lista de favoritos de personajes de un usuario';

COMMENT ON FUNCTION app.get_voice_actor_favorites_list_id(BIGINT) IS 
'Obtiene el ID de la lista de favoritos de actores de voz de un usuario';

COMMENT ON FUNCTION app.get_staff_favorites_list_id(BIGINT) IS 
'Obtiene el ID de la lista de favoritos de staff de un usuario';

COMMENT ON FUNCTION app.is_in_favorites(BIGINT, VARCHAR, BIGINT) IS 
'Verifica si un item (character/voice_actor/staff) está en la lista de favoritos del usuario';


-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================
