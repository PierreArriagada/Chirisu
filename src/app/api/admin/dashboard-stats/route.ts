import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { pool } from '@/lib/database';

/**
 * GET /api/admin/dashboard-stats
 * Obtiene estadísticas generales del sistema para el dashboard del administrador
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const cookieStore = await cookies();
    const token = cookieStore.get('chirisu_session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    
    if (!payload || !payload.isAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Ejecutar todas las consultas en paralelo para mejor rendimiento
    const [
      totalUsersResult,
      activeUsersResult,
      newUsersWeekResult,
      newUsersMonthResult,
      pendingContributionsResult,
      totalContributionsResult,
      animeCountResult,
      mangaCountResult,
      novelsCountResult,
      donghuaCountResult,
      manhuaCountResult,
      manhwaCountResult,
      fanComicCountResult,
      recentActivityResult
    ] = await Promise.all([
      // Total de usuarios
      pool.query(`SELECT COUNT(*) as total FROM app.users WHERE deleted_at IS NULL`),
      
      // Usuarios activos en los últimos 30 días
      pool.query(`
        SELECT COUNT(DISTINCT user_id) as total 
        FROM app.user_contributions 
        WHERE created_at >= NOW() - INTERVAL '30 days'
      `),
      
      // Nuevos usuarios en los últimos 7 días
      pool.query(`
        SELECT COUNT(*) as total 
        FROM app.users 
        WHERE created_at >= NOW() - INTERVAL '7 days' 
        AND deleted_at IS NULL
      `),
      
      // Nuevos usuarios en los últimos 30 días
      pool.query(`
        SELECT COUNT(*) as total 
        FROM app.users 
        WHERE created_at >= NOW() - INTERVAL '30 days' 
        AND deleted_at IS NULL
      `),
      
      // Contribuciones pendientes
      pool.query(`
        SELECT COUNT(*) as total 
        FROM app.content_contributions 
        WHERE status = 'pending' 
        AND deleted_at IS NULL
      `),
      
      // Total de contribuciones
      pool.query(`
        SELECT COUNT(*) as total 
        FROM app.content_contributions 
        WHERE deleted_at IS NULL
      `),
      
      // Conteo por tipo de contenido
      pool.query(`SELECT COUNT(*) as total FROM app.anime`),
      pool.query(`SELECT COUNT(*) as total FROM app.manga`),
      pool.query(`SELECT COUNT(*) as total FROM app.novels`),
      pool.query(`SELECT COUNT(*) as total FROM app.donghua`),
      pool.query(`SELECT COUNT(*) as total FROM app.manhua`),
      pool.query(`SELECT COUNT(*) as total FROM app.manhwa`),
      pool.query(`SELECT COUNT(*) as total FROM app.fan_comics`),
      
      // Actividad reciente (últimas 20 contribuciones, reportes, etc.)
      pool.query(`
        (
          SELECT 
            'contribution' as type,
            created_at as date,
            'Nueva contribución de ' || u.display_name || ' para ' || contributable_type as description
          FROM app.content_contributions cc
          JOIN app.users u ON cc.contributor_user_id = u.id
          WHERE cc.deleted_at IS NULL
          ORDER BY created_at DESC
          LIMIT 10
        )
        UNION ALL
        (
          SELECT 
            'report' as type,
            created_at as date,
            'Nuevo reporte de ' || u.display_name || ' sobre ' || reportable_type as description
          FROM app.content_reports cr
          JOIN app.users u ON cr.reported_by = u.id
          ORDER BY created_at DESC
          LIMIT 10
        )
        ORDER BY date DESC
        LIMIT 20
      `)
    ]);

    // Construir respuesta
    const stats = {
      totalUsers: parseInt(totalUsersResult.rows[0]?.total || '0'),
      activeUsers: parseInt(activeUsersResult.rows[0]?.total || '0'),
      newUsersWeek: parseInt(newUsersWeekResult.rows[0]?.total || '0'),
      newUsersMonth: parseInt(newUsersMonthResult.rows[0]?.total || '0'),
      pendingContributions: parseInt(pendingContributionsResult.rows[0]?.total || '0'),
      totalContributions: parseInt(totalContributionsResult.rows[0]?.total || '0'),
      contentByType: {
        anime: parseInt(animeCountResult.rows[0]?.total || '0'),
        manga: parseInt(mangaCountResult.rows[0]?.total || '0'),
        novels: parseInt(novelsCountResult.rows[0]?.total || '0'),
        donghua: parseInt(donghuaCountResult.rows[0]?.total || '0'),
        manhua: parseInt(manhuaCountResult.rows[0]?.total || '0'),
        manhwa: parseInt(manhwaCountResult.rows[0]?.total || '0'),
        fan_comic: parseInt(fanComicCountResult.rows[0]?.total || '0'),
      },
      recentActivity: recentActivityResult.rows.map(row => ({
        type: row.type,
        date: row.date,
        description: row.description,
      }))
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error en GET /api/admin/dashboard-stats:', error);
    return NextResponse.json(
      { error: 'Error al cargar estadísticas' },
      { status: 500 }
    );
  }
}
