import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../hooks/useAuth";

const NotificationsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await apiClient.get("/workflow/notifications?limit=50&offset=0");
      setNotifications(response.data || []);
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Votre session a expiré. Veuillez vous reconnecter.");
      } else {
        setError(err.response?.data?.message || "Erreur de chargement des notifications");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await apiClient.patch(`/workflow/notifications/${notificationId}/read`);
      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiClient.patch("/workflow/notifications/mark-all-read");
      // Reload notifications
      await loadNotifications();
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  const handleNotificationAction = (notification) => {
    // Mark as read
    handleMarkAsRead(notification.id);
    // Navigate to link if available
    if (notification.link_url) {
      navigate(notification.link_url);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      // For now, just remove from UI by marking as read
      await handleMarkAsRead(notificationId);
    } catch (err) {
      console.error("Error handling notification:", err);
    }
  };

  if (loading) return <LoadingSpinner label="Chargement des notifications..." />;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="notifications-page">
      <section className="card notifications-hero">
        <div>
          <p className="section-kicker">🔔 Notifications</p>
          <h2>Vos notifications</h2>
          <p className="section-subtitle">
            Restez informé des changements et des mises à jour importantes.
          </p>
        </div>

        {unreadCount > 0 && (
          <button type="button" className="primary-btn" onClick={handleMarkAllAsRead}>
            Marquer tout comme lu
          </button>
        )}
      </section>

      {error && (
        <section className="card" style={{ backgroundColor: "#fee", border: "1px solid #fcc", marginBottom: "20px" }}>
          <p style={{ color: "#c33" }}>{error}</p>
        </section>
      )}

      <section className="card">
        {notifications.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <p style={{ fontSize: "18px", color: "#666" }}>📭 Aucune notification</p>
            <p style={{ color: "#999", marginTop: "10px" }}>Vous recevrez vos notifications ici.</p>
          </div>
        ) : (
          <div className="notifications-list">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="notification-item"
                style={{
                  padding: "16px",
                  borderBottom: "1px solid #eee",
                  backgroundColor: notification.is_read ? "#fff" : "#f9f3ff",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "12px"
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <span
                      style={{
                        display: "inline-block",
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: notification.is_read ? "#ddd" : "#ef4444"
                      }}
                    />
                    <span style={{ fontSize: "12px", color: "#666" }}>
                      {new Date(notification.created_at).toLocaleDateString()} à{" "}
                      {new Date(notification.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  </div>
                  <p style={{ margin: "0 0 8px 0", whiteSpace: "pre-wrap", color: "#333", fontWeight: "500" }}>
                    {notification.message}
                  </p>
                </div>

                <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                  {notification.link_url && (
                    <button
                      type="button"
                      className="primary-btn small"
                      onClick={() => handleNotificationAction(notification)}
                    >
                      Voir →
                    </button>
                  )}
                  {!notification.is_read && (
                    <button
                      type="button"
                      className="secondary-btn small"
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      ✓ Lire
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default NotificationsPage;
