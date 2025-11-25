-- ========================================
-- SQL QUERIES PARA TESTING DEL SISTEMA DE CONTRIBUCIÓN
-- ========================================

-- ========================================
-- 1. PREPARACIÓN: Asignar rol de moderador a un usuario
-- ========================================

-- Ver usuarios existentes
SELECT id, username, email FROM app.users;

-- Asignar rol de moderador al usuario (reemplaza [USER_ID] con el ID real)
INSERT INTO app.user_roles (user_id, role_id)
SELECT 5, id FROM app.roles WHERE name = 'moderator'
ON CONFLICT DO NOTHING;

-- Verificar que el rol fue asignado
SELECT 
  u.id,
  u.username,
  r.name as role
FROM app.users u
INNER JOIN app.user_roles ur ON u.id = ur.user_id
INNER JOIN app.roles r ON ur.role_id = r.id
WHERE u.id = 5;

-- ========================================
-- 2. VERIFICAR GÉNEROS (deben existir para el formulario)
-- ========================================

SELECT * FROM app.genres WHERE is_active = true ORDER BY name_es;

-- Si no hay géneros, ya están en el schema SQL base

-- ========================================
-- 3. MONITOREO DE CONTRIBUCIONES
-- ========================================

-- Ver todas las contribuciones
SELECT 
  uc.id,
  uc.status,
  uc.contributable_type,
  u.username,
  uc.created_at,
  (uc.contribution_data->>'title_romaji') as titulo
FROM app.user_contributions uc
INNER JOIN app.users u ON uc.user_id = u.id
ORDER BY uc.created_at DESC;

-- Ver contribuciones pendientes
SELECT 
  uc.id,
  u.username,
  (uc.contribution_data->>'title_romaji') as titulo,
  uc.created_at
FROM app.user_contributions uc
INNER JOIN app.users u ON uc.user_id = u.id
WHERE uc.status = 'pending'
ORDER BY uc.created_at DESC;

-- Ver detalle completo de una contribución
SELECT 
  uc.*,
  u.username,
  u.display_name
FROM app.user_contributions uc
INNER JOIN app.users u ON uc.user_id = u.id
WHERE uc.id = 1; -- Reemplaza con el ID de la contribución

-- ========================================
-- 4. VERIFICAR NOTIFICACIONES
-- ========================================

-- Ver todas las notificaciones
SELECT 
  n.id,
  n.action_type,
  u_recipient.username as destinatario,
  u_actor.username as actor,
  n.created_at,
  n.read_at
FROM app.notifications n
INNER JOIN app.users u_recipient ON n.recipient_user_id = u_recipient.id
LEFT JOIN app.users u_actor ON n.actor_user_id = u_actor.id
ORDER BY n.created_at DESC;

-- Notificaciones no leídas de un usuario específico
SELECT 
  n.id,
  n.action_type,
  u_actor.username as actor,
  n.created_at
FROM app.notifications n
LEFT JOIN app.users u_actor ON n.actor_user_id = u_actor.id
WHERE n.recipient_user_id = 5 -- Reemplaza con el ID del usuario
  AND n.read_at IS NULL
ORDER BY n.created_at DESC;

-- ========================================
-- 5. VERIFICAR ANIME CREADO TRAS APROBACIÓN
-- ========================================

-- Ver último anime creado
SELECT 
  a.id,
  a.title_romaji,
  a.title_english,
  a.type,
  a.episode_count,
  a.created_at,
  u.username as creado_por,
  m.username as actualizado_por
FROM app.anime a
INNER JOIN app.users u ON a.created_by = u.id
LEFT JOIN app.users m ON a.updated_by = m.id
ORDER BY a.created_at DESC
LIMIT 5;

-- Ver géneros del anime
SELECT 
  a.title_romaji,
  g.name_es as genero
FROM app.anime a
INNER JOIN app.media_genres mg ON (mg.titleable_type = 'anime' AND mg.titleable_id = a.id)
INNER JOIN app.genres g ON mg.genre_id = g.id
WHERE a.id = 1; -- Reemplaza con el ID del anime

-- Ver estudios del anime
SELECT 
  a.title_romaji,
  s.name as estudio,
  ss.is_main_studio
