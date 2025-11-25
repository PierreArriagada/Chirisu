-- ============================================
-- TRIGGERS DE NOTIFICACIÓN PARA REPORTES
-- ============================================
-- Crea triggers para notificar a admins/moderadores cuando
-- se crean nuevos reportes de comentarios, reviews y usuarios

-- ============================================
-- FUNCIÓN: Notificar nuevo reporte de comentario
-- ============================================
CREATE OR REPLACE FUNCTION app.fn_notify_new_comment_report()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  admin_mod_record RECORD;
  notification_count INTEGER := 0;
BEGIN
  -- Solo notificar si el status es 'pending'
  IF NEW.status = 'pending' THEN
    -- Buscar todos los usuarios con rol 'admin' o 'moderator'
    FOR admin_mod_record IN
      SELECT DISTINCT u.id
      FROM app.users u
      INNER JOIN app.user_roles ur ON ur.user_id = u.id
      INNER JOIN app.roles r ON ur.role_id = r.id
      WHERE r.name IN ('admin', 'moderator')
        AND u.is_active = TRUE
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
        admin_mod_record.id,
        NEW.reporter_user_id,
        'comment_reported',
        'comment_report',
        NEW.id,
        NOW()
      );
      
      notification_count := notification_count + 1;
    END LOOP;
    
    RAISE NOTICE '✅ Se crearon % notificaciones para admins/moderadores sobre reporte de comentario #%', 
      notification_count, NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para comment_reports
DROP TRIGGER IF EXISTS trg_notify_new_comment_report ON app.comment_reports;
CREATE TRIGGER trg_notify_new_comment_report
  AFTER INSERT ON app.comment_reports
  FOR EACH ROW
  EXECUTE FUNCTION app.fn_notify_new_comment_report();

-- ============================================
-- FUNCIÓN: Notificar nuevo reporte de review
-- ============================================
CREATE OR REPLACE FUNCTION app.fn_notify_new_review_report()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  admin_mod_record RECORD;
  notification_count INTEGER := 0;
BEGIN
  -- Solo notificar si el status es 'pending'
  IF NEW.status = 'pending' THEN
    -- Buscar todos los usuarios con rol 'admin' o 'moderator'
    FOR admin_mod_record IN
      SELECT DISTINCT u.id
      FROM app.users u
      INNER JOIN app.user_roles ur ON ur.user_id = u.id
      INNER JOIN app.roles r ON ur.role_id = r.id
      WHERE r.name IN ('admin', 'moderator')
        AND u.is_active = TRUE
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
        admin_mod_record.id,
        NEW.reporter_user_id,
        'review_reported',
        'review_report',
        NEW.id,
        NOW()
      );
      
      notification_count := notification_count + 1;
    END LOOP;
    
    RAISE NOTICE '✅ Se crearon % notificaciones para admins/moderadores sobre reporte de review #%', 
      notification_count, NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para review_reports
DROP TRIGGER IF EXISTS trg_notify_new_review_report ON app.review_reports;
CREATE TRIGGER trg_notify_new_review_report
  AFTER INSERT ON app.review_reports
  FOR EACH ROW
  EXECUTE FUNCTION app.fn_notify_new_review_report();

-- ============================================
-- FUNCIÓN: Notificar nuevo reporte de usuario
-- ============================================
CREATE OR REPLACE FUNCTION app.fn_notify_new_user_report()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  admin_mod_record RECORD;
  notification_count INTEGER := 0;
BEGIN
  -- Solo notificar si el status es 'pending'
  IF NEW.status = 'pending' THEN
    -- Buscar todos los usuarios con rol 'admin' o 'moderator'
    FOR admin_mod_record IN
      SELECT DISTINCT u.id
      FROM app.users u
      INNER JOIN app.user_roles ur ON ur.user_id = u.id
      INNER JOIN app.roles r ON ur.role_id = r.id
      WHERE r.name IN ('admin', 'moderator')
        AND u.is_active = TRUE
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
        admin_mod_record.id,
        NEW.reporter_user_id,
        'user_reported',
        'user_report',
        NEW.id,
        NOW()
      );
      
      notification_count := notification_count + 1;
    END LOOP;
    
    RAISE NOTICE '✅ Se crearon % notificaciones para admins/moderadores sobre reporte de usuario #%', 
      notification_count, NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para user_reports
DROP TRIGGER IF EXISTS trg_notify_new_user_report ON app.user_reports;
CREATE TRIGGER trg_notify_new_user_report
  AFTER INSERT ON app.user_reports
  FOR EACH ROW
  EXECUTE FUNCTION app.fn_notify_new_user_report();

-- ============================================
-- ACTUALIZAR trigger de content_reports para usar action_type correcto
-- ============================================
CREATE OR REPLACE FUNCTION app.fn_notify_new_report()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  admin_mod_record RECORD;
  notification_count INTEGER := 0;
BEGIN
  -- Solo notificar si el status es 'pending'
  IF NEW.status = 'pending' THEN
    -- Buscar todos los usuarios con rol 'admin' o 'moderator'
    FOR admin_mod_record IN
      SELECT DISTINCT u.id
      FROM app.users u
      INNER JOIN app.user_roles ur ON ur.user_id = u.id
      INNER JOIN app.roles r ON ur.role_id = r.id
      WHERE r.name IN ('admin', 'moderator')
        AND u.is_active = TRUE
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
        admin_mod_record.id,
        NEW.reported_by,
        'content_report',  -- Cambiado de 'report_pending' a 'content_report'
        'content_report',  -- Cambiado de 'report' a 'content_report'
        NEW.id,
        NOW()
      );
      
      notification_count := notification_count + 1;
    END LOOP;
    
    RAISE NOTICE '✅ Se crearon % notificaciones para admins/moderadores sobre reporte de contenido #%', 
      notification_count, NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Ejecutar esta query para verificar que los triggers fueron creados:
/*
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'app' 
  AND event_object_table IN ('content_reports', 'comment_reports', 'review_reports', 'user_reports')
  AND trigger_name LIKE '%notify%'
ORDER BY event_object_table, trigger_name;
*/
