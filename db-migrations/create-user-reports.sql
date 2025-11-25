-- Crear tabla de reportes de usuarios
CREATE TABLE IF NOT EXISTS app.user_reports (
    id SERIAL PRIMARY KEY,
    reported_user_id INTEGER NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    reporter_user_id INTEGER NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    reason VARCHAR(100) NOT NULL CHECK (reason IN (
        'spam',
        'harassment',
        'inappropriate_content',
        'impersonation',
        'offensive_username',
        'offensive_profile',
        'suspicious_activity',
        'other'
    )),
    description TEXT NOT NULL,
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
        'content_removed',
        'user_warned',
        'user_suspended',
        'user_banned'
    )),
    UNIQUE(reported_user_id, reporter_user_id, reason)
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_user_reports_status ON app.user_reports(status);
CREATE INDEX IF NOT EXISTS idx_user_reports_reporter ON app.user_reports(reporter_user_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_reported_user ON app.user_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_created ON app.user_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_reports_assigned ON app.user_reports(assigned_to) WHERE assigned_to IS NOT NULL;

-- Comentario de la tabla
COMMENT ON TABLE app.user_reports IS 'Reportes de comportamiento inapropiado de usuarios';
