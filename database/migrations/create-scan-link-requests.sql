-- =====================================================
-- Migración: Crear tabla scan_link_requests
-- 
-- Esta tabla almacena las solicitudes de usuarios que quieren
-- vincular un grupo de scanlation verificado a un media.
-- El dueño del grupo debe aprobar o rechazar la solicitud.
-- =====================================================

-- Crear tabla de solicitudes de vinculación
CREATE TABLE IF NOT EXISTS app.scan_link_requests (
  id SERIAL PRIMARY KEY,
  
  -- Grupo al que se quiere vincular
  group_id INTEGER NOT NULL REFERENCES app.scanlation_groups(id) ON DELETE CASCADE,
  
  -- Media al que se quiere vincular
  media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('anime', 'manga', 'manhwa', 'manhua', 'donghua', 'novel', 'fan_comic')),
  media_id INTEGER NOT NULL,
  
  -- URL del proyecto de traducción
  url VARCHAR(500) NOT NULL,
  language VARCHAR(10) DEFAULT 'es',
  
  -- Usuario que solicita la vinculación
  requested_by INTEGER NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
  
  -- Estado de la solicitud
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  
  -- Usuario que revisó la solicitud (owner del grupo o admin)
  reviewed_by INTEGER REFERENCES app.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Evitar solicitudes duplicadas del mismo usuario para el mismo grupo/media
  UNIQUE(group_id, media_type, media_id, requested_by)
);

-- Índices para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_scan_link_requests_group ON app.scan_link_requests(group_id);
CREATE INDEX IF NOT EXISTS idx_scan_link_requests_status ON app.scan_link_requests(status);
CREATE INDEX IF NOT EXISTS idx_scan_link_requests_requested_by ON app.scan_link_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_scan_link_requests_pending ON app.scan_link_requests(group_id, status) WHERE status = 'pending';

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION app.update_scan_link_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_scan_link_requests_updated_at ON app.scan_link_requests;
CREATE TRIGGER trigger_update_scan_link_requests_updated_at
  BEFORE UPDATE ON app.scan_link_requests
  FOR EACH ROW
  EXECUTE FUNCTION app.update_scan_link_requests_updated_at();

-- Comentarios de documentación
COMMENT ON TABLE app.scan_link_requests IS 'Solicitudes de vinculación de grupos de scanlation a medias. El owner del grupo debe aprobar.';
COMMENT ON COLUMN app.scan_link_requests.group_id IS 'ID del grupo de scanlation verificado';
COMMENT ON COLUMN app.scan_link_requests.media_type IS 'Tipo de media (anime, manga, manhwa, etc.)';
COMMENT ON COLUMN app.scan_link_requests.media_id IS 'ID del media en su tabla correspondiente';
COMMENT ON COLUMN app.scan_link_requests.url IS 'URL del proyecto de traducción';
COMMENT ON COLUMN app.scan_link_requests.requested_by IS 'Usuario que solicita la vinculación';
COMMENT ON COLUMN app.scan_link_requests.status IS 'Estado: pending, approved, rejected';
COMMENT ON COLUMN app.scan_link_requests.reviewed_by IS 'Owner del grupo que revisó la solicitud';
