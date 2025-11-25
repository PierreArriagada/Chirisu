-- Crear tabla de reportes de comentarios
CREATE TABLE IF NOT EXISTS app.comment_reports (
    id SERIAL PRIMARY KEY,
    comment_id INTEGER NOT NULL REFERENCES app.comments(id) ON DELETE CASCADE,
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
        'resolved',
        'rejected'
    )),
    assigned_to INTEGER REFERENCES app.users(id),
    assigned_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITHOUT TIME ZONE,
    resolved_by INTEGER REFERENCES app.users(id),
    resolution_notes TEXT,
    action_taken VARCHAR(50) CHECK (action_taken IN (
        'no_action',
        'warning_sent',
        'comment_deleted',
        'user_warned',
        'user_suspended'
    )),
    UNIQUE(comment_id, reporter_user_id)
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_comment_reports_status ON app.comment_reports(status);
CREATE INDEX IF NOT EXISTS idx_comment_reports_comment_id ON app.comment_reports(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_reports_reporter ON app.comment_reports(reporter_user_id);
CREATE INDEX IF NOT EXISTS idx_comment_reports_reported_user ON app.comment_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_comment_reports_created ON app.comment_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comment_reports_assigned ON app.comment_reports(assigned_to) WHERE assigned_to IS NOT NULL;

-- Comentario de la tabla
COMMENT ON TABLE app.comment_reports IS 'Reportes de comentarios inapropiados realizados por usuarios';
