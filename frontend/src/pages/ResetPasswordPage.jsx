import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import apiClient from "../api/client";
import AuthPageHeader from "../components/AuthPageHeader";
import AuthIllustration from "../components/AuthIllustration";
import FormField from "../components/FormField";

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const calculatePasswordStrength = (password) => {
    if (!password) return { strength: 0, level: 'weak' };
    
    let strength = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      numbers: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    Object.values(checks).forEach(passed => {
      if (passed) strength++;
    });
    
    let level = 'weak';
    if (strength >= 4) level = 'strong';
    else if (strength >= 2) level = 'medium';
    
    return { strength, level };
  };

  const getFieldError = (field, value) => {
    if (!touched[field]) return "";
    
    switch (field) {
      case "token":
        if (!value) return "Le code de réinitialisation est requis";
        if (value.length < 6) return "Code invalide";
        return "";
      case "newPassword":
        if (!value) return "Le nouveau mot de passe est requis";
        if (value.length < 8) return "Le mot de passe doit contenir au moins 8 caractères";
        return "";
      case "confirmPassword":
        if (!value) return "La confirmation du mot de passe est requise";
        if (value !== newPassword) return "Les mots de passe ne correspondent pas";
        return "";
      default:
        return "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    
    // Validate all fields
    const tokenError = getFieldError("token", token);
    const passwordError = getFieldError("newPassword", newPassword);
    const confirmError = getFieldError("confirmPassword", confirmPassword);
    
    if (tokenError || passwordError || confirmError) {
      setTouched({ token: true, newPassword: true, confirmPassword: true });
      setError("Veuillez corriger les erreurs dans le formulaire");
      return;
    }
    
    setLoading(true);

    try {
      const { data } = await apiClient.post("/auth/password-reset/confirm", {
        token,
        newPassword
      });
      setMessage(data.message || "Mot de passe réinitialisé avec succès.");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.response?.data?.message || "Échec de la réinitialisation du mot de passe");
    } finally {
      setLoading(false);
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  return (
    <div className="auth-page-shell">
      <AuthPageHeader />

      <div className="auth-layout">
        <div className="auth-visual">
          <AuthIllustration />
        </div>

        <div className="auth-form-container">
          <div className="auth-card">
            <div className="auth-header">
              <h1>Réinitialiser le mot de passe</h1>
              <p>Définissez un nouveau mot de passe pour votre compte.</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <FormField
                id="token"
                label="Code de réinitialisation"
                placeholder="Copiez le code reçu par email"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                onBlur={() => handleBlur("token")}
                required
                error={getFieldError("token", token)}
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="11" width="18" height="10" rx="2" stroke="currentColor" strokeWidth="1.6"/><path d="M7 11V8a5 5 0 0110 0v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              />

              <FormField
                id="newPassword"
                label="Nouveau mot de passe"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onBlur={() => handleBlur("newPassword")}
                required
                error={getFieldError("newPassword", newPassword)}
                showPasswordStrength={true}
                passwordStrength={calculatePasswordStrength(newPassword)}
                hint="Minimum 8 caractères. Incluez majuscules, chiffres et symboles pour plus de sécurité."
                icon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="auth-icon-btn"
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6"/>
                        <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                      </svg>
                    )}
                  </button>
                }
              />

              <FormField
                id="confirmPassword"
                label="Confirmer le mot de passe"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => handleBlur("confirmPassword")}
                required
                error={getFieldError("confirmPassword", confirmPassword)}
                icon={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="auth-icon-btn"
                  >
                    {showConfirmPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6"/>
                        <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                      </svg>
                    )}
                  </button>
                }
              />

              {error && <div className="form-error">{error}</div>}
              {message && <div className="form-success">{message}</div>}

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? (
                  <>
                    <span className="loading-spinner" style={{ marginRight: '8px' }}></span>
                    Validation en cours...
                  </>
                ) : (
                  "Réinitialiser"
                )}
              </button>
            </form>

            <div className="auth-footer">
              <p className="auth-link-group">
                Retour à la <Link to="/login" className="auth-link">connexion</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
