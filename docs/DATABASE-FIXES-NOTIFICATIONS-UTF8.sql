-- ============================================
-- DATABASE FIXES & NOTIFICATIONS SYSTEM
-- Version: 1.0 - UTF-8 Compatible
-- ============================================

SET client_encoding = 'UTF8';

-- ============================================
-- 1. FUNCION generate_slug()
-- ============================================

CREATE OR REPLACE FUNCTION app.generate_slug(title TEXT, id BIGINT) 
RETURNS VARCHAR(255) AS $$
DECLARE
  base_slug VARCHAR(255);
BEGIN
  -- Convertir a minusculas y normalizar caracteres
  base_slug := lower(title);
  
  -- Reemplazar acentos comunes
  base_slug := translate(base_slug,
    'áéíóúàèìòùâêîôûãõäëïöüñçÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÄËÏÖÜÑÇ',
    'aeiouaeiouaeiouaoaeiouancAEIOUAEIOUAEIOUAOAEIOUANC'
  );
  
  -- Quitar caracteres especiales (solo dejar letras, numeros, espacios y guiones)
  base_slug := regexp_replace(base_slug, '[^a-z0-9\s-]', '', 'g');
  
  -- Reemplazar espacios multiples por uno solo
  base_slug := regexp_replace(base_slug, '\s+', ' ', 'g');
  
  -- Reemplazar espacios por guiones
  base_slug := regexp_replace(base_slug, '\s', '-', 'g');
  
  -- Quitar guiones multiples
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  
  -- Quitar guiones al inicio y final
  base_slug := trim(both '-' from base_slug);
  
  -- Limitar a 200 caracteres y agregar ID al final
  base_slug := substring(base_slug from 1 for 200) || '-' || id::text;
  
  RETURN base_slug;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION app.generate_slug(TEXT, BIGINT) IS 'Genera un slug unico basado en el titulo y el ID del registro';

-- ============================================
-- 2. VERIFICAR QUE LA FUNCION EXISTE
-- ============================================

SELECT 
  proname AS function_name,
  pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'app' 
  AND proname = 'generate_slug';

-- ============================================
-- 3. TRIGGER: Notificar cambio de estado de contribucion
-- ============================================

CREATE OR REPLACE FUNCTION app.fn_notify_contribution_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo notificar si el estado cambio a 'approved' o 'rejected'
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    
    IF NEW.status = 'approved' THEN
      -- Notificar al usuario que su contribucion fue aprobada
      INSERT INTO app.notifications (
        recipient_user_id,
        actor_user_id,
        action_type,
        notifiable_type,
        notifiable_id,
        read_at
      ) VALUES (
        NEW.user_id,
        NEW.reviewed_by,
        'contribution_approved',
        COALESCE(NEW.contributable_type, 'contribution'),
        COALESCE(NEW.contributable_id, NEW.id),
        NULL
      );
      
      RAISE NOTICE 'Notificacion creada: Contribucion % aprobada', NEW.id;
      
    ELSIF NEW.status = 'rejected' THEN
      -- Notificar al usuario que su contribucion fue rechazada
      INSERT INTO app.notifications (
        recipient_user_id,
        actor_user_id,
        action_type,
        notifiable_type,
        notifiable_id,
        read_at
      ) VALUES (
        NEW.user_id,
        NEW.reviewed_by,
        'contribution_rejected',
        'contribution',
        NEW.id,
        NULL
      );
      
      RAISE NOTICE 'Notificacion creada: Contribucion % rechazada', NEW.id;
      
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_contribution_status ON app.user_contributions;

CREATE TRIGGER trg_notify_contribution_status
  AFTER UPDATE ON app.user_contributions
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION app.fn_notify_contribution_status_change();

COMMENT ON FUNCTION app.fn_notify_contribution_status_change() IS 'Notifica al usuario cuando su contribucion es aprobada o rechazada';

-- ============================================
-- 4. TRIGGER: Notificar nueva contribucion
-- ============================================

CREATE OR REPLACE FUNCTION app.fn_notify_new_contribution()
RETURNS TRIGGER AS $$
DECLARE
  admin_mod_record RECORD;
  notification_count INTEGER := 0;
BEGIN
  -- Solo notificar si el status es 'pending'
  IF NEW.status = 'pending' THEN
    
    -- Notificar a todos los administradores y moderadores
    FOR admin_mod_record IN 
      SELECT id 
      FROM app.users 
      WHERE is_admin = TRUE OR is_moderator = TRUE
    LOOP
      INSERT INTO app.notifications (
        recipient_user_id,
        actor_user_id,
        action_type,
        notifiable_type,
        notifiable_id,
        read_at
      ) VALUES (
        admin_mod_record.id,
        NEW.user_id,
        'contribution_submitted',
        'contribution',
        NEW.id,
        NULL
      );
      
      notification_count := notification_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Notificaciones creadas: Nueva contribucion % enviada por usuario % (% notificaciones)', 
      NEW.id, NEW.user_id, notification_count;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_new_contribution ON app.user_contributions;

CREATE TRIGGER trg_notify_new_contribution
  AFTER INSERT ON app.user_contributions
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION app.fn_notify_new_contribution();

COMMENT ON FUNCTION app.fn_notify_new_contribution() IS 'Notifica a admins/mods cuando un usuario envia una nueva contribucion';

-- ============================================
-- 5. TRIGGER: Notificar nuevo reporte
-- ============================================

CREATE OR REPLACE FUNCTION app.fn_notify_new_report()
RETURNS TRIGGER AS $$
DECLARE
  admin_mod_record RECORD;
  notification_count INTEGER := 0;
