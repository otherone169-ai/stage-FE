import { useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../api/client";
import AuthPageHeader from "../components/AuthPageHeader";
import AuthIllustration from "../components/AuthIllustration";
import FormField from "../components/FormField";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({});

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const getFieldError = (field, value) => {
    if (!touched[field]) return "";
    
    switch (field) {
      case "email":
        if (!value) return "L'email est requis";
        if (!validateEmail(value)) return "Format d'email invalide";
        return "";
      default:
        return "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    
    // Validate email
    const emailError = getFieldError("email", email);
    if (emailError) {
      setTouched({ email: true });
      setError("Veuillez corriger les erreurs dans le formulaire");
      return;
    }
    
    setLoading(true);

    try {
      const { data } = await apiClient.post("/auth/password-reset/request", { email });
      setMessage(data.message || "Si cet email existe, un lien a ete envoye.");
    } catch (err) {
      setError(err.response?.data?.message || "Impossible d envoyer le lien de reinitialisation");
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
              <h1>Mot de passe oublié</h1>
              <p>Entrez votre email pour recevoir un lien de réinitialisation.</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <FormField
                id="email"
                label="Adresse email"
                type="email"
                placeholder="nom@entreprise.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => handleBlur("email")}
                required
                error={getFieldError("email", email)}
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 8.5L12 13l9-4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              />

              {error && <div className="form-error">{error}</div>}
              {message && <div className="form-success">{message}</div>}

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? (
                  <>
                    <span className="loading-spinner" style={{ marginRight: '8px' }}></span>
                    Envoi en cours...
                  </>
                ) : (
                  "Envoyer le lien"
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

export default ForgotPasswordPage;
