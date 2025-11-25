-- ========================================
-- MIGRACION: Agregar funcionalidades de autenticación
-- Fecha: 8 de Noviembre de 2025
-- ========================================

-- Usar el schema app
SET search_path = app, public;

-- 1. Tabla para tokens de recuperación de contraseña
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice para búsquedas rápidas por token
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);

-- 2. Tabla para autenticación de 2 factores (2FA)
CREATE TABLE IF NOT EXISTS user_2fa (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  secret VARCHAR(255) NOT NULL,  -- Secret para TOTP
  enabled BOOLEAN DEFAULT false,
  backup_codes TEXT[],  -- Códigos de respaldo
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  enabled_at TIMESTAMP
);

-- Índice para búsquedas rápidas
CREATE INDEX idx_user_2fa_user_id ON user_2fa(user_id);

-- 3. Tabla para proveedores OAuth (Google, GitHub, etc.)
CREATE TABLE IF NOT EXISTS oauth_accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,  -- 'google', 'github', etc.
  provider_account_id VARCHAR(255) NOT NULL,  -- ID del proveedor
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP,
  token_type VARCHAR(50),
  scope TEXT,
  id_token TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(provider, provider_account_id)
);

-- Índices
CREATE INDEX idx_oauth_accounts_user_id ON oauth_accounts(user_id);
CREATE INDEX idx_oauth_accounts_provider ON oauth_accounts(provider, provider_account_id);

-- 4. Agregar campo para verificación de email
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMP;

-- Índice para verificación de email
CREATE INDEX IF NOT EXISTS idx_users_email_verification_token 
ON users(email_verification_token);

-- 5. Tabla para intentos de login (seguridad)
CREATE TABLE IF NOT EXISTS login_attempts (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  success BOOLEAN NOT NULL,
  attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice para rate limiting
CREATE INDEX idx_login_attempts_email_ip 
ON login_attempts(email, ip_address, attempted_at);

-- 6. Comentarios en tablas
COMMENT ON TABLE password_reset_tokens IS 'Tokens para recuperación de contraseña por email';
COMMENT ON TABLE user_2fa IS 'Configuración de autenticación de dos factores';
COMMENT ON TABLE oauth_accounts IS 'Cuentas vinculadas con proveedores OAuth';
COMMENT ON TABLE login_attempts IS 'Registro de intentos de login para seguridad';

-- Fin de la migración
