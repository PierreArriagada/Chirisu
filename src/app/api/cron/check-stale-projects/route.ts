/**
 * @fileoverview CRON: Verificar proyectos de scan inactivos
 * 
 * Marca como "abandonados" los proyectos que no han sido actualizados en 90 días
 * y envía notificación al usuario para que actualice el estado.
 * 
 * Debe ejecutarse diariamente.
 * 
 * @usage
 * curl -X GET http://localhost:9002/api/cron/check-stale-projects \
 *   -H "Authorization: Bearer YOUR_CRON_SECRET"
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

const CRON_SECRET = process.env.CRON_SECRET;
const STALE_DAYS = 90; // 3 meses

export async function GET(req: NextRequest) {
  // Verificar autorización
  const authHeader = req.headers.get('authorization');
  
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    // Buscar proyectos activos que no han sido actualizados en 90 días
    const staleProjects = await pool.query(`
      SELECT 
        sp.id,
        sp.user_id,
        sp.media_type,
        sp.media_id,
        sp.group_name,
        sp.status,
        sp.updated_at,
        sp.last_chapter_at,
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
      WHERE sp.status = 'active'
        AND (
          sp.last_chapter_at IS NULL AND sp.updated_at < NOW() - INTERVAL '${STALE_DAYS} days'
          OR
          sp.last_chapter_at < NOW() - INTERVAL '${STALE_DAYS} days'
        )
    `);

    if (staleProjects.rows.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay proyectos inactivos para procesar',
        processed: 0
      });
    }

    const processedProjects = [];
    const notificationsSent = [];

    for (const project of staleProjects.rows) {
      try {
        // Marcar como abandonado
        await pool.query(`
          UPDATE app.scan_projects 
          SET status = 'dropped', updated_at = NOW()
          WHERE id = $1
        `, [project.id]);

        processedProjects.push(project.id);

        // Enviar notificación al usuario
        await pool.query(`
          INSERT INTO app.notifications (user_id, type, title, message, data)
          VALUES ($1, 'scan_project_stale', '⚠️ Proyecto marcado como abandonado', $2, $3)
        `, [
          project.user_id,
          `Tu proyecto "${project.group_name}" para "${project.media_title}" ha sido marcado como abandonado por inactividad de ${STALE_DAYS} días. Si aún estás trabajando en él, actualiza el estado.`,
          JSON.stringify({
            projectId: project.id,
            mediaType: project.media_type,
            mediaId: project.media_id,
            mediaTitle: project.media_title
          })
        ]);

        notificationsSent.push({
          userId: project.user_id,
          projectId: project.id
        });

      } catch (err) {
        console.error(`Error procesando proyecto ${project.id}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Procesados ${processedProjects.length} proyectos inactivos`,
      processed: processedProjects.length,
      projectIds: processedProjects,
      notificationsSent: notificationsSent.length
    });

  } catch (error) {
    console.error('Error en cron check-stale-projects:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno' 
    }, { status: 500 });
  }
}

// También permitir POST para compatibilidad con algunos servicios de cron
export async function POST(req: NextRequest) {
  return GET(req);
}
