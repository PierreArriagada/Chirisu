-- Migración: Agregar tipo 'Unknown' al constraint de anime.type
-- Fecha: 2025-11-01
-- Motivo: Compatibilidad completa con MyAnimeList API (7 tipos totales)

-- Eliminar constraint existente
ALTER TABLE app.anime DROP CONSTRAINT IF EXISTS anime_type_check;

-- Crear nuevo constraint con tipo 'Unknown' incluido
ALTER TABLE app.anime ADD CONSTRAINT anime_type_check 
  CHECK (type IN ('TV', 'Movie', 'OVA', 'ONA', 'Special', 'Music', 'Unknown'));

-- Verificar el constraint actualizado
SELECT con.conname, pg_get_constraintdef(con.oid)
FROM pg_constraint con
WHERE con.conname = 'anime_type_check';
