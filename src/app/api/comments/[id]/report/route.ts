import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

/**
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ API: POST /api/comments/[id]/report                                 │
 * │ Crear reporte de comentario inapropiado                             │
 * └─────────────────────────────────────────────────────────────────────┘
 * 
 * PROPÓSITO:
 * Permite a los usuarios reportar comentarios que violen las políticas
 * de la comunidad (spam, lenguaje ofensivo, acoso, spoilers, etc.)
 * 
 * FLUJO COMPLETO:
 * 1. Usuario hace clic en "Reportar comentario" → report-comment-dialog.tsx
 * 2. Dialog envía POST a /api/comments/[id]/report con reason
 * 3. API valida autenticación, comentario existe, no es su propio comentario
 * 4. API inserta en app.comment_reports con status='pending'
 * 5. TRIGGER trg_notify_new_comment_report se ejecuta automáticamente
 * 6. Trigger crea notificaciones para TODOS los admins/moderadores activos
 * 7. Notificaciones tienen: action_type='comment_reported', notifiable_type='comment_report'
 * 8. Moderadores ven notificación en /notifications → clic → /dashboard/moderator/reported-comments
 * 9. Moderador puede asignar, resolver o rechazar el reporte
 * 
 * TABLAS RELACIONADAS:
 * - app.comment_reports (tabla principal - almacena el reporte)
 *   └─ comment_id → app.comments.id (comentario reportado)
 *   └─ reporter_user_id → app.users.id (quien reporta)
 *   └─ reported_user_id → app.users.id (autor del comentario)
 *   └─ assigned_to → app.users.id (moderador asignado, nullable)
 *   └─ resolved_by → app.users.id (moderador que resolvió, nullable)
 * 
 * - app.notifications (creadas automáticamente por trigger)
 *   └─ recipient_user_id → app.users.id (admin/moderador que recibe)
 *   └─ actor_user_id → app.users.id (quien reporta)
 *   └─ action_type = 'comment_reported'
 *   └─ notifiable_type = 'comment_report'
 *   └─ notifiable_id → app.comment_reports.id
 * 
 * - app.comments (comentario original)
 *   └─ commentable_type = 'anime' | 'review' | 'episode' | etc.
 *   └─ commentable_id = ID del contenido donde está el comentario
 * 
 * TRIGGER AUTOMÁTICO:
 * Nombre: trg_notify_new_comment_report
 * Función: app.fn_notify_new_comment_report()
 * Dispara: AFTER INSERT ON app.comment_reports
 * Acción:
 *   - Busca todos los usuarios con rol 'admin' o 'moderator' activos
 *   - Crea una notificación para cada uno con:
 *     * action_type = 'comment_reported'
 *     * notifiable_type = 'comment_report'
 *     * notifiable_id = comment_report.id (NEW.id)
 *     * actor_user_id = reporter_user_id (quien reporta)
 * 
 * VALIDACIONES:
 * ✅ Usuario autenticado (JWT token válido)
 * ✅ Comentario existe y no está eliminado
 * ✅ No puede reportar su propio comentario
 * ✅ No puede reportar el mismo comentario dos veces (UNIQUE constraint)
 * ✅ Razón debe tener mínimo 10 caracteres
 * 
 * STATUS VÁLIDOS:
 * - 'pending': Pendiente de revisión (estado inicial)
 * - 'reviewing': En revisión por un moderador
 * - 'resolved': Resuelto (acción tomada)
 * - 'rejected': Rechazado (no viola políticas)
 * 
 * REASON VÁLIDOS (validado en BD):
 * - 'spam': Contenido promocional no deseado
 * - 'offensive_language': Lenguaje ofensivo o vulgar
 * - 'harassment': Acoso o intimidación
 * - 'spoilers': Spoilers sin marcar como tal
 * - 'irrelevant_content': Contenido fuera de tema
 * - 'misinformation': Información falsa o engañosa
 * - 'other': Otra razón (especificada en comments)
 * 
 * IMPORTANTE - UNICIDAD:
 * Constraint: UNIQUE(comment_id, reporter_user_id)
 * Garantiza que un usuario solo puede reportar un comentario UNA vez
 * 
 * LOGGING:
 * 📝 "Creando reporte de comentario: user X → comment Y"
 * ✅ "Reporte de comentario creado: ID Z"
 * 
 * RESPONSE:
 * Success: { success: true, message: "..." }
 * Error: { error: "mensaje descriptivo" }
 * 
 * EJEMPLOS DE USO:
 * ```typescript
 * // Frontend (report-comment-dialog.tsx)
 * const response = await fetch(`/api/comments/${commentId}/report`, {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ reason: "Este comentario contiene spoilers sin advertencia" })
 * });
 * ```
 * 
 * SIGUIENTES PASOS EN EL FLUJO:
 * 1. Moderador ve notificación → clic → /dashboard/moderator/reported-comments
 * 2. API GET /api/admin/reported-comments trae los reportes (con lógica de visibilidad)
 * 3. Moderador puede:
 *    - Asignarse el caso: POST /api/comment-reports/[id]/assign
 *    - Resolver/Rechazar: PATCH /api/admin/reported-comments
 *    - Ver historial de acciones en activity_logs
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const commentId = parseInt(id);

    if (isNaN(commentId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json();
    const { reason } = body;

    if (!reason || reason.trim().length < 10) {
      return NextResponse.json(
        { error: 'La razón del reporte debe tener al menos 10 caracteres' },
        { status: 400 }
      );
    }

    // Verificar que el comentario existe
    const commentCheck = await pool.query(
      `SELECT id, user_id, commentable_type, commentable_id, content 
       FROM app.comments 
       WHERE id = $1 AND deleted_at IS NULL`,
      [commentId]
    );

    if (commentCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Comentario no encontrado' }, { status: 404 });
    }

    const comment = commentCheck.rows[0];

    // No permitir reportar tu propio comentario
    if (comment.user_id === payload.userId) {
      return NextResponse.json(
        { error: 'No puedes reportar tu propio comentario' },
        { status: 400 }
      );
    }

    // Verificar si ya reportó este comentario
    const existingReport = await pool.query(
      `SELECT id FROM app.comment_reports 
       WHERE comment_id = $1 
       AND reporter_user_id = $2`,
      [commentId, payload.userId]
    );

    if (existingReport.rows.length > 0) {
      return NextResponse.json(
        { error: 'Ya has reportado este comentario' },
        { status: 400 }
      );
    }

    console.log(`📝 Creando reporte de comentario: user ${payload.userId} → comment ${commentId}`);

    // Crear el reporte en comment_reports (el trigger automáticamente notificará)
    const result = await pool.query(
      `INSERT INTO app.comment_reports (
        comment_id,
        reporter_user_id,
        reported_user_id,
        reason,
        comments,
        status,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, 'pending', NOW())
      RETURNING id, created_at`,
      [
        commentId,
        payload.userId,
        comment.user_id,
        'other', // Razón genérica - El texto detallado va en 'comments'
        reason.trim()
      ]
    );

    const newReport = result.rows[0];

    console.log(`✅ Reporte de comentario creado: ID ${newReport.id}`);

    // El trigger trg_notify_new_comment_report ya creó las notificaciones automáticamente

    return NextResponse.json({
      success: true,
      message: 'Reporte enviado. Será revisado por los moderadores.',
    });

  } catch (error: any) {
    console.error('Error en POST /api/comments/[id]/report:', error);
    return NextResponse.json(
      { error: 'Error al procesar reporte', details: error.message },
      { status: 500 }
    );
  }
}
