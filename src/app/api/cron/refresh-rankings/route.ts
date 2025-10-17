import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

/**
 * ============================================
 * API ENDPOINT: GET /api/cron/refresh-rankings
 * ============================================
 * 
 * Descripción:
 * Endpoint protegido para refrescar las vistas materializadas de rankings.
 * Debe ser llamado cada 5 horas por un cronjob externo (Vercel Cron, 
 * crontab, etc.) o manualmente desde el dashboard de admin.
 * 
 * Seguridad:
 * - Requiere header Authorization con token secreto
 * - Token definido en variable de entorno CRON_SECRET
 * 
 * Headers requeridos:
 * - Authorization: Bearer <CRON_SECRET>
 * 
 * Respuesta:
 * {
 *   "success": true,
 *   "message": "Rankings actualizados exitosamente",
 *   "timestamp": "2025-10-16T12:00:00Z",
 *   "duration_seconds": 3.5,
 *   "next_refresh": "2025-10-16T17:00:00Z"
 * }
 * 
 * Ejemplos de uso:
 * 
 * 1. Desde curl:
 * curl -X GET http://localhost:9002/api/cron/refresh-rankings \
 *   -H "Authorization: Bearer tu-token-secreto"
 * 
 * 2. Desde Vercel Cron (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/refresh-rankings",
 *     "schedule": "0 *\/5 * * *"
 *   }]
 * }
 * 
 * 3. Desde crontab (Linux/Mac):
 * 0 *\/5 * * * curl -X GET https://tu-dominio.com/api/cron/refresh-rankings \
 *   -H "Authorization: Bearer $CRON_SECRET" >> /var/log/rankings.log 2>&1
 * ============================================
 */

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // ============================================
    // SEGURIDAD: Verificar token
    // ============================================
    const authHeader = request.headers.get('authorization');
    const expectedToken = `Bearer ${process.env.CRON_SECRET}`;

    if (!process.env.CRON_SECRET) {
      console.error('⚠️ CRON_SECRET no está configurado en variables de entorno');
      return NextResponse.json(
        { 
          success: false,
          error: 'Configuración del servidor incorrecta' 
        },
        { status: 500 }
      );
    }

    if (authHeader !== expectedToken) {
      console.warn('🚫 Intento de acceso no autorizado al endpoint de refresh');
      return NextResponse.json(
        { 
          success: false,
          error: 'No autorizado' 
        },
        { status: 401 }
      );
    }

    // ============================================
    // EJECUTAR REFRESH
    // ============================================
    console.log('🔄 Iniciando refresh de rankings...');

    const result = await pool.query(
      'SELECT app.refresh_rankings_with_status() AS result'
    );

    const refreshResult = result.rows[0]?.result;
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`✅ Refresh completado en ${duration}s`);

    // ============================================
    // RESPUESTA
    // ============================================
    return NextResponse.json({
      ...refreshResult,
      api_duration_seconds: parseFloat(duration)
    });

  } catch (error: any) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.error('❌ Error al refrescar rankings:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Error al actualizar rankings',
        message: error?.message || 'Error desconocido',
        duration_seconds: parseFloat(duration),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * ============================================
 * MÉTODO POST: Refresh manual desde dashboard admin
 * ============================================
 * Permite a administradores forzar un refresh sin esperar las 5 horas
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verificar autenticación del usuario admin
    // TODO: Implementar verificación de sesión de usuario admin
    // Por ahora, usamos el mismo token que GET
    const authHeader = request.headers.get('authorization');
    const expectedToken = `Bearer ${process.env.CRON_SECRET}`;

    if (authHeader !== expectedToken) {
      return NextResponse.json(
        { 
          success: false,
          error: 'No autorizado. Solo administradores pueden ejecutar refresh manual.' 
        },
        { status: 401 }
      );
    }

    console.log('🔄 Refresh manual iniciado por administrador');

    // Ejecutar refresh incondicional (sin verificar las 5 horas)
    const result = await pool.query(
      'SELECT app.refresh_all_ranking_views(); SELECT TRUE AS success'
    );

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`✅ Refresh manual completado en ${duration}s`);

    return NextResponse.json({
      success: true,
      message: 'Refresh manual ejecutado exitosamente',
      timestamp: new Date().toISOString(),
      duration_seconds: parseFloat(duration),
      type: 'manual'
    });

  } catch (error: any) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.error('❌ Error en refresh manual:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Error al ejecutar refresh manual',
        message: error?.message || 'Error desconocido',
        duration_seconds: parseFloat(duration),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
