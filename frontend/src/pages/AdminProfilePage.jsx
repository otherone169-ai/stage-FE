import { useEffect, useState } from "react";
import apiClient from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";
import PasswordChangeCard from "../components/PasswordChangeCard";
import { useAuth } from "../hooks/useAuth";

const AdminProfilePage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        // Utiliser les informations de l'utilisateur connecté
        setProfile({
          fullName: user?.full_name || user?.fullName || "",
          email: user?.email || "",
          role: user?.role || "admin"
        });
      } catch (err) {
        setError("Failed to load admin profile");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  const save = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      // Pour l'admin, on pourrait mettre à jour le nom complet
      await apiClient.patch("/admin/profile/me", {
        fullName: profile.fullName
      });
      setMessage("Profil mis à jour avec succès");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update admin profile");
    }
  };

  if (loading) return <LoadingSpinner label="Chargement du profil..." />;

  return (
    <div className="page-grid page-grid-stack">
      <section className="card profile-header-card">
        <div className="profile-header-content">
          <div className="profile-avatar-section">
            <div className="admin-avatar">
              <span className="avatar-icon">👨‍💼</span>
            </div>
            <div className="profile-title">
              <h2>Mon Profil Administrateur</h2>
              <p className="profile-subtitle">Gérez vos informations personnelles</p>
            </div>
          </div>
          <div className="profile-status">
            <span className="role-badge admin-role">
              <span className="role-icon">🔐</span>
              Administrateur
            </span>
          </div>
        </div>
      </section>

      <div className="profile-content-grid">
        <section className="card profile-form-card">
          <div className="card-header">
            <h3>Informations Personnelles</h3>
            <p className="card-description">Mettez à jour vos informations de base</p>
          </div>
          
          {error && <div className="form-error">⚠️ {error}</div>}
          {message && <div className="form-success">✅ {message}</div>}
          
          <form onSubmit={save} className="profile-form">
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="fullName" className="form-label">
                  <span className="label-icon">👤</span>
                  Nom complet
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={profile?.fullName || ""}
                  onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                  className="form-input"
                  placeholder="Entrez votre nom complet"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="email" className="form-label">
                  <span className="label-icon">📧</span>
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={profile?.email || ""}
                  readOnly
                  className="form-input readonly-input"
                />
                <div className="field-hint">
                  <span className="hint-icon">ℹ️</span>
                  L'email ne peut pas être modifié
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="role" className="form-label">
                  <span className="label-icon">🔐</span>
                  Rôle
                </label>
                <input
                  id="role"
                  type="text"
                  value={profile?.role || "admin"}
                  readOnly
                  className="form-input readonly-input"
                />
                <div className="field-hint">
                  <span className="hint-icon">ℹ️</span>
                  Le rôle est défini par le système
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="primary-btn update-btn">
                <span className="btn-icon">💾</span>
                Mettre à jour
              </button>
            </div>
          </form>
        </section>

        <PasswordChangeCard />
      </div>
    </div>
  );
};

export default AdminProfilePage;
