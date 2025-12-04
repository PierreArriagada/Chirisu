/**
 * API ENDPOINT: GET /api/cron/check-abandoned-scans
 * 
 * Verifica proyectos de scanlation sin actualizar en 3 meses
 * y los marca como abandonados, notificando al dueño.
 * 
 * Debe ser llamado diariamente por un cronjob externo.
 * 
 * Seguridad:
 * - Token definido en variable de entorno CRON_SECRET
 * - Header requerido: Authorization: Bearer <CRON_SECRET>
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

const CRON_SECRET = process.env.CRON_SECRET || 'dev-cron-secret';
const MONTHS_UNTIL_ABANDONED = 3;

export async function GET(request: NextRequest) {
  // Verificar autorización
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (token !== CRON_SECRET) {
    return NextResponse.json(
      { error: 'No autorizado' },
      { status: 401 }
    );
  }

  try {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - MONTHS_UNTIL_ABANDONED);

    // Buscar proyectos activos o en pausa sin actualizar en 3 meses
    const abandonedProjects = await pool.query(`
      SELECT 
        sp.id,
        sp.user_id,
        sp.group_name,
        sp.media_type,
        sp.media_id,
        sp.status,
        sp.last_chapter_at,
        sp.updated_at,
        u.username,
        CASE sp.media_type
          WHEN 'anime' THEN (SELECT title_romaji FROM app.anime WHERE id = sp.media_id)
          WHEN 'manga' THEN (SELECT title_romaji FROM app.manga WHERE id = sp.media_id)
          WHEN 'manhwa' THEN (SELECT title_romaji FROM app.manhwa WHERE id = sp.media_id)
          WHEN 'manhua' THEN (SELECT title_romaji FROM app.manhua WHERE id = sp.media_id)
          WHEN 'donghua' THEN (SELECT title_romaji FROM app.donghua WHERE id = sp.media_id)
          WHEN 'novel' THEN (SELECT title_romaji FROM app.novels WHERE id = sp.media_id)
          WHEN 'fan_comic' THEN (SELECT title FROM app.fan_comics WHERE id = sp.media_id)
        END as media_title
      FROM app.scan_projects sp
      JOIN app.users u ON sp.user_id = u.id
      WHERE sp.status IN ('active', 'hiatus')
        AND COALESCE(sp.last_chapter_at, sp.updated_at) < $1
    `, [cutoffDate.toISOString()]);

    const projectsToAbandon = abandonedProjects.rows;
    let abandonedCount = 0;
    let notifiedCount = 0;

    for (const project of projectsToAbandon) {
      // Marcar como abandonado
      await pool.query(`
        UPDATE app.scan_projects 
        SET status = 'dropped', updated_at = NOW()
        WHERE id = $1
      `, [project.id]);
      abandonedCount++;

      // Crear notificación para el usuario
      await pool.query(`
        INSERT INTO app.user_notifications (user_id, type, title, message, data)
        VALUES ($1, 'scan_project_abandoned', 
          '⚠️ Proyecto marcado como abandonado',
          $2,
          $3
        )
      `, [
        project.user_id,
        `Tu proyecto "${project.group_name}" para "${project.media_title}" fue marcado como abandonado por inactividad (3 meses). Puedes cambiar el estado si continúas trabajando en él.`,
        JSON.stringify({
          projectId: project.id,
          mediaType: project.media_type,
          mediaId: project.media_id,
          groupName: project.group_name
        })
      ]);
      notifiedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Verificación completada`,
      stats: {
        projectsChecked: projectsToAbandon.length,
        projectsAbandoned: abandonedCount,
        notificationsSent: notifiedCount,
        cutoffDate: cutoffDate.toISOString()
      }
    });

  } catch (error) {
    console.error('Error en cron check-abandoned-scans:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// También permitir POST para compatibilidad con algunos servicios de cron
export async function POST(request: NextRequest) {
  return GET(request);
}
