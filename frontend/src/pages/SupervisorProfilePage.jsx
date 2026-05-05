import { useEffect, useState } from "react";
import apiClient from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";
import PasswordChangeCard from "../components/PasswordChangeCard";
import { useAuth } from "../hooks/useAuth";

const SupervisorProfilePage = () => {
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
        const { data } = await apiClient.get("/supervisors/profile/me");
        setProfile({
          fullName: data.full_name || "",
          position: data.position || "",
          email: data.email || "",
          company_name: data.company_name || "",
          company_description: data.company_description || "",
          company_location: data.company_location || "",
          company_website: data.company_website || ""
        });
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load supervisor profile");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const save = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSavingProfile(true);

    try {
      await apiClient.patch("/supervisors/profile/me", {
        fullName: profile.fullName,
        position: profile.position,
        company_name: profile.company_name,
        company_description: profile.company_description,
        company_location: profile.company_location,
        company_website: profile.company_website
      });
      setMessage("Profile updated");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update supervisor profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading supervisor profile..." />;

  return (
    <div className="page-grid page-grid-stack">
      <section className="card profile-header-card">
        <div className="profile-header-content">
          <div className="profile-avatar-section">
            <div className="supervisor-avatar">
              <span className="avatar-icon">👨‍🏫</span>
            </div>
            <div className="profile-title">
              <h2>Mon Profil Superviseur</h2>
              <p className="profile-subtitle">Gérez vos informations professionnelles</p>
            </div>
          </div>
          <div className="profile-status">
            <span className="role-badge supervisor-role">
              <span className="role-icon">👨‍🏫</span>
              Superviseur
            </span>
          </div>
        </div>
      </section>

      <div className="profile-content-grid">
        <section className="card profile-form-card">
          <div className="card-header">
            <h3>Informations Professionnelles</h3>
            <p className="card-description">Mettez à jour vos coordonnées et poste</p>
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
                <label htmlFor="companyName" className="form-label">
                  <span className="label-icon">🏢</span>
                  Nom de l'entreprise
                </label>
                <input
                  id="companyName"
                  type="text"
                  value={profile?.company_name || ""}
                  onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                  className="form-input"
                  placeholder="Entrez le nom de votre entreprise"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="companyDescription" className="form-label">
                  <span className="label-icon">📝</span>
                  Description de l'entreprise
                </label>
                <textarea
                  id="companyDescription"
                  value={profile?.company_description || ""}
                  onChange={(e) => setProfile({ ...profile, company_description: e.target.value })}
                  className="form-textarea"
                  placeholder="Décrivez votre entreprise"
                  rows={3}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="companyLocation" className="form-label">
                  <span className="label-icon">📍</span>
                  Localisation
                </label>
                <input
                  id="companyLocation"
                  type="text"
                  value={profile?.company_location || ""}
                  onChange={(e) => setProfile({ ...profile, company_location: e.target.value })}
                  className="form-input"
                  placeholder="Entrez la localisation de votre entreprise"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="companyWebsite" className="form-label">
                  <span className="label-icon">🌐</span>
                  Site web
                </label>
                <input
                  id="companyWebsite"
                  type="url"
                  value={profile?.company_website || ""}
                  onChange={(e) => setProfile({ ...profile, company_website: e.target.value })}
                  className="form-input"
                  placeholder="https://example.com"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="position" className="form-label">
                  <span className="label-icon">💼</span>
                  Poste
                </label>
                <input
                  id="position"
                  type="text"
                  value={profile?.position || ""}
                  onChange={(e) => setProfile({ ...profile, position: e.target.value })}
                  className="form-input"
                  placeholder="Entrez votre poste"
                  required
                />
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

export default SupervisorProfilePage;
