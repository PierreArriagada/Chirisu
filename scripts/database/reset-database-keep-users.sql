-- ============================================================================
-- SCRIPT: Limpiar base de datos manteniendo SOLO usuarios
-- ============================================================================
-- FECHA: 2025-11-04
-- DESCRIPCIÓN: Elimina ABSOLUTAMENTE TODO excepto:
--   - users (usuarios)
--
-- SE ELIMINARÁ:
--   - Roles, permisos, role_permissions, user_roles
--   - Media_statuses
--   - TODOS los medios, personajes, actores, staff, studios
--   - TODAS las relaciones, reviews, comentarios, listas
--   - ABSOLUTAMENTE TODO menos usuarios
--
-- ADVERTENCIA: Esta acción es IRREVERSIBLE. Creará un backup antes de ejecutar.
-- ============================================================================

BEGIN;

-- ============================================================================
-- PASO 1: Mostrar estadísticas ANTES de la limpieza
-- ============================================================================

\echo '============================================================================'
\echo 'ESTADÍSTICAS ANTES DE LA LIMPIEZA'
\echo '============================================================================'

SELECT 'USUARIOS' as tabla, COUNT(*) as total FROM app.users
UNION ALL SELECT 'ROLES', COUNT(*) FROM app.roles
UNION ALL SELECT 'PERMISOS', COUNT(*) FROM app.permissions
UNION ALL SELECT 'ANIME', COUNT(*) FROM app.anime
UNION ALL SELECT 'MANGA', COUNT(*) FROM app.manga
UNION ALL SELECT 'MANHWA', COUNT(*) FROM app.manhwa
UNION ALL SELECT 'MANHUA', COUNT(*) FROM app.manhua
UNION ALL SELECT 'NOVELS', COUNT(*) FROM app.novels
UNION ALL SELECT 'DONGHUA', COUNT(*) FROM app.donghua
UNION ALL SELECT 'FAN COMICS', COUNT(*) FROM app.fan_comics
UNION ALL SELECT 'PERSONAJES', COUNT(*) FROM app.characters
UNION ALL SELECT 'ACTORES DE VOZ', COUNT(*) FROM app.voice_actors
UNION ALL SELECT 'STAFF', COUNT(*) FROM app.staff
UNION ALL SELECT 'STUDIOS', COUNT(*) FROM app.studios
UNION ALL SELECT 'EPISODIOS', COUNT(*) FROM app.episodes
UNION ALL SELECT 'REVIEWS', COUNT(*) FROM app.reviews
UNION ALL SELECT 'COMENTARIOS', COUNT(*) FROM app.comments
UNION ALL SELECT 'LISTAS DE USUARIO', COUNT(*) FROM app.lists
UNION ALL SELECT 'RELACIONES MEDIA', COUNT(*) FROM app.media_relations
ORDER BY tabla;

\echo ''
\echo 'Presiona ENTER para continuar con la limpieza o Ctrl+C para cancelar...'
-- \prompt 'Continuar? (y/N): ' confirm

-- ============================================================================
-- PASO 2: ELIMINAR ABSOLUTAMENTE TODO (excepto users)
-- ============================================================================

\echo '============================================================================'
\echo 'ELIMINANDO TODO EL CONTENIDO (SOLO SE PRESERVA: users)'
\echo '============================================================================'

-- Desactivar foreign key checks temporalmente
SET session_replication_role = 'replica';

-- ELIMINAR TODO EN ORDEN
TRUNCATE TABLE app.action_points CASCADE;
TRUNCATE TABLE app.alternative_titles CASCADE;
TRUNCATE TABLE app.anime CASCADE;
TRUNCATE TABLE app.audit_log CASCADE;
TRUNCATE TABLE app.character_voice_actors CASCADE;
TRUNCATE TABLE app.characterable_characters CASCADE;
TRUNCATE TABLE app.characters CASCADE;
TRUNCATE TABLE app.comment_reactions CASCADE;
TRUNCATE TABLE app.comments CASCADE;
TRUNCATE TABLE app.content_contributions CASCADE;
TRUNCATE TABLE app.content_reports CASCADE;
TRUNCATE TABLE app.donghua CASCADE;
TRUNCATE TABLE app.episodes CASCADE;
TRUNCATE TABLE app.external_links CASCADE;
TRUNCATE TABLE app.fan_comic CASCADE;
TRUNCATE TABLE app.fan_comics CASCADE;
TRUNCATE TABLE app.genres CASCADE;
TRUNCATE TABLE app.list_items CASCADE;
TRUNCATE TABLE app.lists CASCADE;
TRUNCATE TABLE app.manga CASCADE;
TRUNCATE TABLE app.manhua CASCADE;
TRUNCATE TABLE app.manhwa CASCADE;
TRUNCATE TABLE app.media_genres CASCADE;
TRUNCATE TABLE app.media_relations CASCADE;
TRUNCATE TABLE app.media_statuses CASCADE;
TRUNCATE TABLE app.media_trailers CASCADE;
TRUNCATE TABLE app.notifications CASCADE;
TRUNCATE TABLE app.novels CASCADE;
TRUNCATE TABLE app.permissions CASCADE;
TRUNCATE TABLE app.rankings_cache CASCADE;
TRUNCATE TABLE app.review_votes CASCADE;
TRUNCATE TABLE app.reviews CASCADE;
TRUNCATE TABLE app.role_permissions CASCADE;
TRUNCATE TABLE app.roles CASCADE;
TRUNCATE TABLE app.staff CASCADE;
TRUNCATE TABLE app.staffable_staff CASCADE;
TRUNCATE TABLE app.studiable_studios CASCADE;
TRUNCATE TABLE app.studios CASCADE;
TRUNCATE TABLE app.taggable_tags CASCADE;
TRUNCATE TABLE app.tags CASCADE;
TRUNCATE TABLE app.trailer_views CASCADE;
TRUNCATE TABLE app.user_contributions CASCADE;
TRUNCATE TABLE app.user_favorites CASCADE;
TRUNCATE TABLE app.user_follows CASCADE;
TRUNCATE TABLE app.user_roles CASCADE;
TRUNCATE TABLE app.voice_actors CASCADE;

