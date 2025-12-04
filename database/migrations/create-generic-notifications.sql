-- =====================================================
-- Migración: Crear tabla de notificaciones genéricas
-- 
-- Esta tabla soporta notificaciones con formato flexible
-- que incluyen título, mensaje y datos JSON.
-- Complementa la tabla notifications existente.
-- =====================================================

-- Crear tabla de notificaciones genéricas
CREATE TABLE IF NOT EXISTS app.user_notifications (
  id SERIAL PRIMARY KEY,
  
  -- Usuario destinatario
  user_id INTEGER NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
  
  -- Tipo de notificación (scan_link_request, scan_link_approved, etc.)
  type VARCHAR(50) NOT NULL,
  
  -- Contenido de la notificación
  title VARCHAR(200) NOT NULL,
  message TEXT,
  
  -- Datos adicionales en JSON
  data JSONB DEFAULT '{}',
  
  -- Estado de lectura
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_user_notifications_user ON app.user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_type ON app.user_notifications(type);
CREATE INDEX IF NOT EXISTS idx_user_notifications_unread ON app.user_notifications(user_id, created_at DESC) WHERE read_at IS NULL;

-- Comentarios de documentación
COMMENT ON TABLE app.user_notifications IS 'Notificaciones genéricas con formato flexible para usuarios';
COMMENT ON COLUMN app.user_notifications.user_id IS 'ID del usuario destinatario';
COMMENT ON COLUMN app.user_notifications.type IS 'Tipo de notificación: scan_link_request, scan_link_approved, scan_link_rejected, scan_project_abandoned';
COMMENT ON COLUMN app.user_notifications.title IS 'Título corto de la notificación';
COMMENT ON COLUMN app.user_notifications.message IS 'Mensaje detallado de la notificación';
COMMENT ON COLUMN app.user_notifications.data IS 'Datos adicionales en JSON (IDs, URLs, etc.)';
