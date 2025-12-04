-- ============================================================================
-- MIGRACIÓN: Sistema de Scanlation/Fansub
-- ============================================================================
-- FECHA: 2025-11-29
-- DESCRIPCIÓN: Sistema completo para gestión de proyectos de traducción
--   - Rol "scan" con permisos específicos
--   - Tabla de proyectos de scanlation
--   - Tabla de capítulos/episodios subidos
--   - Sistema de estados (traduciendo, abandonado, completado)
--   - Notificaciones automáticas por inactividad
-- ============================================================================

BEGIN;

\echo '============================================================================'
\echo 'CREANDO SISTEMA DE SCANLATION'
\echo '============================================================================'

-- ============================================================================
-- 1. NUEVO ROL: SCAN
-- ============================================================================

\echo ''
\echo '1. Creando rol SCAN...'

INSERT INTO app.roles (id, name, display_name, description, created_at) VALUES
  (4, 'scan', 'Scanlator/Fansubber', 'User who translates and uploads content', NOW())
ON CONFLICT (id) DO NOTHING;

\echo '   ✅ Rol "scan" creado (ID: 4)'

-- ============================================================================
-- 2. PERMISOS ESPECÍFICOS PARA SCAN
-- ============================================================================

\echo ''
\echo '2. Creando permisos específicos para scanlators...'

INSERT INTO app.permissions (id, name, display_name, description, resource, action, created_at) VALUES
  -- Permisos de proyectos de scan
  (22, 'manage_scan_projects', 'Gestionar Proyectos Scan', 'Create and manage scanlation projects', 'scan_projects', 'manage', NOW()),
  (23, 'edit_scan_links', 'Editar Links de Scan', 'Edit scanlation/fansub links on media', 'scan_links', 'update', NOW()),
  (24, 'manage_chapters', 'Gestionar Capítulos', 'Add, edit and delete chapters/episodes', 'chapters', 'manage', NOW()),
  (25, 'view_scan_stats', 'Ver Estadísticas Scan', 'View scanlation statistics', 'scan_stats', 'read', NOW())
ON CONFLICT (id) DO NOTHING;

-- Asignar permisos al rol SCAN
INSERT INTO app.role_permissions (role_id, permission_id) VALUES
  (4, 22),  -- manage_scan_projects
  (4, 23),  -- edit_scan_links
  (4, 24),  -- manage_chapters
  (4, 25)   -- view_scan_stats
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Asignar también al ADMIN
INSERT INTO app.role_permissions (role_id, permission_id) VALUES
  (1, 22), (1, 23), (1, 24), (1, 25)
ON CONFLICT (role_id, permission_id) DO NOTHING;

\echo '   ✅ 4 permisos de scan creados y asignados'

-- ============================================================================
-- 3. ENUM DE ESTADOS DE PROYECTO SCAN
-- ============================================================================

\echo ''
\echo '3. Creando tipo ENUM para estados de proyecto...'

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'scan_project_status') THEN
    CREATE TYPE app.scan_project_status AS ENUM (
      'active',       -- Traduciendo activamente
      'hiatus',       -- En pausa temporal
      'completed',    -- Proyecto completado
      'dropped',      -- Abandonado
      'licensed'      -- Licenciado (debe dejar de traducir)
    );
  END IF;
END $$;

\echo '   ✅ ENUM scan_project_status creado'

-- ============================================================================
-- 4. TABLA: SCAN_PROJECTS (Proyectos de Scanlation)
-- ============================================================================

\echo ''
\echo '4. Creando tabla scan_projects...'

