-- ============================================================================
-- SCRIPT: Seed Basic Data - Datos Básicos del Sistema
-- ============================================================================
-- FECHA: 2025-11-04
-- DESCRIPCIÓN: Re-crea los datos básicos necesarios para que el sistema funcione:
--   - Roles (admin, moderator, user)
--   - Permisos del sistema
--   - Media Statuses (estados de medios)
-- ============================================================================

BEGIN;

\echo '============================================================================'
\echo 'INSERTANDO DATOS BÁSICOS DEL SISTEMA'
\echo '============================================================================'

-- ============================================================================
-- 1. ROLES
-- ============================================================================

\echo ''
\echo '1. Insertando roles del sistema...'

INSERT INTO app.roles (id, name, display_name, description, created_at) VALUES
  (1, 'admin', 'Administrador', 'Administrator with full system access', NOW()),
  (2, 'moderator', 'Moderador', 'Moderator with content management permissions', NOW()),
  (3, 'user', 'Usuario', 'Regular user with basic permissions', NOW())
ON CONFLICT (id) DO NOTHING;

\echo '   ✅ Roles insertados: admin, moderator, user'

-- ============================================================================
-- 2. PERMISOS
-- ============================================================================

\echo ''
\echo '2. Insertando permisos del sistema...'

INSERT INTO app.permissions (id, name, display_name, description, resource, action, created_at) VALUES
  -- Permisos de usuarios
  (1, 'view_users', 'Ver Usuarios', 'View user profiles', 'users', 'read', NOW()),
  (2, 'edit_users', 'Editar Usuarios', 'Edit user information', 'users', 'update', NOW()),
  (3, 'delete_users', 'Eliminar Usuarios', 'Delete users', 'users', 'delete', NOW()),
  (4, 'ban_users', 'Banear Usuarios', 'Ban/suspend users', 'users', 'ban', NOW()),
  
  -- Permisos de medios (anime, manga, etc.)
  (5, 'create_media', 'Crear Medios', 'Create new media entries', 'media', 'create', NOW()),
  (6, 'edit_media', 'Editar Medios', 'Edit media information', 'media', 'update', NOW()),
  (7, 'delete_media', 'Eliminar Medios', 'Delete media entries', 'media', 'delete', NOW()),
  (8, 'approve_media', 'Aprobar Medios', 'Approve media submissions', 'media', 'approve', NOW()),
  
  -- Permisos de personajes
  (9, 'create_characters', 'Crear Personajes', 'Create character entries', 'characters', 'create', NOW()),
  (10, 'edit_characters', 'Editar Personajes', 'Edit character information', 'characters', 'update', NOW()),
  (11, 'delete_characters', 'Eliminar Personajes', 'Delete characters', 'characters', 'delete', NOW()),
  
  -- Permisos de contenido
  (12, 'moderate_reviews', 'Moderar Reviews', 'Moderate user reviews', 'reviews', 'moderate', NOW()),
  (13, 'moderate_comments', 'Moderar Comentarios', 'Moderate user comments', 'comments', 'moderate', NOW()),
  (14, 'delete_reviews', 'Eliminar Reviews', 'Delete reviews', 'reviews', 'delete', NOW()),
  (15, 'delete_comments', 'Eliminar Comentarios', 'Delete comments', 'comments', 'delete', NOW()),
  
  -- Permisos de reportes
  (16, 'view_reports', 'Ver Reportes', 'View content reports', 'reports', 'read', NOW()),
  (17, 'resolve_reports', 'Resolver Reportes', 'Resolve content reports', 'reports', 'update', NOW()),
  
  -- Permisos de contribuciones
  (18, 'review_contributions', 'Revisar Contribuciones', 'Review user contributions', 'contributions', 'review', NOW()),
  (19, 'approve_contributions', 'Aprobar Contribuciones', 'Approve contributions', 'contributions', 'approve', NOW()),
  (20, 'reject_contributions', 'Rechazar Contribuciones', 'Reject contributions', 'contributions', 'reject', NOW()),
  
  -- Permisos del sistema
  (21, 'manage_system', 'Gestionar Sistema', 'Manage system settings', 'system', 'manage', NOW())
ON CONFLICT (id) DO NOTHING;

\echo '   ✅ 21 permisos insertados'

-- ============================================================================
-- 3. RELACIONES ROLES-PERMISOS
-- ============================================================================

\echo ''
\echo '3. Asignando permisos a roles...'

