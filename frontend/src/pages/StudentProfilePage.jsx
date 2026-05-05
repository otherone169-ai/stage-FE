import { useEffect, useState } from "react";
import apiClient from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";
import PasswordChangeCard from "../components/PasswordChangeCard";
import { useAuth } from "../hooks/useAuth";

const StudentProfilePage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [cvFile, setCvFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingCv, setIsUploadingCv] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await apiClient.get("/students/me");
      setProfile({
        fullName: data.full_name || "",
        phone: data.phone || "",
        education: data.education || "",
        skills: data.skills || "",
        experience: data.experience || "",
        cvUrl: data.cv_url || ""
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      setIsSavingProfile(true);
      await apiClient.put("/students/me", {
        fullName: profile.fullName,
        phone: profile.phone,
        education: profile.education,
        experience: profile.experience,
        cvUrl: profile.cvUrl,
        skills: profile.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      });
      setMessage("Profile updated.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const uploadCv = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!cvFile) {
      setError("Please select a CV file to upload.");
      return;
    }

    try {
      setIsUploadingCv(true);
      const formData = new FormData();
      formData.append("cv", cvFile);

      const { data } = await apiClient.post("/students/upload-cv", formData);
      setMessage(data.message || "CV uploaded successfully.");
      setCvFile(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload CV");
    } finally {
      setIsUploadingCv(false);
    }
  };

  if (loading) return <LoadingSpinner label="Chargement du profil étudiant..." />;

  return (
    <div className="page-grid page-grid-stack">
      <section className="card profile-header-card">
        <div className="profile-header-content">
          <div className="profile-avatar-section">
            <div className="student-avatar">
              <span className="avatar-icon">👨‍🎓</span>
            </div>
            <div className="profile-title">
              <h2>Mon Profil Étudiant</h2>
              <p className="profile-subtitle">Gérez vos informations académiques et professionnelles</p>
            </div>
          </div>
          <div className="profile-status">
            <span className="role-badge student-role">
              <span className="role-icon">👨‍🎓</span>
              Étudiant
            </span>
          </div>
        </div>
      </section>

      <div className="profile-content-grid">
        <section className="card profile-form-card">
          <div className="card-header">
            <h3>Informations Académiques</h3>
            <p className="card-description">Mettez à jour votre formation et compétences</p>
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
                <label htmlFor="phone" className="form-label">
                  <span className="label-icon">📱</span>
                  Téléphone
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={profile?.phone || ""}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="form-input"
                  placeholder="Entrez votre numéro de téléphone"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="education" className="form-label">
                  <span className="label-icon">🎓</span>
                  Formation
                </label>
                <textarea
                  id="education"
                  value={profile?.education || ""}
                  onChange={(e) => setProfile({ ...profile, education: e.target.value })}
                  className="form-textarea"
                  placeholder="Décrivez votre formation"
                  rows={3}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="experience" className="form-label">
                  <span className="label-icon">💼</span>
                  Expérience
                </label>
                <textarea
                  id="experience"
                  value={profile?.experience || ""}
                  onChange={(e) => setProfile({ ...profile, experience: e.target.value })}
                  className="form-textarea"
                  placeholder="Décrivez votre expérience professionnelle"
                  rows={3}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label htmlFor="skills" className="form-label">
                  <span className="label-icon">🔧</span>
                  Compétences
                </label>
                <textarea
                  id="skills"
                  value={profile?.skills || ""}
                  onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
                  className="form-textarea"
                  placeholder="Listez vos compétences (séparées par des virgules)"
                  rows={3}
                />
                <div className="field-hint">
                  <span className="hint-icon">💡</span>
                  Séparez les compétences par des virgules
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="primary-btn update-btn" disabled={isSavingProfile}>
                <span className="btn-icon">💾</span>
                {isSavingProfile ? "Mise à jour..." : "Mettre à jour"}
              </button>
            </div>
          </form>
        </section>

        <PasswordChangeCard />
      </div>
    </div>
  );
};

export default StudentProfilePage;