FROM app.anime a
INNER JOIN app.studiable_studios ss ON (ss.studiable_type = 'anime' AND ss.studiable_id = a.id)
INNER JOIN app.studios s ON ss.studio_id = s.id
WHERE a.id = 1; -- Reemplaza con el ID del anime

-- Ver staff del anime
SELECT 
  a.title_romaji,
  st.name_romaji as staff,
  sts.role
FROM app.anime a
INNER JOIN app.staffable_staff sts ON (sts.staffable_type = 'anime' AND sts.staffable_id = a.id)
INNER JOIN app.staff st ON sts.staff_id = st.id
WHERE a.id = 1; -- Reemplaza con el ID del anime

-- Ver personajes del anime
SELECT 
  a.title_romaji,
  c.name as personaje,
  cc.role
FROM app.anime a
INNER JOIN app.characterable_characters cc ON (cc.characterable_type = 'anime' AND cc.characterable_id = a.id)
INNER JOIN app.characters c ON cc.character_id = c.id
WHERE a.id = 1; -- Reemplaza con el ID del anime

-- ========================================
-- 6. VERIFICAR PUNTOS Y CONTRIBUCIONES DEL USUARIO
-- ========================================

SELECT 
  id,
  username,
  points,
  level,
  contributions_count,
  reputation_score
FROM app.users
WHERE id = 5; -- Reemplaza con el ID del usuario

-- Ver historial de puntos en audit_log
SELECT 
  al.*,
  u.username
FROM app.audit_log al
LEFT JOIN app.users u ON al.user_id = u.id
WHERE al.action = 'approve_contribution'
ORDER BY al.created_at DESC;

-- ========================================
-- 7. LIMPIAR DATOS DE PRUEBA (CUIDADO!)
-- ========================================

-- SOLO USAR EN DEVELOPMENT!
-- Elimina contribuciones de prueba
-- DELETE FROM app.user_contributions WHERE id IN (1, 2, 3);

-- Elimina animes de prueba (ajusta los IDs)
-- DELETE FROM app.anime WHERE id IN (1, 2, 3);

-- Elimina notificaciones de prueba
-- DELETE FROM app.notifications WHERE created_at > '2025-01-01';

-- ========================================
-- 8. ESTADÍSTICAS ÚTILES
-- ========================================

-- Contar contribuciones por estado
SELECT 
  status,
  COUNT(*) as total
FROM app.user_contributions
GROUP BY status;

-- Top usuarios por contribuciones aprobadas
SELECT 
  u.username,
  u.contributions_count,
  u.points,
  u.level
FROM app.users u
WHERE u.contributions_count > 0
ORDER BY u.contributions_count DESC
LIMIT 10;

-- Animes creados por contribuciones en los últimos 30 días
SELECT 
  a.title_romaji,
  u.username as contribuido_por,
  a.created_at
FROM app.anime a
INNER JOIN app.users u ON a.created_by = u.id
WHERE a.created_at > NOW() - INTERVAL '30 days'
ORDER BY a.created_at DESC;

-- ========================================
-- 9. DEBUGGING: Ver datos JSON de contribución
-- ========================================

-- Ver el JSON completo de contribution_data
SELECT 
  id,
  (contribution_data::jsonb) as datos_completos
FROM app.user_contributions
WHERE id = 1; -- Reemplaza con el ID de la contribución

-- Extraer campos específicos del JSON
SELECT 
  id,
  (contribution_data->>'title_romaji') as titulo,
  (contribution_data->>'type') as tipo,
  (contribution_data->>'episode_count') as episodios,
  (contribution_data->>'synopsis') as sinopsis
FROM app.user_contributions
WHERE id = 1;

-- Ver arrays en el JSON (géneros, estudios, etc.)
SELECT 
  id,
  jsonb_array_length(contribution_data->'genre_ids') as cantidad_generos,
  jsonb_array_length(contribution_data->'studios') as cantidad_estudios,
  jsonb_array_length(contribution_data->'staff') as cantidad_staff,
  jsonb_array_length(contribution_data->'characters') as cantidad_personajes
FROM app.user_contributions
WHERE id = 1;