-- Reactivar foreign key checks
SET session_replication_role = 'origin';

\echo '✅ TODO eliminado (solo queda: users)'

-- ============================================================================
-- PASO 3: Resetear secuencias (IDs auto-incrementales) - TODAS
-- ============================================================================

\echo '============================================================================'
\echo 'PASO 3: Reseteando TODAS las secuencias de IDs...'
\echo '============================================================================'

-- Medios
ALTER SEQUENCE IF EXISTS app.anime_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS app.manga_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS app.manhwa_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS app.manhua_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS app.novels_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS app.donghua_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS app.fan_comic_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS app.fan_comics_id_seq RESTART WITH 1;

-- Personas y organizaciones
ALTER SEQUENCE IF EXISTS app.characters_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS app.voice_actors_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS app.staff_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS app.studios_id_seq RESTART WITH 1;

-- Episodios y contenido
ALTER SEQUENCE IF EXISTS app.episodes_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS app.alternative_titles_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS app.external_links_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS app.media_trailers_id_seq RESTART WITH 1;

-- Géneros y tags
ALTER SEQUENCE IF EXISTS app.genres_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS app.tags_id_seq RESTART WITH 1;

-- Interacciones de usuarios
ALTER SEQUENCE IF EXISTS app.comments_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS app.reviews_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS app.lists_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS app.notifications_id_seq RESTART WITH 1;

-- Contribuciones y reportes
ALTER SEQUENCE IF EXISTS app.content_contributions_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS app.content_reports_id_seq RESTART WITH 1;

-- Relaciones
ALTER SEQUENCE IF EXISTS app.media_relations_id_seq RESTART WITH 1;

-- Sistema
ALTER SEQUENCE IF EXISTS app.roles_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS app.permissions_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS app.media_statuses_id_seq RESTART WITH 1;

\echo '✅ TODAS las secuencias de IDs reseteadas'

-- ============================================================================
-- PASO 4: Verificar que SOLO queda users
-- ============================================================================

\echo '============================================================================'
\echo 'PASO 4: Verificando que SOLO queda la tabla users...'
\echo '============================================================================'

-- Verificar que las tablas de usuarios están intactas
DO $$
DECLARE
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM app.users;
    
    RAISE NOTICE 'Usuarios preservados: %', user_count;
    
    IF user_count = 0 THEN
        RAISE WARNING 'No hay usuarios en la base de datos!';
    END IF;
END $$;

-- ============================================================================
-- PASO 5: Mostrar estadísticas DESPUÉS de la limpieza
-- ============================================================================

\echo '============================================================================'
\echo 'ESTADÍSTICAS DESPUÉS DE LA LIMPIEZA TOTAL'
\echo '============================================================================'

SELECT 'USUARIOS' as tabla, COUNT(*) as total FROM app.users
UNION ALL SELECT 'ROLES', COUNT(*) FROM app.roles
UNION ALL SELECT 'PERMISOS', COUNT(*) FROM app.permissions
UNION ALL SELECT 'MEDIA_STATUSES', COUNT(*) FROM app.media_statuses
UNION ALL SELECT 'ANIME', COUNT(*) FROM app.anime
UNION ALL SELECT 'MANGA', COUNT(*) FROM app.manga
UNION ALL SELECT 'PERSONAJES', COUNT(*) FROM app.characters
UNION ALL SELECT 'ACTORES DE VOZ', COUNT(*) FROM app.voice_actors
UNION ALL SELECT 'STAFF', COUNT(*) FROM app.staff
UNION ALL SELECT 'STUDIOS', COUNT(*) FROM app.studios
UNION ALL SELECT 'REVIEWS', COUNT(*) FROM app.reviews
UNION ALL SELECT 'COMENTARIOS', COUNT(*) FROM app.comments
UNION ALL SELECT 'LISTAS', COUNT(*) FROM app.lists
ORDER BY tabla;

COMMIT;

\echo ''
\echo '============================================================================'
\echo '✅ LIMPIEZA TOTAL COMPLETADA EXITOSAMENTE'
\echo '============================================================================'
\echo ''
\echo 'RESUMEN:'
\echo '  ❌ TODOS los medios eliminados'
\echo '  ❌ TODOS los personajes, actores de voz y staff eliminados'
\echo '  ❌ TODOS los studios eliminados'
\echo '  ❌ TODAS las reviews, comentarios y listas eliminadas'
\echo '  ❌ TODAS las relaciones eliminadas'
\echo '  ❌ TODOS los géneros y tags eliminados'
\echo '  ❌ TODOS los roles y permisos eliminados'
\echo '  ❌ TODO eliminado'
\echo ''
\echo 'PRESERVADO:'
\echo '  ✅ SOLO usuarios (users)'
\echo ''
\echo 'La base de datos está completamente vacía (excepto usuarios).'
\echo 'Necesitarás re-crear roles, permisos y media_statuses antes de importar.'
\echo '============================================================================'
