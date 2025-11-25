/**
 * ========================================
 * HELPER: SISTEMA DE NOTIFICACIONES
 * ========================================
 * Funciones para crear y gestionar notificaciones
 */

import 'server-only';
import { db } from './database';

interface CreateNotificationParams {
  recipientUserId: number;
  actorUserId?: number | null;
  actionType: string;
  notifiableType: string;
  notifiableId: number;
}

/**
 * Crea una notificación para un usuario
 */
export async function createNotification({
  recipientUserId,
  actorUserId,
  actionType,
  notifiableType,
  notifiableId,
}: CreateNotificationParams): Promise<void> {
  try {
    await db.query(
      `INSERT INTO app.notifications (
        recipient_user_id,
        actor_user_id,
        action_type,
        notifiable_type,
        notifiable_id,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())`,
      [recipientUserId, actorUserId || null, actionType, notifiableType, notifiableId]
    );
  } catch (error) {
    console.error('❌ Error al crear notificación:', error);
    // No lanzamos error para no interrumpir el flujo principal
  }
}

/**
 * Notifica a todos los administradores y moderadores
 */
export async function notifyAdminsAndMods(
  actionType: string,
  notifiableType: string,
  notifiableId: number,
  actorUserId?: number
): Promise<void> {
  try {
    // Obtener todos los usuarios con rol admin o moderator
    const result = await db.query(`
      SELECT DISTINCT u.id
      FROM app.users u
      INNER JOIN app.user_roles ur ON u.id = ur.user_id
      INNER JOIN app.roles r ON ur.role_id = r.id
      WHERE r.name IN ('admin', 'moderator')
        AND u.is_active = true
        AND u.deleted_at IS NULL
    `);

    // Crear notificación para cada admin/mod
    const notifications = result.rows.map((row: any) =>
      createNotification({
        recipientUserId: row.id,
        actorUserId,
        actionType,
        notifiableType,
        notifiableId,
      })
    );

    await Promise.all(notifications);

    console.log(`✅ Notificados ${result.rows.length} administradores/moderadores`);
  } catch (error) {
    console.error('❌ Error al notificar admins/mods:', error);
  }
}

/**
 * Marca una notificación como leída
 */
export async function markNotificationAsRead(notificationId: number): Promise<void> {
  try {
    await db.query(
      `UPDATE app.notifications 
       SET read_at = NOW() 
       WHERE id = $1 AND read_at IS NULL`,
      [notificationId]
    );
  } catch (error) {
    console.error('❌ Error al marcar notificación como leída:', error);
  }
}

/**
 * Obtiene las notificaciones no leídas de un usuario
 */
