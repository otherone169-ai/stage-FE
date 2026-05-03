-- Migration 006: Add link_url column to notifications for deep linking

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link_url VARCHAR(255) DEFAULT NULL;

-- Create index for faster notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