BEGIN
  -- Solo notificar si el status es 'pending'
  IF NEW.status = 'pending' THEN
    
    -- Notificar a todos los administradores y moderadores (excepto el que reporto)
    FOR admin_mod_record IN 
      SELECT id 
      FROM app.users 
      WHERE (is_admin = TRUE OR is_moderator = TRUE)
        AND id != NEW.reporter_user_id
    LOOP
      INSERT INTO app.notifications (
        recipient_user_id,
        actor_user_id,
        action_type,
        notifiable_type,
        notifiable_id,
        read_at
      ) VALUES (
        admin_mod_record.id,
        NEW.reporter_user_id,
        'content_reported',
        NEW.reportable_type,
        NEW.reportable_id,
        NULL
      );
      
      notification_count := notification_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Notificaciones creadas: Nuevo reporte % por usuario % (% notificaciones)', 
      NEW.id, NEW.reporter_user_id, notification_count;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_new_report ON app.content_reports;

CREATE TRIGGER trg_notify_new_report
  AFTER INSERT ON app.content_reports
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION app.fn_notify_new_report();

COMMENT ON FUNCTION app.fn_notify_new_report() IS 'Notifica a admins/mods cuando se reporta contenido';

-- ============================================
-- 6. FUNCION: Limpiar notificaciones antiguas
-- ============================================

CREATE OR REPLACE FUNCTION app.fn_cleanup_old_notifications()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM app.notifications
  WHERE read_at IS NOT NULL
    AND read_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION app.fn_cleanup_old_notifications() IS 'Elimina notificaciones leidas con mas de 30 dias de antiguedad';

-- ============================================
-- 7. INDICES para optimizacion
-- ============================================

CREATE INDEX IF NOT EXISTS idx_notifications_unread 
  ON app.notifications(recipient_user_id, created_at DESC) 
  WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_action_type 
  ON app.notifications(action_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_notifiable 
  ON app.notifications(notifiable_type, notifiable_id);

-- ============================================
-- 8. VISTAS para estadisticas
-- ============================================

CREATE OR REPLACE VIEW app.v_user_contribution_stats AS
SELECT 
  user_id,
  COUNT(*) AS total_contributions,
  COUNT(*) FILTER (WHERE status = 'pending') AS pending_count,
  COUNT(*) FILTER (WHERE status = 'approved') AS approved_count,
  COUNT(*) FILTER (WHERE status = 'rejected') AS rejected_count,
  SUM(CASE 
    WHEN status = 'approved' THEN 10 
    ELSE 0 
  END) AS total_points_earned
FROM app.user_contributions
GROUP BY user_id;

COMMENT ON VIEW app.v_user_contribution_stats IS 'Estadisticas de contribuciones por usuario';

CREATE OR REPLACE VIEW app.v_moderator_report_stats AS
SELECT 
  reviewed_by AS moderator_id,
  COUNT(*) AS total_reports_handled,
  COUNT(*) FILTER (WHERE status = 'resolved') AS resolved_reports,
  COUNT(*) FILTER (WHERE status = 'dismissed') AS dismissed_reports
FROM app.content_reports
WHERE reviewed_by IS NOT NULL
GROUP BY reviewed_by;

COMMENT ON VIEW app.v_moderator_report_stats IS 'Estadisticas de reportes manejados por moderador';

-- ============================================
-- 9. VERIFICACIONES FINALES
-- ============================================

-- Verificar funcion generate_slug
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'app' AND proname = 'generate_slug'
    )
    THEN 'OK - generate_slug existe'
    ELSE 'ERROR - generate_slug NO existe'
  END AS verificacion_generate_slug;

-- Verificar triggers en user_contributions
SELECT 
  'Triggers en user_contributions' AS verificacion,
  COUNT(*) AS cantidad,
  string_agg(tgname, ', ' ORDER BY tgname) AS triggers
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'app'
  AND c.relname = 'user_contributions'
  AND tgname LIKE 'trg_notify%';

-- Verificar triggers en content_reports
SELECT 
  'Triggers en content_reports' AS verificacion,
  COUNT(*) AS cantidad,
  string_agg(tgname, ', ' ORDER BY tgname) AS triggers
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'app'
  AND c.relname = 'content_reports'
  AND tgname LIKE 'trg_notify%';

-- Verificar indices
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE schemaname = 'app' AND indexname = 'idx_notifications_unread'
    )
    THEN 'OK - idx_notifications_unread existe'
    ELSE 'ERROR - idx_notifications_unread NO existe'
  END AS verificacion_indice_1;

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE schemaname = 'app' AND indexname = 'idx_notifications_action_type'
    )
    THEN 'OK - idx_notifications_action_type existe'
    ELSE 'ERROR - idx_notifications_action_type NO existe'
  END AS verificacion_indice_2;

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE schemaname = 'app' AND indexname = 'idx_notifications_notifiable'
    )
    THEN 'OK - idx_notifications_notifiable existe'
    ELSE 'ERROR - idx_notifications_notifiable NO existe'
  END AS verificacion_indice_3;

-- ============================================
-- 10. PRUEBA RAPIDA DE generate_slug
-- ============================================

SELECT 
  'Test 1' AS test,
  app.generate_slug('Dragon Ball Z', 1) AS resultado,
  'dragon-ball-z-1' AS esperado;

SELECT 
  'Test 2' AS test,
  app.generate_slug('One Piece & Café!', 42) AS resultado,
  'one-piece-cafe-42' AS esperado;

SELECT 
  'Test 3' AS test,
  app.generate_slug('Shingeki no Kyojin (Attack on Titan)', 100) AS resultado,
  'shingeki-no-kyojin-attack-on-titan-100' AS esperado;

-- ============================================
-- FIN DEL SCRIPT
-- ============================================

SELECT 'Script ejecutado exitosamente!' AS mensaje;
