-- ============================================
-- ALTERNATIVA SIN PG_CRON
-- Sistema de Rankings Optimizado para Hostings sin pg_cron
-- ============================================
-- Descripción: Esta versión es para hostings que no tienen pg_cron
-- disponible. En su lugar, debes llamar manualmente a la función
-- de refresh desde tu aplicación o un cronjob externo.
-- ============================================

SET search_path = app, public;

-- ============================================
-- OPCIÓN 1: API ENDPOINT PARA REFRESH MANUAL
-- ============================================

-- Crear función que devuelve JSON con el estado del refresh
CREATE OR REPLACE FUNCTION app.refresh_rankings_with_status()
RETURNS JSON AS $$
DECLARE
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    duration INTERVAL;
    result JSON;
BEGIN
    start_time := clock_timestamp();
    
    -- Ejecutar refresh
    PERFORM app.refresh_all_ranking_views();
    
    end_time := clock_timestamp();
    duration := end_time - start_time;
    
    -- Construir respuesta JSON
    result := json_build_object(
        'success', TRUE,
        'message', 'Rankings actualizados exitosamente',
        'timestamp', end_time,
        'duration_seconds', EXTRACT(EPOCH FROM duration),
        'next_refresh', end_time + INTERVAL '5 hours'
    );
    
    RETURN result;
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', FALSE,
        'message', 'Error al actualizar rankings',
        'error', SQLERRM,
        'timestamp', clock_timestamp()
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION app.refresh_rankings_with_status IS
'Refresca las vistas materializadas y devuelve JSON con el estado. Usar desde API endpoint.';

-- ============================================
-- OPCIÓN 2: TRIGGER PARA AUTO-REFRESH AL INSERTAR/ACTUALIZAR
-- ============================================

-- Tabla para controlar la última vez que se hizo refresh
CREATE TABLE IF NOT EXISTS app.ranking_refresh_log (
    id SERIAL PRIMARY KEY,
    refresh_type VARCHAR(20), -- 'auto' o 'manual'
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP,
    duration_seconds NUMERIC(10,2),
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    triggered_by VARCHAR(50) -- 'review_insert', 'list_item_insert', etc.
);

CREATE INDEX idx_ranking_refresh_log_completed ON app.ranking_refresh_log(completed_at DESC);

-- Función para verificar si necesita refresh (más de 5 horas desde último)
CREATE OR REPLACE FUNCTION app.needs_ranking_refresh()
RETURNS BOOLEAN AS $$
DECLARE
    last_refresh TIMESTAMP;
BEGIN
    SELECT MAX(completed_at) INTO last_refresh
    FROM app.ranking_refresh_log
    WHERE success = TRUE;
    
    -- Si nunca se ha hecho refresh o pasaron más de 5 horas
    IF last_refresh IS NULL OR last_refresh < NOW() - INTERVAL '5 hours' THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Función para hacer refresh condicional (solo si pasaron 5 horas)
CREATE OR REPLACE FUNCTION app.conditional_ranking_refresh(
    p_triggered_by VARCHAR DEFAULT 'manual'
)
RETURNS VOID AS $$
DECLARE
    log_id INTEGER;
    start_time TIMESTAMP;
    end_time TIMESTAMP;
BEGIN
    -- Verificar si necesita refresh
    IF NOT app.needs_ranking_refresh() THEN
        RAISE NOTICE 'Refresh no necesario aún. Última actualización: %', 
            (SELECT MAX(completed_at) FROM app.ranking_refresh_log WHERE success = TRUE);
        RETURN;
    END IF;
    
    -- Registrar inicio
    INSERT INTO app.ranking_refresh_log (refresh_type, started_at, triggered_by)
    VALUES ('auto', NOW(), p_triggered_by)
    RETURNING id INTO log_id;
    
    start_time := clock_timestamp();
    
    BEGIN
        -- Ejecutar refresh
        PERFORM app.refresh_all_ranking_views();
        
        end_time := clock_timestamp();
        
        -- Registrar éxito
        UPDATE app.ranking_refresh_log
        SET completed_at = end_time,
            duration_seconds = EXTRACT(EPOCH FROM (end_time - start_time)),
            success = TRUE
        WHERE id = log_id;
        
        RAISE NOTICE '✅ Refresh completado en % segundos', 
            EXTRACT(EPOCH FROM (end_time - start_time));
    EXCEPTION WHEN OTHERS THEN
        -- Registrar error
        UPDATE app.ranking_refresh_log
        SET completed_at = clock_timestamp(),
            success = FALSE,
            error_message = SQLERRM
        WHERE id = log_id;
        
        RAISE WARNING '❌ Error en refresh: %', SQLERRM;
    END;
