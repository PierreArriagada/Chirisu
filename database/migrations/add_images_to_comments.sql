-- ==========================================
-- MIGRACIÓN: Agregar soporte de imágenes a comentarios
-- ==========================================
-- Fecha: 2025-10-23
-- Descripción: Agrega columna para almacenar URLs de imágenes adjuntas
--              en los comentarios

-- Agregar columna para imágenes
ALTER TABLE app.comments 
ADD COLUMN IF NOT EXISTS images jsonb DEFAULT '[]'::jsonb;

-- Comentar la columna
COMMENT ON COLUMN app.comments.images IS 'Array de URLs de imágenes adjuntas al comentario en formato JSON. Máximo 4 imágenes por comentario.';

-- Crear índice para búsquedas de comentarios con imágenes
CREATE INDEX IF NOT EXISTS idx_comments_with_images 
ON app.comments ((jsonb_array_length(images) > 0)) 
WHERE deleted_at IS NULL;

-- Agregar constraint para limitar máximo de imágenes
ALTER TABLE app.comments 
ADD CONSTRAINT check_images_max_count 
CHECK (jsonb_array_length(images) <= 4);

COMMENT ON CONSTRAINT check_images_max_count ON app.comments IS 'Limita a máximo 4 imágenes por comentario';

-- ==========================================
-- Fin de migración
-- ==========================================