CREATE TABLE IF NOT EXISTS app.scan_projects (
  id SERIAL PRIMARY KEY,
  
  -- Relaciones
  user_id INTEGER NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
  
  -- Tipo de media (polimórfico)
  media_type VARCHAR(50) NOT NULL CHECK (media_type IN ('anime', 'manga', 'manhwa', 'manhua', 'donghua', 'novel', 'fan_comic')),
  media_id INTEGER NOT NULL,
  
  -- Información del proyecto
  group_name VARCHAR(255),              -- Nombre del grupo (ej: "MangaDex Scans")
  website_url VARCHAR(500),             -- Sitio web del grupo
  project_url VARCHAR(500) NOT NULL,    -- URL directa al proyecto
  
  -- Estado y actividad
  status app.scan_project_status NOT NULL DEFAULT 'active',
  last_chapter_at TIMESTAMPTZ,          -- Fecha del último capítulo
  last_activity_check TIMESTAMPTZ DEFAULT NOW(),
  inactivity_notified BOOLEAN DEFAULT FALSE,
  
  -- Idioma de traducción
  language VARCHAR(10) NOT NULL DEFAULT 'es', -- es, en, pt, etc.
  
  -- Notas
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Índice único: un usuario solo puede tener un proyecto por media+idioma
  UNIQUE(user_id, media_type, media_id, language)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_scan_projects_user ON app.scan_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_projects_media ON app.scan_projects(media_type, media_id);
CREATE INDEX IF NOT EXISTS idx_scan_projects_status ON app.scan_projects(status);
CREATE INDEX IF NOT EXISTS idx_scan_projects_last_chapter ON app.scan_projects(last_chapter_at);
CREATE INDEX IF NOT EXISTS idx_scan_projects_inactivity ON app.scan_projects(status, last_chapter_at) 
  WHERE status = 'active' AND inactivity_notified = FALSE;

\echo '   ✅ Tabla scan_projects creada'

-- ============================================================================
-- 5. TABLA: SCAN_CHAPTERS (Capítulos/Episodios subidos)
-- ============================================================================

\echo ''
\echo '5. Creando tabla scan_chapters...'

CREATE TABLE IF NOT EXISTS app.scan_chapters (
  id SERIAL PRIMARY KEY,
  
  -- Relación con proyecto
  project_id INTEGER NOT NULL REFERENCES app.scan_projects(id) ON DELETE CASCADE,
  
  -- Información del capítulo
  chapter_number DECIMAL(10, 2) NOT NULL,  -- Permite 10.5, 100.1, etc.
  volume_number INTEGER,                    -- Volumen (opcional)
  title VARCHAR(255),                       -- Título del capítulo
  
  -- Links
  chapter_url VARCHAR(500) NOT NULL,        -- URL directa al capítulo
  
  -- Fechas
  release_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Evitar duplicados
  UNIQUE(project_id, chapter_number)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_scan_chapters_project ON app.scan_chapters(project_id);
CREATE INDEX IF NOT EXISTS idx_scan_chapters_number ON app.scan_chapters(chapter_number);
CREATE INDEX IF NOT EXISTS idx_scan_chapters_release ON app.scan_chapters(release_date DESC);

\echo '   ✅ Tabla scan_chapters creada'

-- ============================================================================
-- 6. TRIGGER: Actualizar last_chapter_at automáticamente
-- ============================================================================

\echo ''
\echo '6. Creando triggers...'

CREATE OR REPLACE FUNCTION app.update_project_last_chapter()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE app.scan_projects 
  SET 
    last_chapter_at = NEW.release_date,
    updated_at = NOW(),
    inactivity_notified = FALSE  -- Reset notificación al agregar capítulo
  WHERE id = NEW.project_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_project_last_chapter ON app.scan_chapters;
CREATE TRIGGER trg_update_project_last_chapter
  AFTER INSERT ON app.scan_chapters
  FOR EACH ROW
  EXECUTE FUNCTION app.update_project_last_chapter();

\echo '   ✅ Trigger para actualizar last_chapter_at creado'

-- ============================================================================
-- 7. FUNCIÓN: Obtener proyectos inactivos (más de 3 meses)
-- ============================================================================

\echo ''
\echo '7. Creando funciones de utilidad...'

CREATE OR REPLACE FUNCTION app.get_inactive_scan_projects(months_threshold INTEGER DEFAULT 3)
RETURNS TABLE (
  project_id INTEGER,
  user_id INTEGER,
  media_type VARCHAR,
  media_id INTEGER,
  group_name VARCHAR,
  last_chapter_at TIMESTAMPTZ,
  days_inactive INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.id as project_id,
    sp.user_id,
    sp.media_type,
    sp.media_id,
    sp.group_name,
    sp.last_chapter_at,
    EXTRACT(DAY FROM NOW() - COALESCE(sp.last_chapter_at, sp.created_at))::INTEGER as days_inactive
  FROM app.scan_projects sp
  WHERE sp.status = 'active'
    AND sp.inactivity_notified = FALSE
    AND (
      sp.last_chapter_at IS NULL AND sp.created_at < NOW() - (months_threshold || ' months')::INTERVAL
      OR sp.last_chapter_at < NOW() - (months_threshold || ' months')::INTERVAL
    )
  ORDER BY days_inactive DESC;
END;
$$ LANGUAGE plpgsql;

\echo '   ✅ Función get_inactive_scan_projects creada'

-- ============================================================================
-- 8. FUNCIÓN: Marcar proyectos como abandonados automáticamente
-- ============================================================================

CREATE OR REPLACE FUNCTION app.mark_abandoned_scan_projects(months_threshold INTEGER DEFAULT 6)
RETURNS INTEGER AS $$
DECLARE
  affected_count INTEGER;
BEGIN
  -- Marcar como abandonados proyectos sin actividad por X meses
  -- y que ya fueron notificados
  UPDATE app.scan_projects
  SET 
    status = 'dropped',
    updated_at = NOW()
  WHERE status = 'active'
    AND inactivity_notified = TRUE
    AND (
      last_chapter_at IS NULL AND created_at < NOW() - (months_threshold || ' months')::INTERVAL
      OR last_chapter_at < NOW() - (months_threshold || ' months')::INTERVAL
    );
  
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RETURN affected_count;
END;
$$ LANGUAGE plpgsql;

\echo '   ✅ Función mark_abandoned_scan_projects creada'

-- ============================================================================
-- 9. VISTA: Proyectos de un scan con info de media
-- ============================================================================

\echo ''
\echo '8. Creando vistas...'

CREATE OR REPLACE VIEW app.v_scan_projects_with_media AS
SELECT 
  sp.*,
  u.username as scan_username,
  u.avatar_url as scan_avatar,
  -- Conteo de capítulos
  (SELECT COUNT(*) FROM app.scan_chapters sc WHERE sc.project_id = sp.id) as chapter_count,
  -- Nombre del media según tipo
  CASE sp.media_type
    WHEN 'anime' THEN (SELECT title_romaji FROM app.anime WHERE id = sp.media_id)
    WHEN 'manga' THEN (SELECT title_romaji FROM app.manga WHERE id = sp.media_id)
    WHEN 'manhwa' THEN (SELECT title_romaji FROM app.manhwa WHERE id = sp.media_id)
    WHEN 'manhua' THEN (SELECT title_romaji FROM app.manhua WHERE id = sp.media_id)
    WHEN 'donghua' THEN (SELECT title_romaji FROM app.donghua WHERE id = sp.media_id)
    WHEN 'novel' THEN (SELECT title_romaji FROM app.novels WHERE id = sp.media_id)
    WHEN 'fan_comic' THEN (SELECT title FROM app.fan_comics WHERE id = sp.media_id)
  END as media_title,
  -- Cover del media
  CASE sp.media_type
    WHEN 'anime' THEN (SELECT cover_image_url FROM app.anime WHERE id = sp.media_id)
    WHEN 'manga' THEN (SELECT cover_image_url FROM app.manga WHERE id = sp.media_id)
    WHEN 'manhwa' THEN (SELECT cover_image_url FROM app.manhwa WHERE id = sp.media_id)
    WHEN 'manhua' THEN (SELECT cover_image_url FROM app.manhua WHERE id = sp.media_id)
    WHEN 'donghua' THEN (SELECT cover_image_url FROM app.donghua WHERE id = sp.media_id)
    WHEN 'novel' THEN (SELECT cover_image_url FROM app.novels WHERE id = sp.media_id)
    WHEN 'fan_comic' THEN (SELECT cover_image_url FROM app.fan_comics WHERE id = sp.media_id)
  END as media_cover
FROM app.scan_projects sp
JOIN app.users u ON sp.user_id = u.id;

\echo '   ✅ Vista v_scan_projects_with_media creada'

-- ============================================================================
-- 10. VISTA: Scans disponibles para un media específico
-- ============================================================================

CREATE OR REPLACE VIEW app.v_media_scan_links AS
SELECT 
  sp.media_type,
  sp.media_id,
  sp.id as project_id,
  sp.group_name,
  sp.website_url,
  sp.project_url,
  sp.status,
  sp.language,
  sp.last_chapter_at,
  sp.created_at,
  u.id as scan_user_id,
  u.username as scan_username,
  u.avatar_url as scan_avatar,
  (SELECT COUNT(*) FROM app.scan_chapters sc WHERE sc.project_id = sp.id) as chapter_count,
  (SELECT MAX(chapter_number) FROM app.scan_chapters sc WHERE sc.project_id = sp.id) as latest_chapter
FROM app.scan_projects sp
JOIN app.users u ON sp.user_id = u.id
WHERE sp.status IN ('active', 'hiatus', 'completed')
ORDER BY sp.status = 'active' DESC, sp.last_chapter_at DESC NULLS LAST;

\echo '   ✅ Vista v_media_scan_links creada'

-- ============================================================================
-- 11. AJUSTAR SECUENCIAS
-- ============================================================================

\echo ''
\echo '9. Ajustando secuencias...'

SELECT setval('app.roles_id_seq', GREATEST((SELECT MAX(id) FROM app.roles), 4));
SELECT setval('app.permissions_id_seq', GREATEST((SELECT MAX(id) FROM app.permissions), 25));

-- ============================================================================
-- 12. VERIFICACIÓN
-- ============================================================================

\echo ''
\echo '============================================================================'
\echo 'VERIFICACIÓN FINAL'
\echo '============================================================================'

\echo ''
\echo 'Rol SCAN:'
SELECT id, name, display_name FROM app.roles WHERE name = 'scan';

\echo ''
\echo 'Permisos de SCAN:'
SELECT p.name, p.display_name 
FROM app.permissions p
JOIN app.role_permissions rp ON p.id = rp.permission_id
WHERE rp.role_id = 4;

\echo ''
\echo 'Tablas creadas:'
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'app' 
  AND table_name IN ('scan_projects', 'scan_chapters');

\echo ''
\echo '============================================================================'
\echo '✅ SISTEMA DE SCANLATION CREADO EXITOSAMENTE'
\echo '============================================================================'
\echo ''
\echo 'Resumen:'
\echo '  - Nuevo rol: scan (ID: 4)'
\echo '  - 4 nuevos permisos específicos'
\echo '  - Tabla scan_projects: proyectos de traducción'
\echo '  - Tabla scan_chapters: capítulos subidos'
\echo '  - Vistas para consultas fáciles'
\echo '  - Triggers para actualización automática'
\echo '  - Funciones para detectar proyectos abandonados'
\echo ''

COMMIT;