END;
$$ LANGUAGE plpgsql;

-- Trigger para refresh automático cuando se inserta una review
CREATE OR REPLACE FUNCTION trg_review_maybe_refresh_rankings()
RETURNS TRIGGER AS $$
BEGIN
    -- Hacer refresh condicional en background (no bloqueante)
    PERFORM app.conditional_ranking_refresh('review_insert');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_review_refresh_rankings ON app.reviews;
CREATE TRIGGER trg_review_refresh_rankings
    AFTER INSERT ON app.reviews
    FOR EACH STATEMENT
    EXECUTE FUNCTION trg_review_maybe_refresh_rankings();

-- Trigger para refresh automático cuando se inserta un list_item
CREATE OR REPLACE FUNCTION trg_list_item_maybe_refresh_rankings()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM app.conditional_ranking_refresh('list_item_insert');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_list_item_refresh_rankings ON app.list_items;
CREATE TRIGGER trg_list_item_refresh_rankings
    AFTER INSERT ON app.list_items
    FOR EACH STATEMENT
    EXECUTE FUNCTION trg_list_item_maybe_refresh_rankings();

-- ============================================
-- OPCIÓN 3: ENDPOINT DE VERCEL/NETLIFY CRON
-- ============================================

/*
Si usas Vercel o Netlify, puedes crear un endpoint API y configurar
un cronjob en su plataforma:

1. Crear archivo: src/app/api/cron/refresh-rankings/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

export async function GET(request: NextRequest) {
  // Verificar token de seguridad
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await pool.query('SELECT app.refresh_rankings_with_status()');
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error en refresh de rankings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

2. En vercel.json:
{
  "crons": [{
    "path": "/api/cron/refresh-rankings",
    "schedule": "0 */5 * * *"
  }]
}

3. En .env:
CRON_SECRET=tu-token-secreto-aqui
*/

-- ============================================
-- OPCIÓN 4: SCRIPT EXTERNO CON CURL
-- ============================================

/*
Si prefieres un cronjob en tu servidor Linux/Mac, puedes usar crontab:

1. Crear script: refresh-rankings.sh

#!/bin/bash
PGPASSWORD='tu_password' psql -U postgres -d bd_chirisu -c "SELECT app.refresh_rankings_with_status();"

2. Hacer ejecutable:
chmod +x refresh-rankings.sh

3. Agregar a crontab:
crontab -e

# Agregar esta línea (ejecuta cada 5 horas):
0 */5 * * * /ruta/al/script/refresh-rankings.sh >> /var/log/chirisu-rankings.log 2>&1

4. Verificar logs:
tail -f /var/log/chirisu-rankings.log
*/

-- ============================================
-- VERIFICACIÓN Y TESTING
-- ============================================

-- Ver log de refreshes
SELECT 
    id,
    refresh_type,
    started_at,
    completed_at,
    duration_seconds,
    success,
    triggered_by
FROM app.ranking_refresh_log
ORDER BY started_at DESC
LIMIT 10;

-- Ver si necesita refresh
SELECT 
    app.needs_ranking_refresh() AS needs_refresh,
    (SELECT MAX(completed_at) FROM app.ranking_refresh_log WHERE success = TRUE) AS last_successful_refresh,
    NOW() - (SELECT MAX(completed_at) FROM app.ranking_refresh_log WHERE success = TRUE) AS time_since_last_refresh;

-- Test manual del refresh
SELECT app.refresh_rankings_with_status();

-- ============================================
-- LIMPIEZA DE LOGS (OPCIONAL)
-- ============================================

-- Función para limpiar logs antiguos (mantener últimos 30 días)
CREATE OR REPLACE FUNCTION app.cleanup_ranking_refresh_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM app.ranking_refresh_log
    WHERE started_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RAISE NOTICE 'Eliminados % logs antiguos', deleted_count;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Ejecutar limpieza (llamar mensualmente)
-- SELECT app.cleanup_ranking_refresh_logs();

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
