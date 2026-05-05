import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import apiClient from "../api/client";
import AuthPageHeader from "../components/AuthPageHeader";
import AuthIllustration from "../components/AuthIllustration";
import FormField from "../components/FormField";

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [token, setToken] = useState(tokenFromUrl);
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
      case "token":
        if (!value) return "Le code de vérification est requis";
        if (value.length < 6) return "Code invalide";
        return "";
      case "email":
        if (!value) return "L'email est requis";
        if (!validateEmail(value)) return "Format d'email invalide";
        return "";
      default:
        return "";
    }
  };

  const verifyEmail = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    
    // Validate token
    const tokenError = getFieldError("token", token);
    if (tokenError) {
      setTouched({ token: true });
      setError("Veuillez corriger les erreurs dans le formulaire");
      return;
    }
    
    setLoading(true);

    try {
      const { data } = await apiClient.post("/auth/email-verification/confirm", { token });
      setMessage(data.message || "Email vérifié avec succès.");
    } catch (err) {
      setError(err.response?.data?.message || "Impossible de vérifier cet email");
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async (event) => {
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
      const { data } = await apiClient.post("/auth/email-verification/request", { email });
      setMessage(data.message || "Lien de vérification envoyé.");
    } catch (err) {
      setError(err.response?.data?.message || "Impossible d'envoyer le lien de vérification");
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
              <h1>Vérification de l'email</h1>
              <p>Validez votre compte avec le code reçu par email.</p>
            </div>

            <form onSubmit={verifyEmail} className="auth-form">
              <FormField
                id="token"
                label="Code de vérification"
                placeholder="Copiez le code reçu par email"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                onBlur={() => handleBlur("token")}
                required
                error={getFieldError("token", token)}
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="11" width="18" height="10" rx="2" stroke="currentColor" strokeWidth="1.6"/><path d="M7 11V8a5 5 0 0110 0v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              />

              {error && <div className="form-error">{error}</div>}
              {message && <div className="form-success">{message}</div>}

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? (
                  <>
                    <span className="loading-spinner" style={{ marginRight: '8px' }}></span>
                    Vérification en cours...
                  </>
                ) : (
                  "Vérifier mon email"
                )}
              </button>
            </form>

            <div style={{ margin: '24px 0', padding: '24px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
              <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
                Ou renvoyer le lien de vérification
              </p>
              
              <form onSubmit={resendVerification} className="auth-form">
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

                <button 
                  type="submit" 
                  className="auth-submit-btn" 
                  disabled={loading}
                  style={{ background: 'var(--accent)', opacity: 0.8 }}
                >
                  {loading ? (
                    <>
                      <span className="loading-spinner" style={{ marginRight: '8px' }}></span>
                      Envoi en cours...
                    </>
                  ) : (
                    "Renvoyer le lien"
                  )}
                </button>
              </form>
            </div>

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

export default VerifyEmailPage;
