-- ============================================
-- Script de Inicialización: Roles y Permisos
-- ============================================
-- Ejecutar después de crear el esquema base
-- ============================================

SET search_path = app, public;

-- ============================================
-- 1. ROLES BÁSICOS
-- ============================================

INSERT INTO app.roles (name, display_name, description) VALUES
('admin', 'Administrador', 'Control total del sistema. Puede gestionar usuarios, contenido y configuración.'),
('moderator', 'Moderador', 'Gestiona contenido y usuarios. Puede aprobar, editar y eliminar contribuciones.'),
('user', 'Usuario', 'Usuario regular de la plataforma con permisos básicos.')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 2. PERMISOS BÁSICOS
-- ============================================

INSERT INTO app.permissions (name, display_name, description, resource, action) VALUES
-- Media Permissions
('media.create', 'Crear Media', 'Crear nuevo contenido de anime/manga/novela', 'media', 'create'),
('media.read', 'Ver Media', 'Ver contenido de media', 'media', 'read'),
('media.update', 'Actualizar Media', 'Editar información de media existente', 'media', 'update'),
('media.delete', 'Eliminar Media', 'Eliminar media del sistema', 'media', 'delete'),
('media.approve', 'Aprobar Media', 'Aprobar contribuciones de media pendientes', 'media', 'approve'),

-- Comment Permissions
('comment.create', 'Crear Comentario', 'Publicar comentarios', 'comment', 'create'),
('comment.read', 'Ver Comentarios', 'Ver comentarios de otros usuarios', 'comment', 'read'),
('comment.update', 'Editar Comentario', 'Editar comentarios propios', 'comment', 'update'),
('comment.delete', 'Eliminar Comentario', 'Eliminar comentarios propios', 'comment', 'delete'),
('comment.moderate', 'Moderar Comentarios', 'Moderar todos los comentarios (editar/eliminar)', 'comment', 'moderate'),

-- Review Permissions
('review.create', 'Crear Reseña', 'Escribir reseñas', 'review', 'create'),
('review.read', 'Ver Reseñas', 'Ver reseñas de otros usuarios', 'review', 'read'),
('review.update', 'Editar Reseña', 'Editar reseñas propias', 'review', 'update'),
('review.delete', 'Eliminar Reseña', 'Eliminar reseñas propias', 'review', 'delete'),
('review.moderate', 'Moderar Reseñas', 'Moderar todas las reseñas', 'review', 'moderate'),

-- User Permissions
('user.read', 'Ver Usuarios', 'Ver perfiles de usuarios', 'user', 'read'),
('user.update', 'Actualizar Usuario', 'Actualizar perfil propio', 'user', 'update'),
('user.ban', 'Banear Usuarios', 'Desactivar cuentas de usuarios', 'user', 'ban'),
('user.assign_roles', 'Asignar Roles', 'Asignar y remover roles de usuarios', 'user', 'assign_roles'),

-- Report Permissions
('report.create', 'Crear Reporte', 'Reportar contenido inapropiado', 'report', 'create'),
('report.review', 'Revisar Reportes', 'Revisar y resolver reportes', 'report', 'review')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 3. ASIGNAR PERMISOS A ROLES
-- ============================================

-- ADMIN: Todos los permisos
INSERT INTO app.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM app.roles r
CROSS JOIN app.permissions p
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

-- MODERATOR: Permisos de moderación
INSERT INTO app.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM app.roles r
CROSS JOIN app.permissions p
WHERE r.name = 'moderator'
AND p.name IN (
  'media.read', 'media.approve', 'media.update',
  'comment.read', 'comment.moderate',
  'review.read', 'review.moderate',
  'user.read', 'user.ban',
  'report.review'
)
ON CONFLICT DO NOTHING;

