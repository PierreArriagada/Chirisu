-- ============================================
-- MIGRACIÓN: Aumentar límite de role en staffable_staff
-- Fecha: 2025-11-01
-- Descripción: Algunos roles de staff son muy largos
-- ============================================

-- Aumentar límite de role en staffable_staff
ALTER TABLE app.staffable_staff
  ALTER COLUMN role TYPE character varying(255);

-- Verificar cambio
SELECT 
  table_name, 
  column_name, 
  data_type, 
  character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'app' 
  AND table_name = 'staffable_staff'
  AND column_name = 'role';

-- ============================================
-- FIN DE MIGRACIÓN
-- ============================================
