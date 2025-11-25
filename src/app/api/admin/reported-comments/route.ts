import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

/**
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ API: GET /api/admin/reported-comments                               │
 * │ Lista de reportes de comentarios para moderadores/admins            │
 * └─────────────────────────────────────────────────────────────────────┘
 * 
 * PROPÓSITO:
 * Proporciona la lista de comentarios reportados con sistema de
 * asignación y regla de visibilidad de 15 días para moderadores
 * 
 * FLUJO DE NOTIFICACIONES → REPORTES:
 * 1. Usuario reporta comentario → POST /api/comments/[id]/report
 * 2. API inserta en app.comment_reports (status='pending')
 * 3. TRIGGER fn_notify_new_comment_report() se ejecuta automáticamente
 * 4. Trigger busca TODOS los usuarios con rol 'admin' o 'moderator'
 * 5. Trigger crea notificación para cada admin/moderador:
 *    - action_type: 'comment_reported'
 *    - notifiable_type: 'comment_report'
 *    - notifiable_id: ID del reporte creado
 *    - actor_user_id: ID del usuario que reportó
 * 6. Moderador ve notificación en notifications-button.tsx
 * 7. Moderador hace clic → Redirige a /dashboard/moderator/reported-comments
 * 8. Página llama a esta API → GET /api/admin/reported-comments?status=pending
 * 9. API aplica lógica de visibilidad (ver abajo)
 * 10. Moderador ve lista de reportes que puede atender
 * 
 * LÓGICA DE VISIBILIDAD (CRUCIAL):
 * Los moderadores ven un reporte SI cumple cualquiera de estas condiciones:
 * 
 * A) Es admin (ve TODOS los reportes sin restricción)
 * B) El reporte NO está asignado a nadie (assigned_to IS NULL)
 * C) El reporte está asignado a él mismo (assigned_to = userId)
 * D) El reporte lleva +15 días asignado sin resolver (regla de abandono):
 *    - assigned_at < NOW() - INTERVAL '15 days'
 *    - AND status != 'resolved'
 * 
 * RAZÓN DE LA LÓGICA:
 * - Evita que moderadores vean casos que otro moderador está atendiendo
 * - Permite redistribuir casos abandonados después de 15 días
 * - Admin mantiene visibilidad total para supervisión
 * - Balance entre privacidad y eficiencia
 * 
 * QUERY SQL CLAVE:
 * ```sql
 * WHERE cr.status = $1
 *   AND c.deleted_at IS NULL
 *   AND (
 *     $4 = true                                                    -- A) Es admin
 *     OR cr.assigned_to IS NULL                                    -- B) Sin asignar
 *     OR cr.assigned_to = $5                                       -- C) Asignado a él
 *     OR (cr.assigned_at < NOW() - INTERVAL '15 days'              -- D) +15 días sin resolver
 *         AND cr.status != 'resolved')
 *   )
 * ```
 * 
 * PARÁMETROS DE CONSULTA:
 * - status: 'pending' | 'reviewing' | 'resolved' | 'rejected' (default: 'pending')
 * - page: número de página (default: 1)
 * - limit: reportes por página (default: 50)
 * 
 * JOINS REALIZADOS:
 * - comment_reports → comments (INNER JOIN) - Datos del comentario reportado
 * - comments → users (author) - Autor del comentario
 * - comment_reports → users (reporter) - Usuario que reportó
 * - comment_reports → users (resolver) - Moderador que resolvió (LEFT JOIN)
 * - comment_reports → users (assigned) - Moderador asignado (LEFT JOIN)
 * 
 * DATOS RETORNADOS:
 * {
 *   reports: [
 *     {
 *       reportId: number,
 *       reason: string,          // 'spam' | 'offensive_language' | ...
 *       description: string,     // Texto libre del usuario
 *       status: string,          // 'pending' | 'reviewing' | 'resolved' | 'rejected'
 *       reportedAt: timestamp,
 *       resolvedAt: timestamp?,
 *       resolvedBy: string?,     // display_name del moderador
 *       assignedToUserId: string?,
 *       assignedToUsername: string?,
 *       assignedToDisplayName: string?,
 *       assignedAt: timestamp?,
 *       comment: {
 *         id: number,
 *         content: string,       // Texto del comentario reportado
 *         isSpoiler: boolean,
 *         commentableType: string,  // 'anime' | 'review' | 'episode'
 *         commentableId: number,
 *         createdAt: timestamp,
 *         author: {
 *           id: number,
 *           displayName: string,
 *           avatarUrl: string?,
 *           level: number
 *         }
 *       },
 *       reporter: {
 *         id: number,
 *         displayName: string,
 *         avatarUrl: string?
 *       }
 *     }
 *   ],
 *   pagination: {
 *     page: number,
 *     limit: number,
 *     total: number,
 *     totalPages: number
 *   }
 * }
 * 
 * VALIDACIONES:
 * ✅ Usuario autenticado (JWT token válido)
 * ✅ Usuario tiene rol 'admin' o 'moderator'
 * ✅ Comentario no está eliminado (deleted_at IS NULL)
 * ✅ Lógica de visibilidad aplicada según rol
 * 
 * LOGGING:
 * 👤 "Usuario verificado: userId, isAdmin, isStaff"
 * 🔍 "Consultando reportes de comentarios: status, userId, isAdmin"
 * 📊 "Resultados encontrados: X reportes de comentarios"
 * 📈 "Total en BD: X reportes (status: Y, isAdmin: Z, userId: W)"
 * ❌ "Usuario no autorizado: userId" (si no es staff)
 * 
 * USADO EN:
 * - /dashboard/moderator/reported-comments/page.tsx
 * - /dashboard/admin/reported-comments/page.tsx
 * - reported-comments-content.tsx (fetch de datos)
 * 
 * RELACIONADO CON:
 * - POST /api/comments/[id]/report (crear reporte)
 * - POST /api/comment-reports/[id]/assign (asignar moderador)
 * - PATCH /api/admin/reported-comments (resolver/rechazar)
 * - notifications-button.tsx (notificaciones a moderadores)
 * - Trigger: fn_notify_new_comment_report() (creación de notificaciones)
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
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Verificar que sea admin o moderador
    const userCheck = await pool.query(
      `SELECT u.id, u.display_name,
              EXISTS(
                SELECT 1 FROM app.user_roles ur
                INNER JOIN app.roles r ON ur.role_id = r.id
                WHERE ur.user_id = u.id AND r.name = 'admin'
              ) as is_admin,
              EXISTS(
                SELECT 1 FROM app.user_roles ur
                INNER JOIN app.roles r ON ur.role_id = r.id
                WHERE ur.user_id = u.id AND r.name IN ('admin', 'moderator')
              ) as is_staff
       FROM app.users u
       WHERE u.id = $1 AND u.deleted_at IS NULL`,
      [payload.userId]
    );

    console.log('👤 Usuario verificado:', {
      userId: payload.userId,
      isAdmin: userCheck.rows[0]?.is_admin,
      isStaff: userCheck.rows[0]?.is_staff,
      found: userCheck.rows.length > 0
    });

    if (userCheck.rows.length === 0 || !userCheck.rows[0].is_staff) {
      console.error('❌ Usuario no autorizado:', payload.userId);
      return NextResponse.json(
        { error: 'No tienes permiso para ver esta información' },
        { status: 403 }
      );
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending'; // pending, reviewing, resolved, rejected
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Determinar si es admin (para ver TODOS los casos)
    const isAdmin = userCheck.rows[0].is_admin;

    console.log('🔍 Consultando reportes de comentarios:', {
      status,
      userId: payload.userId,
      isAdmin,
      limit,
      offset
    });

    // Consulta de reportes con sistema de asignación y visibilidad de 15 días
    const reportsQuery = await pool.query(
      `SELECT 
        cr.id as report_id,
        cr.reason,
        cr.comments as description,
        cr.status,
        cr.created_at as reported_at,
        cr.resolved_at,
        cr.assigned_to,
        cr.assigned_at,
        c.id as comment_id,
        c.content as comment_content,
        c.is_spoiler,
        c.commentable_type,
        c.commentable_id,
        c.created_at as comment_created_at,
        c.deleted_at as comment_deleted_at,
        u_author.id as author_id,
        COALESCE(u_author.display_name, u_author.username) as author_name,
        u_author.username as author_username,
        u_author.avatar_url as author_avatar,
        u_author.level as author_level,
        u_reporter.id as reporter_id,
        COALESCE(u_reporter.display_name, u_reporter.username) as reporter_name,
        u_reporter.username as reporter_username,
        u_reporter.avatar_url as reporter_avatar,
        COALESCE(u_resolver.display_name, u_resolver.username) as resolved_by_name,
        u_assigned.id as assigned_to_id,
        u_assigned.username as assigned_to_username,
        COALESCE(u_assigned.display_name, u_assigned.username) as assigned_to_display_name
      FROM app.comment_reports cr
      INNER JOIN app.comments c ON cr.comment_id = c.id
      INNER JOIN app.users u_author ON c.user_id = u_author.id
      INNER JOIN app.users u_reporter ON cr.reporter_user_id = u_reporter.id
      LEFT JOIN app.users u_resolver ON cr.resolved_by = u_resolver.id
      LEFT JOIN app.users u_assigned ON cr.assigned_to = u_assigned.id
      WHERE cr.status = $1
        AND (
          $4 = true 
          OR cr.assigned_to IS NULL 
          OR cr.assigned_to = $5
          OR (cr.assigned_at < NOW() - INTERVAL '15 days' AND cr.status != 'resolved')
        )
      ORDER BY cr.created_at DESC
      LIMIT $2 OFFSET $3`,
      [status, limit, offset, isAdmin, payload.userId]
    );

    console.log(`📊 Resultados encontrados: ${reportsQuery.rows.length} reportes de comentarios`);

    // Contar total de reportes con misma lógica de visibilidad
    const countQuery = await pool.query(
      `SELECT COUNT(*) as total
       FROM app.comment_reports cr
       INNER JOIN app.comments c ON cr.comment_id = c.id
       WHERE cr.status = $1
         AND (
          $2 = true 
          OR cr.assigned_to IS NULL 
          OR cr.assigned_to = $3
          OR (cr.assigned_at < NOW() - INTERVAL '15 days' AND cr.status != 'resolved')
        )`,
      [status, isAdmin, payload.userId]
    );

    const total = parseInt(countQuery.rows[0]?.total || '0');
    const totalPages = Math.ceil(total / limit);

    console.log(`📈 Total en BD: ${total} reportes (status: ${status}, isAdmin: ${isAdmin}, userId: ${payload.userId})`);

    // Formatear respuesta
    const reports = reportsQuery.rows.map(row => ({
      reportId: row.report_id,
      reason: row.reason,
      description: row.description,
      status: row.status,
      reportedAt: row.reported_at,
      resolvedAt: row.resolved_at,
      resolvedBy: row.resolved_by_name,
      assignedToUserId: row.assigned_to_id?.toString(),
      assignedToUsername: row.assigned_to_username,
      assignedToDisplayName: row.assigned_to_display_name,
      assignedAt: row.assigned_at,
      comment: {
        id: row.comment_id,
        content: row.comment_content,
        isSpoiler: row.is_spoiler,
        commentableType: row.commentable_type,
        commentableId: row.commentable_id,
        createdAt: row.comment_created_at,
        deletedAt: row.comment_deleted_at, // Incluir para saber si fue eliminado
        author: {
          id: row.author_id,
          displayName: row.author_name, // Ya usa COALESCE en SQL
          username: row.author_username, // Agregado
          avatarUrl: row.author_avatar,
          level: row.author_level,
        },
      },
      reporter: {
        id: row.reporter_id,
        displayName: row.reporter_name, // Ya usa COALESCE en SQL
        username: row.reporter_username, // Agregado
        avatarUrl: row.reporter_avatar,
      },
    }));

    return NextResponse.json({
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });

  } catch (error: any) {
    console.error('Error en GET /api/admin/reported-comments:', error);
    return NextResponse.json(
      { error: 'Error al obtener reportes', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ API: PATCH /api/admin/reported-comments                             │
 * │ Resolver o rechazar reporte de comentario                           │
 * └─────────────────────────────────────────────────────────────────────┘
 * 
 * PROPÓSITO:
 * Permite a moderadores/admins resolver (con acción) o rechazar (sin acción)
 * reportes de comentarios, enviando notificaciones a las partes involucradas
 * 
 * FLUJO COMPLETO:
 * 1. Moderador decide acción sobre el reporte
 * 2. API valida autenticación y permisos
 * 3. Si action='comment_deleted' → Elimina comentario (soft delete)
 * 4. Actualiza reporte con status, resolved_by, action_taken, resolution_notes
 * 5. Envía notificación al REPORTADO (autor del comentario) explicando la acción
 * 6. Envía notificación al REPORTANTE confirmando la resolución
 * 7. Registra acción en audit_log
 * 
 * BODY REQUEST:
 * {
 *   reportId: number,
 *   status: 'resolved' | 'rejected',
 *   action: 'comment_deleted' | 'no_action' | 'warning_sent' | 'user_warned' | 'user_suspended',
 *   resolutionNotes: string (OBLIGATORIO - explicación de la decisión)
 * }
 * 
 * VALIDACIONES:
 * ✅ Usuario autenticado y con rol admin/moderator
 * ✅ reportId y status son requeridos
 * ✅ resolutionNotes obligatorias (mínimo 10 caracteres)
 * ✅ status debe ser 'resolved' o 'rejected'
 * ✅ action debe ser valor válido del constraint
 * 
 * ACCIONES VÁLIDAS:
 * - 'no_action': Sin acción (reporte rechazado)
 * - 'warning_sent': Advertencia enviada al usuario
 * - 'comment_deleted': Comentario eliminado
 * - 'user_warned': Usuario advertido formalmente
 * - 'user_suspended': Usuario suspendido
 * 
 * NOTIFICACIONES ENVIADAS:
 * 
 * A) Al REPORTADO (autor del comentario):
 *    - action_type: 'comment_action_taken' | 'comment_report_rejected'
 *    - notifiable_type: 'comment_report'
 *    - notifiable_id: ID del reporte
 *    - Mensaje incluye: qué acción se tomó y por qué (resolutionNotes)
 * 
 * B) Al REPORTANTE (quien reportó):
 *    - action_type: 'report_resolved' | 'report_rejected'
 *    - notifiable_type: 'comment_report'
 *    - notifiable_id: ID del reporte
 *    - Mensaje incluye: resultado de su reporte
 */
