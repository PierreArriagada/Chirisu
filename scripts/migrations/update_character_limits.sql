-- ============================================
-- MIGRACIÓN: Aumentar límites de caracteres
-- Fecha: 2025-11-01
-- Descripción: Actualizar límites de campos que causan errores de truncado
-- ============================================

-- 1. Tabla characters
ALTER TABLE app.characters
  ALTER COLUMN gender TYPE character varying(50),
  ALTER COLUMN age TYPE character varying(50),
  ALTER COLUMN blood_type TYPE character varying(10);

-- 2. Tabla voice_actors
ALTER TABLE app.voice_actors
  ALTER COLUMN gender TYPE character varying(50),
  ALTER COLUMN blood_type TYPE character varying(10);

-- 3. Tabla staff (si tiene campos similares)
ALTER TABLE app.staff
  ALTER COLUMN gender TYPE character varying(50);

-- Verificar cambios
SELECT 
  table_name, 
  column_name, 
  data_type, 
  character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'app' 
  AND table_name IN ('characters', 'voice_actors', 'staff')
  AND column_name IN ('gender', 'age', 'blood_type')
ORDER BY table_name, column_name;

-- ============================================
-- FIN DE MIGRACIÓN
-- ============================================
