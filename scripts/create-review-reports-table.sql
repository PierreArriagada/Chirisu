-- ============================================
-- TABLA: app.review_reports
-- ============================================
-- Almacena los reportes de reseñas realizados por usuarios

CREATE TABLE IF NOT EXISTS app.review_reports (
    id SERIAL PRIMARY KEY,
    review_id INTEGER NOT NULL REFERENCES app.reviews(id) ON DELETE CASCADE,
    reporter_user_id INTEGER NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    reported_user_id INTEGER NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    reason VARCHAR(100) NOT NULL CHECK (reason IN (
        'spam',
        'offensive_language',
        'harassment',
        'spoilers',
        'irrelevant_content',
        'misinformation',
        'other'
    )),
    comments TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending',
        'reviewing',
        'approved',
        'rejected',
        'resolved'
    )),
    created_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP,
    resolved_by INTEGER REFERENCES app.users(id),
    resolution_notes TEXT,
    action_taken VARCHAR(50) CHECK (action_taken IN (
        'no_action',
        'warning_sent',
        'review_deleted',
        'user_warned',
        'user_suspended'
    )),
    
    -- Evitar que un usuario reporte la misma reseña múltiples veces
    UNIQUE(review_id, reporter_user_id)
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_review_reports_review_id ON app.review_reports(review_id);
CREATE INDEX IF NOT EXISTS idx_review_reports_reporter ON app.review_reports(reporter_user_id);
CREATE INDEX IF NOT EXISTS idx_review_reports_reported_user ON app.review_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_review_reports_status ON app.review_reports(status);
CREATE INDEX IF NOT EXISTS idx_review_reports_created ON app.review_reports(created_at DESC);

-- Comentarios
COMMENT ON TABLE app.review_reports IS 'Reportes de reseñas inapropiadas o que violan las políticas';
COMMENT ON COLUMN app.review_reports.reason IS 'Razón del reporte: spam, offensive_language, harassment, spoilers, irrelevant_content, misinformation, other';
COMMENT ON COLUMN app.review_reports.status IS 'Estado del reporte: pending, reviewing, approved, rejected, resolved';
COMMENT ON COLUMN app.review_reports.action_taken IS 'Acción tomada por el moderador: no_action, warning_sent, review_deleted, user_warned, user_suspended';
COMMENT ON COLUMN app.review_reports.reported_user_id IS 'ID del usuario que escribió la reseña reportada';

-- Verificar tabla creada
SELECT 
    'Tabla review_reports creada exitosamente' AS mensaje,
    COUNT(*) AS total_reportes
FROM app.review_reports;