export async function getUnreadNotifications(userId: number, limit: number = 20) {
  try {
    const result = await db.query(
      `SELECT 
        n.id,
        n.action_type,
        n.notifiable_type,
        n.notifiable_id,
        n.created_at,
        u.username as actor_username,
        u.avatar_url as actor_avatar,
        CASE 
          WHEN n.notifiable_type = 'comment' THEN (
            SELECT c.content FROM app.comments c WHERE c.id = n.notifiable_id
          )
          ELSE NULL
        END as comment_content,
        CASE 
          WHEN n.notifiable_type = 'comment' THEN (
            SELECT c.commentable_type FROM app.comments c WHERE c.id = n.notifiable_id
          )
          ELSE n.notifiable_type
        END as media_type,
        CASE 
          WHEN n.notifiable_type = 'comment' THEN (
            SELECT c.commentable_id FROM app.comments c WHERE c.id = n.notifiable_id
          )
          ELSE n.notifiable_id
        END as media_id,
        CASE 
          WHEN n.notifiable_type = 'anime' THEN (SELECT title_romaji FROM app.anime WHERE id = n.notifiable_id)
          WHEN n.notifiable_type = 'manga' THEN (SELECT title_romaji FROM app.manga WHERE id = n.notifiable_id)
          WHEN n.notifiable_type = 'novel' THEN (SELECT title_romaji FROM app.novels WHERE id = n.notifiable_id)
          WHEN n.notifiable_type = 'donghua' THEN (SELECT title_romaji FROM app.donghua WHERE id = n.notifiable_id)
          WHEN n.notifiable_type = 'manhua' THEN (SELECT title_romaji FROM app.manhua WHERE id = n.notifiable_id)
          WHEN n.notifiable_type = 'manhwa' THEN (SELECT title_romaji FROM app.manhwa WHERE id = n.notifiable_id)
          WHEN n.notifiable_type = 'fan_comic' THEN (SELECT title FROM app.fan_comics WHERE id = n.notifiable_id)
          WHEN n.notifiable_type = 'comment' THEN (
            SELECT 
              CASE 
                WHEN c.commentable_type = 'anime' THEN (SELECT title_romaji FROM app.anime WHERE id = c.commentable_id)
                WHEN c.commentable_type = 'manga' THEN (SELECT title_romaji FROM app.manga WHERE id = c.commentable_id)
                WHEN c.commentable_type = 'novels' THEN (SELECT title_romaji FROM app.novels WHERE id = c.commentable_id)
                WHEN c.commentable_type = 'donghua' THEN (SELECT title_romaji FROM app.donghua WHERE id = c.commentable_id)
                WHEN c.commentable_type = 'manhua' THEN (SELECT title_romaji FROM app.manhua WHERE id = c.commentable_id)
                WHEN c.commentable_type = 'manhwa' THEN (SELECT title_romaji FROM app.manhwa WHERE id = c.commentable_id)
                WHEN c.commentable_type = 'fan_comic' THEN (SELECT title FROM app.fan_comics WHERE id = c.commentable_id)
                ELSE 'Comentario'
              END
            FROM app.comments c WHERE c.id = n.notifiable_id
          )
          WHEN n.notifiable_type = 'character' THEN (SELECT name_romaji FROM app.characters WHERE id = n.notifiable_id)
          WHEN n.notifiable_type = 'voice_actor' THEN (SELECT name_romaji FROM app.voice_actors WHERE id = n.notifiable_id)
          WHEN n.notifiable_type = 'user_contribution' THEN (
            SELECT 
              CASE 
                WHEN uc.contributable_type = 'anime' THEN 
                  COALESCE(
                    (SELECT title_romaji FROM app.anime WHERE id = uc.contributable_id),
                    CAST(uc.contribution_data->>'titleRomaji' AS TEXT)
                  )
                WHEN uc.contributable_type = 'manga' THEN 
                  COALESCE(
                    (SELECT title_romaji FROM app.manga WHERE id = uc.contributable_id),
                    CAST(uc.contribution_data->>'titleRomaji' AS TEXT)
                  )
                WHEN uc.contributable_type = 'novel' THEN 
                  COALESCE(
                    (SELECT title_romaji FROM app.novels WHERE id = uc.contributable_id),
                    CAST(uc.contribution_data->>'titleRomaji' AS TEXT)
                  )
                WHEN uc.contributable_type = 'character' THEN 
                  COALESCE(
                    (SELECT name_romaji FROM app.characters WHERE id = uc.contributable_id),
                    CAST(uc.contribution_data->>'nameRomaji' AS TEXT)
                  )
                ELSE 'Contribución'
              END
            FROM app.user_contributions uc 
            WHERE uc.id = n.notifiable_id
          )
          WHEN n.notifiable_type = 'content_report' THEN (
            SELECT cr.report_reason
            FROM app.content_reports cr 
            WHERE cr.id = n.notifiable_id
          )
          ELSE 'Elemento'
        END as content_name,
        CASE 
          WHEN n.notifiable_type = 'content_report' THEN (
            SELECT cr.status
            FROM app.content_reports cr 
            WHERE cr.id = n.notifiable_id
          )
          ELSE NULL
        END as report_status,
        CASE 
          WHEN n.notifiable_type = 'content_report' THEN (
            SELECT cr.moderator_notes
            FROM app.content_reports cr 
            WHERE cr.id = n.notifiable_id
          )
          ELSE NULL
        END as moderator_notes,
        CASE 
          WHEN n.notifiable_type = 'comment' THEN (
            SELECT c.parent_id FROM app.comments c WHERE c.id = n.notifiable_id
          )
          ELSE NULL
        END as parent_comment_id,
        CASE 
          WHEN n.notifiable_type = 'comment' THEN (
            SELECT 
              CASE 
                WHEN c.commentable_type = 'anime' THEN (SELECT slug FROM app.anime WHERE id = c.commentable_id)
                WHEN c.commentable_type = 'manga' THEN (SELECT slug FROM app.manga WHERE id = c.commentable_id)
                WHEN c.commentable_type = 'novels' THEN (SELECT slug FROM app.novels WHERE id = c.commentable_id)
                WHEN c.commentable_type = 'donghua' THEN (SELECT slug FROM app.donghua WHERE id = c.commentable_id)
                WHEN c.commentable_type = 'manhua' THEN (SELECT slug FROM app.manhua WHERE id = c.commentable_id)
                WHEN c.commentable_type = 'manhwa' THEN (SELECT slug FROM app.manhwa WHERE id = c.commentable_id)
                WHEN c.commentable_type = 'fan_comic' THEN (SELECT slug FROM app.fan_comics WHERE id = c.commentable_id)
                ELSE NULL
              END
            FROM app.comments c WHERE c.id = n.notifiable_id
          )
          ELSE NULL
        END as media_slug
      FROM app.notifications n
      LEFT JOIN app.users u ON n.actor_user_id = u.id
      WHERE n.recipient_user_id = $1 
        AND n.read_at IS NULL
      ORDER BY n.created_at DESC
      LIMIT $2`,
      [userId, limit]
    );

    return result.rows;
  } catch (error) {
    console.error('❌ Error al obtener notificaciones:', error);
    return [];
  }
}