-- USER: Permisos básicos
INSERT INTO app.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM app.roles r
CROSS JOIN app.permissions p
WHERE r.name = 'user'
AND p.name IN (
  'media.create', 'media.read',
  'comment.create', 'comment.read', 'comment.update', 'comment.delete',
  'review.create', 'review.read', 'review.update', 'review.delete',
  'user.read', 'user.update',
  'report.create'
)
ON CONFLICT DO NOTHING;

-- ============================================
-- 4. CONFIGURACIÓN DE PUNTOS
-- ============================================

INSERT INTO app.action_points (action, points, description) VALUES
('add_to_list', 2, 'Agregar contenido a una lista'),
('write_review', 15, 'Escribir una reseña'),
('comment_on_media', 5, 'Comentar en un anime/manga/novela'),
('receive_upvote', 3, 'Recibir un voto positivo'),
('receive_downvote', -2, 'Recibir un voto negativo'),
('contribute_media', 25, 'Contribuir con nuevo contenido aprobado'),
('report_resolved', 10, 'Reporte validado y resuelto')
ON CONFLICT (action) DO NOTHING;

-- ============================================
-- 5. CREAR USUARIO ADMINISTRADOR DE PRUEBA
-- ============================================

-- Password: Admin123! (hasheado con bcrypt, 10 rounds)
-- ⚠️ CAMBIAR PASSWORD EN PRODUCCIÓN ⚠️

DO $$
DECLARE
  v_user_id BIGINT;
  v_admin_role_id INTEGER;
BEGIN
  -- Insertar usuario admin
  INSERT INTO app.users (
    email, 
    password_hash, 
    username, 
    display_name,
    is_active
  ) VALUES (
    'admin@chirisu.com',
    '$2b$10$BE9S4VGt9DEpwu.pjEnTGurD30UJQuXlZpf7fbYNm/yqdzBc80S9C', -- Admin123!
    'admin',
    'Administrador',
    TRUE
  )
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO v_user_id;

  -- Si se creó el usuario, asignarle rol admin
  IF v_user_id IS NOT NULL THEN
    SELECT id INTO v_admin_role_id FROM app.roles WHERE name = 'admin';
    
    INSERT INTO app.user_roles (user_id, role_id)
    VALUES (v_user_id, v_admin_role_id)
    ON CONFLICT DO NOTHING;

    -- Crear listas por defecto
    PERFORM fn_create_default_lists(v_user_id);

    RAISE NOTICE 'Usuario admin creado exitosamente con ID: %', v_user_id;
  ELSE
    RAISE NOTICE 'Usuario admin ya existe';
  END IF;
END $$;

-- ============================================
-- 6. VERIFICACIÓN
-- ============================================

-- Ver roles creados
SELECT * FROM app.roles ORDER BY id;

-- Ver permisos por rol
SELECT 
  r.name as role,
  r.display_name,
  COUNT(rp.permission_id) as total_permissions
FROM app.roles r
LEFT JOIN app.role_permissions rp ON r.id = rp.role_id
GROUP BY r.id, r.name, r.display_name
ORDER BY r.id;

-- Ver usuario admin creado
SELECT 
  u.id,
  u.email,
  u.username,
  u.display_name,
  COALESCE(json_agg(
    json_build_object(
      'role', r.name,
      'display_name', r.display_name
    )
  ) FILTER (WHERE r.id IS NOT NULL), '[]') as roles
FROM app.users u
LEFT JOIN app.user_roles ur ON u.id = ur.user_id
LEFT JOIN app.roles r ON ur.role_id = r.id
WHERE u.email = 'admin@chirisu.com'
GROUP BY u.id;

-- ============================================
-- FIN DEL SCRIPT
-- ============================================

/*
CREDENCIALES DE PRUEBA:
Email: admin@chirisu.com
Password: Admin123!

⚠️ IMPORTANTE:
1. Cambiar el password del admin en producción
2. Este script es idempotente (puede ejecutarse múltiples veces)
3. Usa ON CONFLICT para evitar duplicados
*/
