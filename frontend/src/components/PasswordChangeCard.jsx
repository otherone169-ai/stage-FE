import { useState } from "react";
import apiClient from "../api/client";

const emptyForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: ""
};

const PasswordChangeCard = ({ email }) => {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (form.newPassword !== form.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    if (form.newPassword.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    try {
      setIsSaving(true);
      const { data } = await apiClient.post("/auth/password/change", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword
      });

      setMessage(data.message || "Mot de passe mis à jour avec succès.");
      setForm(emptyForm);
    } catch (err) {
      setError(err.response?.data?.message || "Échec de la mise à jour du mot de passe.");
    } finally {
      setIsSaving(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <section className="card security-card">
      <div className="card-header">
        <div className="security-header-content">
          <div className="security-icon">
            <span className="icon">🔐</span>
          </div>
          <div className="security-title">
            <h3>Account Security</h3>
            <p className="card-description">Update your password without leaving your session.</p>
          </div>
        </div>
      </div>
      
      {email && (
        <div className="current-user-info">
          <span className="info-icon">👤</span>
          <span className="user-email">{email}</span>
        </div>
      )}
      
      {error && (
        <div className="form-error">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}
      {message && (
        <div className="form-success">
          <span className="success-icon">✅</span>
          {message}
        </div>
      )}
      
      <form className="security-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-field">
            <label htmlFor="currentPassword" className="form-label">
              <span className="label-icon">🔑</span>
              Current password
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPasswords.current ? "text" : "password"}
                id="currentPassword"
                value={form.currentPassword}
                onChange={(event) => setForm((current) => ({ ...current, currentPassword: event.target.value }))}
                className="form-input"
                placeholder="Entrez votre mot de passe actuel"
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => togglePasswordVisibility('current')}
                title="Afficher/Masquer le mot de passe"
              >
                {showPasswords.current ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>
        </div>

        <div className="form-row">
          <div className="form-field">
            <label htmlFor="newPassword" className="form-label">
              <span className="label-icon">🔒</span>
              New password
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPasswords.new ? "text" : "password"}
                id="newPassword"
                value={form.newPassword}
                onChange={(event) => setForm((current) => ({ ...current, newPassword: event.target.value }))}
                className="form-input"
                placeholder="Entrez votre nouveau mot de passe"
                minLength={8}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => togglePasswordVisibility('new')}
                title="Afficher/Masquer le mot de passe"
              >
                {showPasswords.new ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>
        </div>

        <div className="form-row">
          <div className="form-field">
            <label htmlFor="confirmPassword" className="form-label">
              <span className="label-icon">🔒</span>
              Confirm new password
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPasswords.confirm ? "text" : "password"}
                id="confirmPassword"
                value={form.confirmPassword}
                onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                className="form-input"
                placeholder="Confirmez votre nouveau mot de passe"
                minLength={8}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => togglePasswordVisibility('confirm')}
                title="Afficher/Masquer le mot de passe"
              >
                {showPasswords.confirm ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="security-update-btn" disabled={isSaving}>
            <span className="btn-icon">🔄</span>
            {isSaving ? "Mise à jour..." : "Update Password"}
          </button>
        </div>
      </form>
    </section>
  );
};

export default PasswordChangeCard;