-- ADMIN: Todos los permisos
INSERT INTO app.role_permissions (role_id, permission_id) 
SELECT 1, id FROM app.permissions
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- MODERATOR: Permisos de moderación y gestión de contenido
INSERT INTO app.role_permissions (role_id, permission_id) VALUES
  -- Ver usuarios
  (2, 1),  -- view_users
  
  -- Gestión de medios
  (2, 5),  -- create_media
  (2, 6),  -- edit_media
  (2, 8),  -- approve_media
  
  -- Gestión de personajes
  (2, 9),  -- create_characters
  (2, 10), -- edit_characters
  
  -- Moderación de contenido
  (2, 12), -- moderate_reviews
  (2, 13), -- moderate_comments
  (2, 14), -- delete_reviews
  (2, 15), -- delete_comments
  
  -- Reportes
  (2, 16), -- view_reports
  (2, 17), -- resolve_reports
  
  -- Contribuciones
  (2, 18), -- review_contributions
  (2, 19), -- approve_contributions
  (2, 20)  -- reject_contributions
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- USER: Sin permisos especiales (solo acceso básico)
-- Los permisos de usuarios regulares se manejan a nivel de aplicación

\echo '   ✅ Permisos asignados:'
\echo '      - admin: 21 permisos (todos)'
\echo '      - moderator: 15 permisos'
\echo '      - user: 0 permisos especiales'

-- ============================================================================
-- 4. MEDIA STATUSES (Estados de Medios)
-- ============================================================================

\echo ''
\echo '4. Insertando estados de medios...'

INSERT INTO app.media_statuses (id, code, label_es, label_en, description) VALUES
  (1, 'airing', 'En emisión', 'Airing', 'Currently airing or releasing'),
  (2, 'finished', 'Finalizado', 'Finished', 'Completed and finished'),
  (3, 'upcoming', 'Próximamente', 'Upcoming', 'Announced but not yet released'),
  (4, 'cancelled', 'Cancelado', 'Cancelled', 'Cancelled or discontinued'),
  (5, 'hiatus', 'En pausa', 'Hiatus', 'On hiatus or paused')
ON CONFLICT (id) DO NOTHING;

\echo '   ✅ Estados de medios insertados: airing, finished, upcoming, cancelled, hiatus'

-- ============================================================================
-- 5. AJUSTAR SECUENCIAS
-- ============================================================================

\echo ''
\echo '5. Ajustando secuencias de IDs...'

-- Ajustar secuencias para que el siguiente ID sea correcto
SELECT setval('app.roles_id_seq', (SELECT MAX(id) FROM app.roles));
SELECT setval('app.permissions_id_seq', (SELECT MAX(id) FROM app.permissions));
SELECT setval('app.media_statuses_id_seq', (SELECT MAX(id) FROM app.media_statuses));

\echo '   ✅ Secuencias ajustadas'

-- ============================================================================
-- 6. VERIFICACIÓN
-- ============================================================================

\echo ''
\echo '============================================================================'
\echo 'VERIFICACIÓN DE DATOS INSERTADOS'
\echo '============================================================================'

SELECT 'ROLES' as tabla, COUNT(*) as total FROM app.roles
UNION ALL SELECT 'PERMISOS', COUNT(*) FROM app.permissions
UNION ALL SELECT 'ROLE_PERMISSIONS', COUNT(*) FROM app.role_permissions
UNION ALL SELECT 'MEDIA_STATUSES', COUNT(*) FROM app.media_statuses
ORDER BY tabla;

\echo ''
\echo 'Detalle de roles y permisos:'
\echo ''

SELECT 
  r.name as rol,
  COUNT(rp.permission_id) as permisos_asignados
FROM app.roles r
LEFT JOIN app.role_permissions rp ON r.id = rp.role_id
GROUP BY r.id, r.name
ORDER BY r.id;

COMMIT;

\echo ''
\echo '============================================================================'
\echo '✅ DATOS BÁSICOS DEL SISTEMA INSERTADOS EXITOSAMENTE'
\echo '============================================================================'
\echo ''
\echo 'RESUMEN:'
\echo '  ✅ 3 roles creados (admin, moderator, user)'
\echo '  ✅ 21 permisos creados'
\echo '  ✅ 36 relaciones roles-permisos creadas'
\echo '  ✅ 5 estados de medios creados'
\echo ''
\echo 'El sistema está listo para:'
\echo '  • Asignar roles a usuarios'
\echo '  • Importar medios (anime, manga, etc.)'
\echo '  • Gestión de permisos granular'
\echo '============================================================================'