/**
 * Obtiene todas las notificaciones de un usuario (leídas y no leídas) con paginación
 */
export async function getAllNotifications(
  userId: number, 
  limit: number = 50,
  offset: number = 0
) {
  try {
    const result = await db.query(
      `SELECT 
        n.id,
        n.action_type,
        n.notifiable_type,
        n.notifiable_id,
        n.read_at,
        n.created_at,
        u.username as actor_username,
        u.avatar_url as actor_avatar,
        CASE 
          WHEN n.notifiable_type = 'comment' THEN (
            SELECT c.content FROM app.comments c WHERE c.id = n.notifiable_id
          )
          ELSE NULL
        END as comment_content,
        CASE 
          WHEN n.notifiable_type = 'comment' THEN (
            SELECT c.commentable_type FROM app.comments c WHERE c.id = n.notifiable_id
          )
          ELSE n.notifiable_type
        END as media_type,
        CASE 
          WHEN n.notifiable_type = 'comment' THEN (
            SELECT c.commentable_id FROM app.comments c WHERE c.id = n.notifiable_id
          )
          ELSE n.notifiable_id
        END as media_id,
        CASE 
          WHEN n.notifiable_type = 'anime' THEN (SELECT title_romaji FROM app.anime WHERE id = n.notifiable_id)
          WHEN n.notifiable_type = 'manga' THEN (SELECT title_romaji FROM app.manga WHERE id = n.notifiable_id)
          WHEN n.notifiable_type = 'novel' THEN (SELECT title_romaji FROM app.novels WHERE id = n.notifiable_id)
          WHEN n.notifiable_type = 'donghua' THEN (SELECT title_romaji FROM app.donghua WHERE id = n.notifiable_id)
          WHEN n.notifiable_type = 'manhua' THEN (SELECT title_romaji FROM app.manhua WHERE id = n.notifiable_id)
          WHEN n.notifiable_type = 'manhwa' THEN (SELECT title_romaji FROM app.manhwa WHERE id = n.notifiable_id)
          WHEN n.notifiable_type = 'fan_comic' THEN (SELECT title FROM app.fan_comics WHERE id = n.notifiable_id)
          WHEN n.notifiable_type = 'comment' THEN (
            SELECT 
              CASE 
                WHEN c.commentable_type = 'anime' THEN (SELECT title_romaji FROM app.anime WHERE id = c.commentable_id)
                WHEN c.commentable_type = 'manga' THEN (SELECT title_romaji FROM app.manga WHERE id = c.commentable_id)
                WHEN c.commentable_type = 'novels' THEN (SELECT title_romaji FROM app.novels WHERE id = c.commentable_id)
                WHEN c.commentable_type = 'donghua' THEN (SELECT title_romaji FROM app.donghua WHERE id = c.commentable_id)
                WHEN c.commentable_type = 'manhua' THEN (SELECT title_romaji FROM app.manhua WHERE id = c.commentable_id)
                WHEN c.commentable_type = 'manhwa' THEN (SELECT title_romaji FROM app.manhwa WHERE id = c.commentable_id)
                WHEN c.commentable_type = 'fan_comic' THEN (SELECT title FROM app.fan_comics WHERE id = c.commentable_id)
                ELSE 'Comentario'
              END
            FROM app.comments c WHERE c.id = n.notifiable_id
          )
          WHEN n.notifiable_type = 'character' THEN (SELECT name_romaji FROM app.characters WHERE id = n.notifiable_id)
          WHEN n.notifiable_type = 'voice_actor' THEN (SELECT name_romaji FROM app.voice_actors WHERE id = n.notifiable_id)
          WHEN n.notifiable_type = 'user_contribution' THEN (
            SELECT 
              CASE 
                WHEN uc.contributable_type = 'anime' THEN 
                  COALESCE(
                    (SELECT title_romaji FROM app.anime WHERE id = uc.contributable_id),
                    CAST(uc.contribution_data->>'titleRomaji' AS TEXT)
                  )
                WHEN uc.contributable_type = 'manga' THEN 
                  COALESCE(
                    (SELECT title_romaji FROM app.manga WHERE id = uc.contributable_id),
                    CAST(uc.contribution_data->>'titleRomaji' AS TEXT)
                  )
                WHEN uc.contributable_type = 'novel' THEN 
                  COALESCE(
                    (SELECT title_romaji FROM app.novels WHERE id = uc.contributable_id),
                    CAST(uc.contribution_data->>'titleRomaji' AS TEXT)
                  )
                WHEN uc.contributable_type = 'character' THEN 
                  COALESCE(
                    (SELECT name_romaji FROM app.characters WHERE id = uc.contributable_id),
                    CAST(uc.contribution_data->>'nameRomaji' AS TEXT)
                  )
                ELSE 'Contribución'
              END
            FROM app.user_contributions uc 
            WHERE uc.id = n.notifiable_id
          )
          WHEN n.notifiable_type = 'content_report' THEN (
            SELECT cr.report_reason
            FROM app.content_reports cr 
            WHERE cr.id = n.notifiable_id
          )
          ELSE 'Elemento'
        END as content_name,
        CASE 
          WHEN n.notifiable_type = 'content_report' THEN (
            SELECT cr.status
            FROM app.content_reports cr 
            WHERE cr.id = n.notifiable_id
          )
          ELSE NULL
        END as report_status,
        CASE 
          WHEN n.notifiable_type = 'content_report' THEN (
            SELECT cr.moderator_notes
            FROM app.content_reports cr 
            WHERE cr.id = n.notifiable_id
          )
          ELSE NULL
        END as moderator_notes,
        CASE 
          WHEN n.notifiable_type = 'comment' THEN (
            SELECT c.parent_id FROM app.comments c WHERE c.id = n.notifiable_id
          )
          ELSE NULL
        END as parent_comment_id,
        CASE 
          WHEN n.notifiable_type = 'comment' THEN (
            SELECT 
              CASE 
                WHEN c.commentable_type = 'anime' THEN (SELECT slug FROM app.anime WHERE id = c.commentable_id)
                WHEN c.commentable_type = 'manga' THEN (SELECT slug FROM app.manga WHERE id = c.commentable_id)
                WHEN c.commentable_type = 'novels' THEN (SELECT slug FROM app.novels WHERE id = c.commentable_id)
                WHEN c.commentable_type = 'donghua' THEN (SELECT slug FROM app.donghua WHERE id = c.commentable_id)
                WHEN c.commentable_type = 'manhua' THEN (SELECT slug FROM app.manhua WHERE id = c.commentable_id)
                WHEN c.commentable_type = 'manhwa' THEN (SELECT slug FROM app.manhwa WHERE id = c.commentable_id)
                WHEN c.commentable_type = 'fan_comic' THEN (SELECT slug FROM app.fan_comics WHERE id = c.commentable_id)
                ELSE NULL
              END
            FROM app.comments c WHERE c.id = n.notifiable_id
          )
          ELSE NULL
        END as media_slug
      FROM app.notifications n
      LEFT JOIN app.users u ON n.actor_user_id = u.id
      WHERE n.recipient_user_id = $1 
      ORDER BY n.created_at DESC
      LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    // Obtener conteo total
    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM app.notifications WHERE recipient_user_id = $1`,
      [userId]
    );

    return {
      notifications: result.rows,
      total: parseInt(countResult.rows[0].total),
    };
  } catch (error) {
    console.error('❌ Error al obtener todas las notificaciones:', error);
    return {
      notifications: [],
      total: 0,
    };
  }
}