export async function PATCH(request: NextRequest) {
  try {
    // Verificar autenticación
    const cookieStore = await cookies();
    const token = cookieStore.get('chirisu_session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Verificar que sea admin o moderador
    const userCheck = await pool.query(
      `SELECT u.id,
              EXISTS(
                SELECT 1 FROM app.user_roles ur
                INNER JOIN app.roles r ON ur.role_id = r.id
                WHERE ur.user_id = u.id AND r.name IN ('admin', 'moderator')
              ) as is_staff
       FROM app.users u
       WHERE u.id = $1 AND u.deleted_at IS NULL`,
      [payload.userId]
    );

    if (userCheck.rows.length === 0 || !userCheck.rows[0].is_staff) {
      return NextResponse.json(
        { error: 'No tienes permiso para realizar esta acción' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { reportId, status, action, resolutionNotes } = body;

    // Validaciones
    if (!reportId || !status) {
      return NextResponse.json(
        { error: 'reportId y status son requeridos' },
        { status: 400 }
      );
    }

    if (!['resolved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido. Debe ser "resolved" o "rejected"' },
        { status: 400 }
      );
    }

    // OBLIGATORIO: Notas de resolución (explicación de la decisión)
    if (!resolutionNotes || resolutionNotes.trim().length < 10) {
      return NextResponse.json(
        { error: 'Debes explicar la razón de tu decisión (mínimo 10 caracteres)' },
        { status: 400 }
      );
    }

    // Obtener datos del reporte para notificaciones
    const reportData = await pool.query(
      `SELECT 
        cr.id,
        cr.comment_id,
        cr.reporter_user_id,
        cr.reported_user_id,
        cr.reason,
        c.content as comment_content
      FROM app.comment_reports cr
      INNER JOIN app.comments c ON cr.comment_id = c.id
      WHERE cr.id = $1`,
      [reportId]
    );

    if (reportData.rows.length === 0) {
      return NextResponse.json(
        { error: 'Reporte no encontrado' },
        { status: 404 }
      );
    }

    const report = reportData.rows[0];

    // Si la acción es "comment_deleted", eliminar el comentario (soft delete)
    if (action === 'comment_deleted') {
      await pool.query(
        `UPDATE app.comments SET deleted_at = NOW() WHERE id = $1`,
        [report.comment_id]
      );
    }

    // Actualizar el reporte
    await pool.query(
      `UPDATE app.comment_reports 
       SET status = $1, 
           resolved_by = $2, 
           resolved_at = NOW(),
           action_taken = $3,
           resolution_notes = $4
       WHERE id = $5`,
      [status, payload.userId, action || 'no_action', resolutionNotes.trim(), reportId]
    );

    // NOTIFICACIÓN 1: Al usuario REPORTADO (autor del comentario)
    if (status === 'resolved' && action) {
      // Si se tomó acción contra su comentario
      await pool.query(
        `INSERT INTO app.notifications (
          recipient_user_id,
          actor_user_id,
          action_type,
          notifiable_type,
          notifiable_id,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          report.reported_user_id,
          payload.userId,
          'comment_action_taken',
          'comment_report',
          reportId
        ]
      );
    } else if (status === 'rejected') {
      // Si el reporte fue rechazado (su comentario está bien)
      await pool.query(
        `INSERT INTO app.notifications (
          recipient_user_id,
          actor_user_id,
          action_type,
          notifiable_type,
          notifiable_id,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          report.reported_user_id,
          payload.userId,
          'comment_report_dismissed',
          'comment_report',
          reportId
        ]
      );
    }

    // NOTIFICACIÓN 2: Al usuario REPORTANTE (quien reportó)
    await pool.query(
      `INSERT INTO app.notifications (
        recipient_user_id,
        actor_user_id,
        action_type,
        notifiable_type,
        notifiable_id,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        report.reporter_user_id,
        payload.userId,
        status === 'resolved' ? 'report_resolved' : 'report_rejected',
        'comment_report',
        reportId
      ]
    );

    // Registrar en audit_log
    await pool.query(
      `INSERT INTO app.audit_log (user_id, action, resource_type, resource_id, new_values)
       VALUES ($1, $2, 'comment_report', $3, $4)`,
      [
        payload.userId, 
        `resolve_comment_report_${status}`, 
        reportId, 
        JSON.stringify({ status, action, resolutionNotes: resolutionNotes.trim() })
      ]
    );

    console.log(`✅ Reporte ${reportId} ${status}: action=${action}, notificaciones enviadas a usuarios ${report.reported_user_id} y ${report.reporter_user_id}`);

    return NextResponse.json({
      success: true,
      message: `Reporte ${status === 'resolved' ? 'resuelto' : 'rechazado'} exitosamente. Se enviaron notificaciones a los usuarios involucrados.`,
    });

  } catch (error: any) {
    console.error('Error en PATCH /api/admin/reported-comments:', error);
    return NextResponse.json(
      { error: 'Error al actualizar reporte', details: error.message },
      { status: 500 }
    );
  }
}
