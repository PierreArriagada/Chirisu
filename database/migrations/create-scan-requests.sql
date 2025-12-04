-- ============================================================================
-- MIGRACIÓN: Sistema de Solicitudes para Rol Scanlator
-- ============================================================================
-- FECHA: 2025-11-29
-- DESCRIPCIÓN: Sistema para que usuarios soliciten el rol de scanlator
-- ============================================================================

BEGIN;

\echo '============================================================================'
\echo 'CREANDO SISTEMA DE SOLICITUDES SCAN'
\echo '============================================================================'

-- ============================================================================
-- 1. TABLA DE SOLICITUDES
-- ============================================================================

\echo ''
\echo '1. Creando tabla scan_requests...'

CREATE TABLE IF NOT EXISTS app.scan_requests (
  id SERIAL PRIMARY KEY,
  
  -- Usuario solicitante
  user_id INTEGER NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
  
  -- Información de la solicitud
  group_name VARCHAR(255) NOT NULL,           -- Nombre del grupo de scanlation
  group_url VARCHAR(500),                      -- URL del grupo (sitio web, discord, etc.)
  experience TEXT NOT NULL,                    -- Descripción de experiencia previa
  media_types TEXT[],                          -- Tipos de media que traduce ['manga', 'manhwa', etc.]
  languages VARCHAR(50)[] DEFAULT ARRAY['es'], -- Idiomas de traducción
  portfolio_urls TEXT[],                       -- Links a trabajos previos
  
  -- Estado de la solicitud
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  
  -- Revisión
  reviewed_by INTEGER REFERENCES app.users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Un usuario solo puede tener una solicitud pendiente
  CONSTRAINT unique_pending_request UNIQUE (user_id, status) 
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_scan_requests_user ON app.scan_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_requests_status ON app.scan_requests(status);
CREATE INDEX IF NOT EXISTS idx_scan_requests_pending ON app.scan_requests(status) WHERE status = 'pending';

\echo '   ✅ Tabla scan_requests creada'

-- ============================================================================
-- 2. FUNCIÓN: Aprobar solicitud automáticamente asigna rol
-- ============================================================================

\echo ''
\echo '2. Creando función para aprobar solicitudes...'

CREATE OR REPLACE FUNCTION app.approve_scan_request(
  p_request_id INTEGER,
  p_admin_id INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id INTEGER;
  v_scan_role_id INTEGER;
BEGIN
  -- Obtener el usuario de la solicitud
  SELECT user_id INTO v_user_id
  FROM app.scan_requests
  WHERE id = p_request_id AND status = 'pending';
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Solicitud no encontrada o ya procesada';
  END IF;
  
  -- Obtener el ID del rol scan
  SELECT id INTO v_scan_role_id FROM app.roles WHERE name = 'scan';
  
  IF v_scan_role_id IS NULL THEN
    RAISE EXCEPTION 'Rol scan no encontrado';
  END IF;
  
  -- Actualizar la solicitud
  UPDATE app.scan_requests
  SET 
    status = 'approved',
    reviewed_by = p_admin_id,
    reviewed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_request_id;
  
  -- Asignar el rol al usuario
  INSERT INTO app.user_roles (user_id, role_id, assigned_by, assigned_at)
  VALUES (v_user_id, v_scan_role_id, p_admin_id, NOW())
  ON CONFLICT DO NOTHING;
  
  -- Crear notificación para el usuario
  INSERT INTO app.notifications (user_id, type, title, message, created_at)
  VALUES (
    v_user_id,
    'role_assigned',
    '🎉 ¡Solicitud Aprobada!',
    'Tu solicitud para ser Scanlator ha sido aprobada. Ya puedes gestionar tus proyectos de traducción.',
    NOW()
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

\echo '   ✅ Función approve_scan_request creada'

-- ============================================================================
-- 3. FUNCIÓN: Rechazar solicitud
-- ============================================================================

\echo ''
\echo '3. Creando función para rechazar solicitudes...'

CREATE OR REPLACE FUNCTION app.reject_scan_request(
  p_request_id INTEGER,
  p_admin_id INTEGER,
  p_reason TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id INTEGER;
BEGIN
  -- Obtener el usuario de la solicitud
  SELECT user_id INTO v_user_id
  FROM app.scan_requests
  WHERE id = p_request_id AND status = 'pending';
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Solicitud no encontrada o ya procesada';
  END IF;
  
  -- Actualizar la solicitud
  UPDATE app.scan_requests
  SET 
    status = 'rejected',
    reviewed_by = p_admin_id,
    reviewed_at = NOW(),
    rejection_reason = p_reason,
    updated_at = NOW()
  WHERE id = p_request_id;
  
  -- Crear notificación para el usuario
  INSERT INTO app.notifications (user_id, type, title, message, created_at)
  VALUES (
    v_user_id,
    'role_rejected',
    '❌ Solicitud Rechazada',
    COALESCE('Tu solicitud para ser Scanlator ha sido rechazada. Razón: ' || p_reason, 'Tu solicitud para ser Scanlator ha sido rechazada.'),
    NOW()
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

\echo '   ✅ Función reject_scan_request creada'

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

\echo ''
\echo '============================================================================'
\echo 'VERIFICACIÓN FINAL'
\echo '============================================================================'

\echo ''
\echo 'Tabla creada:'
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'app' 
  AND table_name = 'scan_requests';

\echo ''
\echo '============================================================================'
\echo '✅ SISTEMA DE SOLICITUDES SCAN CREADO EXITOSAMENTE'
\echo '============================================================================'

COMMIT;
