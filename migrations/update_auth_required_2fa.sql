-- ========================================
-- MIGRACION: A2F Obligatorio + Recuperación por A2F
-- Fecha: 8 de Noviembre de 2025
-- ========================================
-- 
-- CAMBIOS:
-- 1. A2F es OBLIGATORIO al crear cuenta
-- 2. user_2fa.enabled = true por defecto
-- 3. Agregar recovery_code para recuperar contraseña con A2F
-- 4. Deshabilitar email recovery (preparado para cuando tengamos correo empresarial)
-- ========================================

SET search_path = app, public;

-- 1. Modificar tabla user_2fa: enabled = true por defecto
ALTER TABLE user_2fa 
ALTER COLUMN enabled SET DEFAULT true;

-- 2. Agregar campo para código de recuperación (alternativa a email)
ALTER TABLE user_2fa
ADD COLUMN IF NOT EXISTS recovery_code VARCHAR(64) UNIQUE;

-- 3. Índice para recovery_code
CREATE INDEX IF NOT EXISTS idx_user_2fa_recovery_code 
ON user_2fa(recovery_code);

-- 4. Agregar campo para indicar si el usuario completó setup de A2F
ALTER TABLE users
ADD COLUMN IF NOT EXISTS has_2fa_setup BOOLEAN DEFAULT false;

-- 5. Modificar password_reset_tokens: agregar campo para método de recuperación
ALTER TABLE password_reset_tokens
ADD COLUMN IF NOT EXISTS recovery_method VARCHAR(20) DEFAULT 'email' CHECK (recovery_method IN ('email', '2fa'));

-- Índice
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_method 
ON password_reset_tokens(recovery_method);

-- 6. Agregar tabla para almacenar códigos de recuperación únicos
CREATE TABLE IF NOT EXISTS recovery_codes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(64) UNIQUE NOT NULL, -- Código único para recuperación
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_regenerated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice
CREATE INDEX idx_recovery_codes_user_id ON recovery_codes(user_id);
CREATE INDEX idx_recovery_codes_code ON recovery_codes(code);

-- 7. Comentarios
COMMENT ON COLUMN user_2fa.recovery_code IS 'Código de recuperación único para restablecer contraseña sin email';
COMMENT ON COLUMN users.has_2fa_setup IS 'Indica si el usuario completó la configuración de A2F (obligatorio)';
COMMENT ON TABLE recovery_codes IS 'Códigos de recuperación únicos por usuario para restablecer contraseña con A2F';
COMMENT ON COLUMN password_reset_tokens.recovery_method IS 'Método usado: email (futuro) o 2fa';

-- Fin de la migración
