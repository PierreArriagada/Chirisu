-- ============================================
-- SCRIPT: Agregar función generate_slug y corregir triggers
-- ============================================
-- Asegúrate de estar conectado al schema correcto (app)
SET search_path = app, public;

-- ============================================
-- 1. CREAR/REEMPLAZAR FUNCIÓN generate_slug
-- ============================================

CREATE OR REPLACE FUNCTION app.generate_slug(title TEXT, id BIGINT) 
RETURNS VARCHAR(255) AS $$
DECLARE
  base_slug VARCHAR(255);
BEGIN
  -- Convertir a minusculas, quitar acentos, reemplazar espacios por guiones
  base_slug := lower(
    regexp_replace(
      regexp_replace(
        translate(
          title,
          'aeiounaeiounAEIOUNAEIOUN',
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

COMMENT ON FUNCTION app.generate_slug(TEXT, BIGINT) IS 'Genera un slug único basado en el título y el ID del registro';

-- ============================================
-- 2. VERIFICAR QUE LA FUNCIÓN EXISTE
-- ============================================

SELECT 
  proname AS function_name,
  pg_get_functiondef(oid) AS definition
FROM pg_proc
WHERE proname = 'generate_slug'
  AND pronamespace = 'app'::regnamespace;

-- ============================================
-- 3. MEJORAR TRIGGERS DE NOTIFICACIONES
-- ============================================

-- Trigger: Notificar cuando cambia el estado de una contribución
CREATE OR REPLACE FUNCTION app.fn_notify_contribution_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo notificar si el estado cambió
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    
    -- Si fue aprobada
    IF NEW.status = 'approved' THEN
      INSERT INTO app.notifications (
        recipient_user_id,
        actor_user_id,
        action_type,
        notifiable_type,
        notifiable_id,
        created_at
      ) VALUES (
        NEW.user_id,
        NEW.reviewed_by,
        'contribution_approved',
        NEW.contributable_type,
        COALESCE(NEW.contributable_id, NEW.id),
        NOW()
      );
      
      -- Log para debugging
      RAISE NOTICE 'Notificación creada: Contribución % aprobada para usuario %', NEW.id, NEW.user_id;
    
    -- Si fue rechazada
    ELSIF NEW.status = 'rejected' THEN
      INSERT INTO app.notifications (
        recipient_user_id,
        actor_user_id,
        action_type,
        notifiable_type,
        notifiable_id,
        created_at
      ) VALUES (
        NEW.user_id,
        NEW.reviewed_by,
        'contribution_rejected',
        'contribution',
        NEW.id,
        NOW()
      );
      
      -- Log para debugging
      RAISE NOTICE 'Notificación creada: Contribución % rechazada para usuario %', NEW.id, NEW.user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar trigger anterior si existe y crear nuevo
DROP TRIGGER IF EXISTS trg_notify_contribution_status ON app.user_contributions;

CREATE TRIGGER trg_notify_contribution_status
  AFTER UPDATE ON app.user_contributions
  FOR EACH ROW
  EXECUTE FUNCTION app.fn_notify_contribution_status_change();

COMMENT ON TRIGGER trg_notify_contribution_status ON app.user_contributions 
IS 'Notifica automáticamente al usuario cuando su contribución es aprobada o rechazada';

-- ============================================
-- 4. TRIGGER: Notificar a admins/mods cuando se crea una contribución
-- ============================================

CREATE OR REPLACE FUNCTION app.fn_notify_new_contribution()
RETURNS TRIGGER AS $$
DECLARE
  admin_mod_user RECORD;
BEGIN
  -- Solo notificar en INSERT de nuevas contribuciones
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    
    -- Obtener todos los usuarios con rol admin o moderator
    FOR admin_mod_user IN
      SELECT DISTINCT u.id
      FROM app.users u
      INNER JOIN app.user_roles ur ON u.id = ur.user_id
      INNER JOIN app.roles r ON ur.role_id = r.id
      WHERE r.name IN ('admin', 'moderator')
        AND u.is_active = true
        AND u.deleted_at IS NULL
    LOOP
      -- Crear notificación para cada admin/mod
      INSERT INTO app.notifications (
        recipient_user_id,
        actor_user_id,
        action_type,
        notifiable_type,
        notifiable_id,
        created_at
      ) VALUES (
        admin_mod_user.id,
        NEW.user_id,
        'contribution_submitted',
        'contribution',
        NEW.id,
        NOW()
      );
    END LOOP;
    
    -- Log para debugging
    RAISE NOTICE 'Notificaciones creadas: Nueva contribución % enviada por usuario %', NEW.id, NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar trigger anterior si existe y crear nuevo
DROP TRIGGER IF EXISTS trg_notify_new_contribution ON app.user_contributions;

CREATE TRIGGER trg_notify_new_contribution
  AFTER INSERT ON app.user_contributions
  FOR EACH ROW
  EXECUTE FUNCTION app.fn_notify_new_contribution();

COMMENT ON TRIGGER trg_notify_new_contribution ON app.user_contributions 
IS 'Notifica automáticamente a admins y moderadores cuando se envía una nueva contribución';

-- ============================================
-- 5. TRIGGER: Notificar cuando se crea un reporte
-- ============================================

CREATE OR REPLACE FUNCTION app.fn_notify_new_report()
RETURNS TRIGGER AS $$
DECLARE
  admin_mod_user RECORD;
BEGIN
  -- Solo notificar en INSERT de nuevos reportes
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    
    -- Obtener todos los usuarios con rol admin o moderator
    FOR admin_mod_user IN
      SELECT DISTINCT u.id
      FROM app.users u
      INNER JOIN app.user_roles ur ON u.id = ur.user_id
      INNER JOIN app.roles r ON ur.role_id = r.id
      WHERE r.name IN ('admin', 'moderator')
        AND u.is_active = true
        AND u.deleted_at IS NULL
        AND u.id != NEW.reported_by  -- No notificar al que reportó
    LOOP
      -- Crear notificación para cada admin/mod
      INSERT INTO app.notifications (
        recipient_user_id,
        actor_user_id,
        action_type,
        notifiable_type,
        notifiable_id,
        created_at
      ) VALUES (
        admin_mod_user.id,
        NEW.reported_by,
        'content_reported',
        NEW.reportable_type,
        NEW.reportable_id,
        NOW()
      );
    END LOOP;
    
    -- Log para debugging
    RAISE NOTICE 'Notificaciones creadas: Nuevo reporte % creado por usuario %', NEW.id, NEW.reported_by;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar trigger anterior si existe y crear nuevo
DROP TRIGGER IF EXISTS trg_notify_new_report ON app.content_reports;

CREATE TRIGGER trg_notify_new_report
  AFTER INSERT ON app.content_reports
  FOR EACH ROW
  EXECUTE FUNCTION app.fn_notify_new_report();

COMMENT ON TRIGGER trg_notify_new_report ON app.content_reports 
IS 'Notifica automáticamente a admins y moderadores cuando se crea un nuevo reporte';

-- ============================================
-- 6. FUNCIÓN AUXILIAR: Limpiar notificaciones antiguas (más de 30 días leídas)
-- ============================================

CREATE OR REPLACE FUNCTION app.fn_cleanup_old_notifications()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Eliminar notificaciones leídas con más de 30 días
  DELETE FROM app.notifications
  WHERE read_at IS NOT NULL
    AND read_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RAISE NOTICE 'Notificaciones antiguas eliminadas: %', deleted_count;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION app.fn_cleanup_old_notifications() 
IS 'Elimina notificaciones leídas con más de 30 días. Ejecutar periódicamente para mantener la tabla limpia.';

-- ============================================
-- 7. ÍNDICES PARA OPTIMIZAR CONSULTAS DE NOTIFICACIONES
-- ============================================

-- Índice para búsquedas rápidas de notificaciones no leídas
CREATE INDEX IF NOT EXISTS idx_notifications_unread 
ON app.notifications(recipient_user_id, created_at DESC) 
WHERE read_at IS NULL;

-- Índice para búsquedas por tipo de acción
CREATE INDEX IF NOT EXISTS idx_notifications_action_type 
ON app.notifications(action_type, created_at DESC);

-- Índice para búsquedas por tipo de notificación
CREATE INDEX IF NOT EXISTS idx_notifications_notifiable 
ON app.notifications(notifiable_type, notifiable_id);

-- ============================================
-- 8. VISTA: Estadísticas de contribuciones por usuario
-- ============================================

CREATE OR REPLACE VIEW app.v_user_contribution_stats AS
SELECT 
  u.id AS user_id,
  u.username,
  COUNT(*) FILTER (WHERE uc.status = 'pending') AS pending_count,
  COUNT(*) FILTER (WHERE uc.status = 'approved') AS approved_count,
  COUNT(*) FILTER (WHERE uc.status = 'rejected') AS rejected_count,
  COUNT(*) AS total_count,
  SUM(uc.awarded_points) AS total_points_earned,
  MAX(uc.created_at) AS last_contribution_at
FROM app.users u
LEFT JOIN app.user_contributions uc ON u.id = uc.user_id
GROUP BY u.id, u.username;

COMMENT ON VIEW app.v_user_contribution_stats 
IS 'Estadísticas de contribuciones por usuario (pendientes, aprobadas, rechazadas, puntos ganados)';

-- ============================================
-- 9. VISTA: Estadísticas de reportes por moderador
-- ============================================

CREATE OR REPLACE VIEW app.v_moderator_report_stats AS
SELECT 
  u.id AS moderator_id,
  u.username AS moderator_username,
  COUNT(*) FILTER (WHERE cr.status = 'pending') AS pending_reports,
  COUNT(*) FILTER (WHERE cr.status = 'in_review') AS in_review_reports,
  COUNT(*) FILTER (WHERE cr.status = 'resolved') AS resolved_reports,
  COUNT(*) FILTER (WHERE cr.status = 'dismissed') AS dismissed_reports,
  COUNT(*) AS total_reports_handled
FROM app.users u
LEFT JOIN app.content_reports cr ON u.id = cr.reviewed_by
WHERE u.id IN (
  SELECT ur.user_id 
  FROM app.user_roles ur 
  INNER JOIN app.roles r ON ur.role_id = r.id 
  WHERE r.name IN ('admin', 'moderator')
)
GROUP BY u.id, u.username;

COMMENT ON VIEW app.v_moderator_report_stats 
IS 'Estadísticas de reportes manejados por moderadores';

-- ============================================
-- 10. VERIFICACIÓN FINAL
-- ============================================

-- Verificar que la función generate_slug existe
SELECT 
  'Función generate_slug' AS verificacion,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc 
      WHERE proname = 'generate_slug' 
        AND pronamespace = 'app'::regnamespace
    ) THEN '✅ Existe'
    ELSE '❌ No existe'
  END AS estado;

-- Verificar triggers en user_contributions
SELECT 
  'Triggers en user_contributions' AS verificacion,
  COUNT(*) AS cantidad,
  STRING_AGG(tgname, ', ') AS triggers
FROM pg_trigger
WHERE tgrelid = 'app.user_contributions'::regclass
  AND tgname IN ('trg_notify_contribution_status', 'trg_notify_new_contribution');

-- Verificar triggers en content_reports
SELECT 
  'Triggers en content_reports' AS verificacion,
  COUNT(*) AS cantidad,
  STRING_AGG(tgname, ', ') AS triggers
FROM pg_trigger
WHERE tgrelid = 'app.content_reports'::regclass
  AND tgname = 'trg_notify_new_report';

-- Verificar índices en notifications
SELECT 
  'Índices en notifications' AS verificacion,
  COUNT(*) AS cantidad,
  STRING_AGG(indexname, ', ') AS indices
FROM pg_indexes
WHERE schemaname = 'app'
  AND tablename = 'notifications'
  AND indexname LIKE 'idx_notifications%';

-- ============================================
-- FIN DEL SCRIPT
-- ============================================

/*
RESUMEN DE MEJORAS:

1. ✅ Función generate_slug() creada/reparada
2. ✅ Trigger automático para notificar cambios de estado en contribuciones
3. ✅ Trigger automático para notificar nuevas contribuciones a admins/mods
4. ✅ Trigger automático para notificar nuevos reportes a admins/mods
5. ✅ Función de limpieza de notificaciones antiguas
6. ✅ Índices optimizados para consultas de notificaciones
7. ✅ Vistas de estadísticas para contribuciones y reportes

CÓMO USAR:

1. Ejecuta este script completo en PostgreSQL
2. Reinicia el servidor Next.js
3. Las notificaciones ahora se crearán automáticamente
4. Los slugs se generarán correctamente al crear anime

PARA LIMPIAR NOTIFICACIONES ANTIGUAS (ejecutar periódicamente):
SELECT app.fn_cleanup_old_notifications();

PARA VER ESTADÍSTICAS:
SELECT * FROM app.v_user_contribution_stats WHERE user_id = 3;
SELECT * FROM app.v_moderator_report_stats;
*/
