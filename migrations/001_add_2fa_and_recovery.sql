-- ========================================
-- MIGRACIÓN: Agregar sistema 2FA y Recovery Codes
-- Fecha: 2025-11-08
-- Descripción: Agrega tablas para autenticación de dos factores,
--              códigos de recuperación y audit log
-- ========================================

-- IMPORTANTE: Ejecutar con:
-- psql -U postgres -d NOMBRE_BD -f migrations/001_add_2fa_and_recovery.sql

BEGIN;

-- ========================================
-- 1. TABLA: user_2fa
-- ========================================
-- Almacena configuración de autenticación de dos factores

CREATE TABLE IF NOT EXISTS app.user_2fa (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    secret VARCHAR(255) NOT NULL,
    enabled BOOLEAN DEFAULT false,
    backup_codes TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT user_2fa_user_id_unique UNIQUE(user_id)
);

COMMENT ON TABLE app.user_2fa IS 'Configuración de autenticación de dos factores (2FA) para usuarios. Almacena el secret TOTP y códigos de respaldo hasheados.';
COMMENT ON COLUMN app.user_2fa.secret IS 'Secret base32 para generar códigos TOTP (Google Authenticator, Authy, etc.)';
COMMENT ON COLUMN app.user_2fa.enabled IS 'Indica si el usuario ha completado la configuración de 2FA y la cuenta está activa';
COMMENT ON COLUMN app.user_2fa.backup_codes IS 'Array de códigos de respaldo hasheados con bcrypt (10 códigos)';

-- Índices para user_2fa
CREATE INDEX IF NOT EXISTS idx_user_2fa_user_id ON app.user_2fa(user_id);
CREATE INDEX IF NOT EXISTS idx_user_2fa_enabled ON app.user_2fa(enabled) WHERE enabled = true;

-- ========================================
-- 2. TABLA: recovery_codes
-- ========================================
-- Códigos únicos para recuperar cuenta sin email

CREATE TABLE IF NOT EXISTS app.recovery_codes (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    code VARCHAR(255) NOT NULL UNIQUE,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_regenerated TIMESTAMP WITH TIME ZONE,
    used_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE app.recovery_codes IS 'Códigos de recuperación de cuenta. Código único de 64 caracteres hex usado para recuperar contraseña sin email.';
COMMENT ON COLUMN app.recovery_codes.code IS 'Código único de 64 caracteres hexadecimales generado con crypto.randomBytes(32).toString("hex")';
COMMENT ON COLUMN app.recovery_codes.used IS 'Indica si el código ha sido utilizado (se regenera después de cada uso)';
COMMENT ON COLUMN app.recovery_codes.last_regenerated IS 'Timestamp de la última vez que se regeneró el código (después de recuperar contraseña)';

-- Índices para recovery_codes
CREATE INDEX IF NOT EXISTS idx_recovery_codes_code ON app.recovery_codes(code);
CREATE INDEX IF NOT EXISTS idx_recovery_codes_user_id ON app.recovery_codes(user_id);

-- Constraint: Solo un recovery code activo por usuario
CREATE UNIQUE INDEX IF NOT EXISTS idx_recovery_codes_user_active 
ON app.recovery_codes(user_id) 
WHERE used = false;

-- ========================================
-- 3. TABLA: audit_log
-- ========================================
-- Registro de acciones importantes del sistema

CREATE TABLE IF NOT EXISTS app.audit_log (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES app.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id BIGINT,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE app.audit_log IS 'Registro de auditoría de acciones importantes del sistema (cambios de contraseña, login, etc.)';
COMMENT ON COLUMN app.audit_log.action IS 'Tipo de acción realizada (password_reset, login, 2fa_verify, etc.)';
COMMENT ON COLUMN app.audit_log.resource_type IS 'Tipo de recurso afectado (auth, user, media, etc.)';
COMMENT ON COLUMN app.audit_log.details IS 'Detalles adicionales de la acción en formato JSON';

-- Índices para audit_log
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON app.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON app.audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON app.audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON app.audit_log(resource_type, resource_id);

-- ========================================
-- 4. CREAR LISTAS PREDETERMINADAS PARA USUARIOS EXISTENTES
-- ========================================
-- Para usuarios que se registraron antes de esta migración

DO $$
DECLARE
    usr RECORD;
    default_lists TEXT[] := ARRAY[
        'Por Ver:por-ver:Títulos que planeo ver',
        'Siguiendo:siguiendo:Títulos que estoy viendo',
        'Completado:completado:Títulos que he completado',
        'Favoritos:favoritos:Mis títulos favoritos'
    ];
    list_info TEXT;
    list_parts TEXT[];
BEGIN
    -- Para cada usuario que no tenga listas predeterminadas
    FOR usr IN 
        SELECT DISTINCT u.id 
        FROM app.users u
        LEFT JOIN app.lists l ON l.user_id = u.id AND l.is_default = true
        WHERE l.id IS NULL AND u.is_active = true
    LOOP
        -- Crear las 4 listas predeterminadas
        FOREACH list_info IN ARRAY default_lists
        LOOP
            list_parts := string_to_array(list_info, ':');
            
            INSERT INTO app.lists (user_id, name, slug, description, is_default, is_public, created_at)
            VALUES (
                usr.id,
                list_parts[1],  -- name
                list_parts[2],  -- slug
                list_parts[3],  -- description
                true,           -- is_default
                true,           -- is_public
                NOW()
            )
            ON CONFLICT (user_id, slug) DO NOTHING;
        END LOOP;
        
        RAISE NOTICE 'Listas creadas para usuario ID: %', usr.id;
    END LOOP;
END;
$$;

-- ========================================
-- 5. VERIFICACIÓN
-- ========================================

-- Verificar que las tablas se crearon correctamente
DO $$
DECLARE
    table_count INT;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'app'
    AND table_name IN ('user_2fa', 'recovery_codes', 'audit_log');
    
    IF table_count = 3 THEN
        RAISE NOTICE '✅ Migración completada exitosamente. 3 tablas creadas.';
    ELSE
        RAISE WARNING '⚠️  Solo se crearon % de 3 tablas esperadas', table_count;
    END IF;
END;
$$;

-- Mostrar resumen de usuarios con 2FA
SELECT 
    COUNT(*) as total_users,
    COUNT(u2f.id) FILTER (WHERE u2f.enabled = true) as users_with_2fa_enabled,
    COUNT(u2f.id) FILTER (WHERE u2f.enabled = false) as users_with_2fa_disabled,
    COUNT(*) - COUNT(u2f.id) as users_without_2fa
FROM app.users u
LEFT JOIN app.user_2fa u2f ON u2f.user_id = u.id
WHERE u.is_active = true;

COMMIT;

-- ========================================
-- FIN DE MIGRACIÓN
-- ========================================
-- Para revertir esta migración:
-- DROP TABLE IF EXISTS app.audit_log;
-- DROP TABLE IF EXISTS app.recovery_codes;
-- DROP TABLE IF EXISTS app.user_2fa;
-- ========================================
