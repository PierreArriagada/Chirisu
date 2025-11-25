-- ========================================
-- SCRIPT: Añadir ID de Seguimiento para Usuarios
-- ========================================
-- Este ID público y amigable permite identificar usuarios de forma única
-- para reportes, soporte técnico, y referencias sin exponer el ID interno.
--
-- Capacidad: 36^12 = 4.7 quintillones de combinaciones
-- Formato: 12 caracteres alfanuméricos (números + letras minúsculas)
-- Ejemplo: k8m3n2p9q5r7
-- ========================================

-- 1. Añadir la columna tracking_id a la tabla users
ALTER TABLE app.users 
ADD COLUMN IF NOT EXISTS tracking_id VARCHAR(12) UNIQUE;

-- 2. Crear índice para búsquedas rápidas por tracking_id
CREATE INDEX IF NOT EXISTS idx_users_tracking_id 
ON app.users(tracking_id);

-- 3. Función para generar tracking_id aleatorio (base36: 0-9, a-z)
CREATE OR REPLACE FUNCTION app.generate_tracking_id()
RETURNS VARCHAR(12) AS $$
DECLARE
    chars TEXT := '0123456789abcdefghijklmnopqrstuvwxyz';
    result TEXT := '';
    i INTEGER;
    random_index INTEGER;
BEGIN
    -- Generar 12 caracteres aleatorios
    FOR i IN 1..12 LOOP
        random_index := floor(random() * length(chars) + 1)::INTEGER;
        result := result || substr(chars, random_index, 1);
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 4. Función para generar tracking_id único (verifica que no exista)
CREATE OR REPLACE FUNCTION app.generate_unique_tracking_id()
RETURNS VARCHAR(12) AS $$
DECLARE
    new_id VARCHAR(12);
    max_attempts INTEGER := 10;
    attempt INTEGER := 0;
BEGIN
    LOOP
        new_id := app.generate_tracking_id();
        
        -- Verificar que no exista
        IF NOT EXISTS (SELECT 1 FROM app.users WHERE tracking_id = new_id) THEN
            RETURN new_id;
        END IF;
        
        attempt := attempt + 1;
        IF attempt >= max_attempts THEN
            RAISE EXCEPTION 'No se pudo generar un tracking_id único después de % intentos', max_attempts;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 5. Generar tracking_id para usuarios existentes
UPDATE app.users 
SET tracking_id = app.generate_unique_tracking_id()
WHERE tracking_id IS NULL;

-- 6. Crear trigger para asignar tracking_id automáticamente a nuevos usuarios
CREATE OR REPLACE FUNCTION app.assign_tracking_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.tracking_id IS NULL THEN
        NEW.tracking_id := app.generate_unique_tracking_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_assign_tracking_id ON app.users;

CREATE TRIGGER trigger_assign_tracking_id
    BEFORE INSERT ON app.users
    FOR EACH ROW
    EXECUTE FUNCTION app.assign_tracking_id();

-- 7. Hacer tracking_id NOT NULL ahora que todos tienen uno
ALTER TABLE app.users 
ALTER COLUMN tracking_id SET NOT NULL;

-- 8. Añadir comentarios
COMMENT ON COLUMN app.users.tracking_id IS 
'ID de seguimiento público de 12 caracteres alfanuméricos. Usado para identificación en reportes y soporte. Generado automáticamente y único.';

-- ========================================
-- VERIFICACIÓN
-- ========================================

-- Ver ejemplos de tracking_ids generados
SELECT id, username, tracking_id, email 
FROM app.users 
LIMIT 5;

-- Verificar unicidad
SELECT 
    COUNT(*) as total_usuarios,
    COUNT(DISTINCT tracking_id) as tracking_ids_unicos,
    CASE 
        WHEN COUNT(*) = COUNT(DISTINCT tracking_id) THEN '✓ Todos únicos'
        ELSE '✗ HAY DUPLICADOS!'
    END as estado
FROM app.users;

COMMENT ON FUNCTION app.generate_tracking_id() IS 
'Genera un ID de seguimiento aleatorio de 12 caracteres (base36: 0-9, a-z). Capacidad: 4.7 quintillones de combinaciones.';

COMMENT ON FUNCTION app.generate_unique_tracking_id() IS 
'Genera un tracking_id único verificando que no exista en la base de datos. Usado automáticamente al crear usuarios.';
