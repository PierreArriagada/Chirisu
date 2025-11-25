/**
 * ========================================
 * FIX: NOTIFICACIONES DE APROBACIÓN/RECHAZO
 * ========================================
 * Corrige la función para que use 'user_contribution' en lugar de 'contribution'
 */

-- Eliminar función anterior
DROP FUNCTION IF EXISTS app.fn_notify_contribution_status_change() CASCADE;

-- Recrear función corregida
CREATE OR REPLACE FUNCTION app.fn_notify_contribution_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  action_type_value TEXT;
BEGIN
  -- Solo notificar si el estado cambió a 'approved' o 'rejected'
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('approved', 'rejected') THEN
    
    -- Configurar tipo de acción según el estado
    action_type_value := CASE 
      WHEN NEW.status = 'approved' THEN 'contribution_approved'
      ELSE 'contribution_rejected'
    END;
    
    -- Crear notificación para el usuario que envió la contribución
    INSERT INTO app.notifications (
      recipient_user_id,
      actor_user_id,
      action_type,
      notifiable_type,
      notifiable_id,
      created_at
    ) VALUES (
      NEW.user_id,          -- Usuario que hizo la contribución (recibe la notificación)
      NEW.reviewed_by,      -- Moderador que aprobó/rechazó
      action_type_value,    -- 'contribution_approved' o 'contribution_rejected'
      'user_contribution',  -- 🔧 CORREGIDO: era 'contribution', ahora es 'user_contribution'
      NEW.id,               -- ID de la contribución
      NOW()
    );
    
    RAISE NOTICE '✅ Notificación enviada al usuario #% sobre contribución #% (%)', 
      NEW.user_id, NEW.id, NEW.status;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recrear trigger
DROP TRIGGER IF EXISTS trg_notify_contribution_status ON app.user_contributions;

CREATE TRIGGER trg_notify_contribution_status
  AFTER UPDATE ON app.user_contributions
  FOR EACH ROW
  EXECUTE FUNCTION app.fn_notify_contribution_status_change();

-- ========================================
-- VERIFICACIÓN
-- ========================================
SELECT '✅ Función y trigger recreados correctamente' as status;

-- Verificar que existe la función
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Función fn_notify_contribution_status_change existe'
    ELSE '❌ Función NO existe'
  END as check_function
FROM pg_proc 
WHERE proname = 'fn_notify_contribution_status_change';

-- Verificar que existe el trigger
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Trigger trg_notify_contribution_status existe y está activo'
    ELSE '❌ Trigger NO existe'
  END as check_trigger
FROM pg_trigger 
WHERE tgname = 'trg_notify_contribution_status';
