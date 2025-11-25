-- ============================================
-- SCRIPT: Crear tabla content_reports
-- ============================================
-- Ejecutar ANTES de DATABASE-FIXES-NOTIFICATIONS.sql
-- si la tabla content_reports no existe

-- Verificar si existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'app' AND table_name = 'content_reports'
  ) THEN
    
    -- Crear tabla
    CREATE TABLE app.content_reports (
      id BIGSERIAL PRIMARY KEY,
      
      -- Usuario que reporta
      reporter_user_id BIGINT NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
      
      -- Contenido reportado (polimórfico)
      reportable_type VARCHAR(50) NOT NULL, -- 'anime', 'manga', 'novel', 'character', 'review', etc.
      reportable_id BIGINT NOT NULL,
      
      -- Detalles del reporte
      reason VARCHAR(100) NOT NULL, -- 'spam', 'inappropriate', 'copyright', 'wrong_info', 'other'
      description TEXT NOT NULL,
      
      -- Estado de moderación
      status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'resolved', 'dismissed'
      reviewed_by BIGINT REFERENCES app.users(id) ON DELETE SET NULL,
      reviewed_at TIMESTAMP,
      moderator_notes TEXT,
      
      -- Metadata
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    
    -- Índices
    CREATE INDEX idx_content_reports_reporter ON app.content_reports(reporter_user_id);
    CREATE INDEX idx_content_reports_reportable ON app.content_reports(reportable_type, reportable_id);
    CREATE INDEX idx_content_reports_status ON app.content_reports(status, created_at DESC);
    CREATE INDEX idx_content_reports_reviewed_by ON app.content_reports(reviewed_by) WHERE reviewed_by IS NOT NULL;
    
    -- Trigger de updated_at
    CREATE TRIGGER trigger_content_reports_updated_at
      BEFORE UPDATE ON app.content_reports
      FOR EACH ROW
      EXECUTE FUNCTION app.fn_update_timestamp();
    
    RAISE NOTICE '✅ Tabla app.content_reports creada exitosamente';
    
  ELSE
    RAISE NOTICE '⚠️ La tabla app.content_reports ya existe, omitiendo creación';
  END IF;
END $$;

-- Verificación
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'app' AND table_name = 'content_reports'
    )
    THEN '✅ app.content_reports existe'
    ELSE '❌ app.content_reports NO existe'
  END AS verificacion;
