import { query } from "../../config/db.js";

export const getUnreadNotificationCount = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT COUNT(*) as unread_count
       FROM notifications
       WHERE user_id = $1 AND is_read = FALSE`,
      [req.user.id]
    );

    return res.json({
      unreadCount: parseInt(result.rows[0].unread_count, 10)
    });
  } catch (error) {
    return next(error);
  }
};

export const markNotificationAsRead = async (req, res, next) => {
  try {
    const { notificationId } = req.params;

    // Verify notification belongs to user
    const notification = await query(
      `SELECT id FROM notifications WHERE id = $1 AND user_id = $2`,
      [notificationId, req.user.id]
    );

    if (notification.rows.length === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }

    await query(
      `UPDATE notifications SET is_read = TRUE WHERE id = $1`,
      [notificationId]
    );

    return res.json({ message: "Notification marked as read" });
  } catch (error) {
    return next(error);
  }
};

export const getNotifications = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit || "20", 10);
    const offset = parseInt(req.query.offset || "0", 10);

    const result = await query(
      `SELECT id, type, message, is_read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );

    return res.json(result.rows);
  } catch (error) {
    return next(error);
  }
};

export const markAllNotificationsAsRead = async (req, res, next) => {
  try {
    await query(
      `UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE`,
      [req.user.id]
    );

    return res.json({ message: "All notifications marked as read" });
  } catch (error) {
    return next(error);
  }
};
