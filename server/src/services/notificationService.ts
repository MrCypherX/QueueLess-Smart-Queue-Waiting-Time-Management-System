import { query } from '../db';
import { sseManager } from './sseService';
import { NotificationItem } from '../../../shared/schemas';

export async function createNotification(
  userId: string | null | undefined,
  tokenId: string | null | undefined,
  title: string,
  body: string
): Promise<NotificationItem | null> {
  if (!userId) return null;

  const res = await query<NotificationItem>(
    `INSERT INTO notifications (user_id, token_id, title, body, is_read)
     VALUES ($1, $2, $3, $4, FALSE)
     RETURNING id, user_id, token_id, title, body, is_read, created_at`,
    [userId, tokenId || null, title, body]
  );

  const notif = res.rows[0];
  if (notif && userId) {
    sseManager.broadcastNotification(userId, notif);
  }
  return notif;
}

export async function getUserNotifications(userId: string): Promise<NotificationItem[]> {
  const res = await query<NotificationItem>(
    `SELECT id, user_id, token_id, title, body, is_read, created_at
     FROM notifications
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 50`,
    [userId]
  );
  return res.rows;
}

export async function markNotificationAsRead(id: string, userId: string): Promise<boolean> {
  const res = await query(
    `UPDATE notifications
     SET is_read = TRUE
     WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  return res.rowCount > 0;
}

export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  const res = await query(
    `UPDATE notifications
     SET is_read = TRUE
     WHERE user_id = $1 AND is_read = FALSE`,
    [userId]
  );
  return res.rowCount > 0;
}
