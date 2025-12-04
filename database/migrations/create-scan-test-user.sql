-- =============================================================================
-- Script para crear usuario de prueba con rol de Scanlator
-- Ejecutar después de create-scan-requests.sql
-- =============================================================================

-- Verificar que el rol 'scan' existe (ID 4)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM app.roles WHERE name = 'scan') THEN
        INSERT INTO app.roles (id, name, description)
        VALUES (4, 'scan', 'Rol para traductores/scanlators')
        ON CONFLICT (id) DO UPDATE SET name = 'scan', description = 'Rol para traductores/scanlators';
        
        RAISE NOTICE 'Rol scan creado exitosamente';
    ELSE
        RAISE NOTICE 'Rol scan ya existe';
    END IF;
END $$;

-- =============================================================================
-- CREAR USUARIO DE PRUEBA PARA SCANLATION
-- =============================================================================
-- Email: scan@test.com
-- Username: scanlator_test
-- Password: Scan123! (hasheada con bcrypt)
-- =============================================================================

-- Insertar usuario de prueba
INSERT INTO app.users (
    email,
    password_hash,
    username,
    display_name,
    bio,
    is_active,
    created_at,
    updated_at
)
VALUES (
    'scan@test.com',
    -- Password: Scan123! (bcrypt hash generado con $2b$10 rounds)
    '$2b$10$K.0HwpsoPDGaB/atFBmmXOGTw4ceeg33.WrxJx/FeC9.gOMVry5Mu',
    'scanlator_test',
    'Scanlator de Prueba',
    'Cuenta de prueba para funcionalidades de scanlation',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Obtener el ID del usuario recién creado (o existente)
DO $$
DECLARE
    v_user_id BIGINT;
    v_admin_id BIGINT;
BEGIN
    -- Obtener ID del usuario scan de prueba
    SELECT id INTO v_user_id FROM app.users WHERE email = 'scan@test.com';
    
    IF v_user_id IS NULL THEN
        RAISE NOTICE 'El usuario scan@test.com ya existía y no fue recreado';
        -- Si ya existe, obtenerlo de todas formas
        SELECT id INTO v_user_id FROM app.users WHERE email = 'scan@test.com';
    ELSE
        RAISE NOTICE 'Usuario scan@test.com creado con ID: %', v_user_id;
    END IF;
    
    -- Obtener un admin para asignar como assigned_by (el primer admin, o el usuario 1 si no hay)
    SELECT u.id INTO v_admin_id 
    FROM app.users u
    INNER JOIN app.user_roles ur ON u.id = ur.user_id
    INNER JOIN app.roles r ON ur.role_id = r.id
    WHERE r.name = 'admin'
    LIMIT 1;
    
    IF v_admin_id IS NULL THEN
        v_admin_id := 1; -- Fallback al usuario 1
    END IF;
    
    -- Asignar rol 'user' (ID 3) - todos los usuarios lo tienen
    INSERT INTO app.user_roles (user_id, role_id, assigned_by, assigned_at)
    VALUES (v_user_id, 3, v_admin_id, NOW())
    ON CONFLICT DO NOTHING;
    
    -- Asignar rol 'scan' (ID 4)
    INSERT INTO app.user_roles (user_id, role_id, assigned_by, assigned_at)
    VALUES (v_user_id, 4, v_admin_id, NOW())
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Roles asignados al usuario scan@test.com';
    
END $$;

-- =============================================================================
-- VERIFICACIÓN
-- =============================================================================
SELECT 
    u.id,
    u.email,
    u.username,
    u.display_name,
    u.is_active,
    STRING_AGG(r.name, ', ' ORDER BY r.id) as roles
FROM app.users u
LEFT JOIN app.user_roles ur ON u.id = ur.user_id
LEFT JOIN app.roles r ON ur.role_id = r.id
WHERE u.email = 'scan@test.com'
GROUP BY u.id, u.email, u.username, u.display_name, u.is_active;

-- =============================================================================
-- INFORMACIÓN DE ACCESO
-- =============================================================================
/*
  CREDENCIALES DE USUARIO DE PRUEBA
  =================================
  Email:    scan@test.com
  Password: Scan123!
  Username: scanlator_test
  Roles:    user, scan
  
  NOTA: La contraseña está hasheada con bcrypt ($2b$10 rounds).
        Cambiar la contraseña en producción!
*/
