import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import LoadingSpinner from "../components/LoadingSpinner";
import AuthPageHeader from "../components/AuthPageHeader";
import FormField from "../components/FormField";
import { useAuth } from "../hooks/useAuth";

const LoginPage = () => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const from = location.state?.from?.pathname || "/app/dashboard";

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
      case "password":
        if (!value) return "Le mot de passe est requis";
        if (value.length < 6) return "Le mot de passe doit contenir au moins 6 caractères";
        return "";
      default:
        return "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    
    // Validate all fields
    const emailError = getFieldError("email", email);
    const passwordError = getFieldError("password", password);
    
    if (emailError || passwordError) {
      setTouched({ email: true, password: true });
      setError("Veuillez corriger les erreurs dans le formulaire");
      return;
    }

    const result = await login(email, password);
    if (!result.ok) {
      setError(result.message);
      return;
    }

    navigate(from, { replace: true });
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  return (
    <div className="auth-page-shell">
      <AuthPageHeader />

      <div className="auth-layout">
        <div className="auth-visual auth-image" />

        <div className="auth-form-container">
          <div className="auth-card">
            <div className="auth-header">
              <h1>Connexion</h1>
              <p>Accédez à votre compte StageFlow pour gérer vos projets de stage.</p>
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

              <FormField
                id="password"
                label="Mot de passe"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => handleBlur("password")}
                required
                error={getFieldError("password", password)}
                icon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
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

              {error && <div className="form-error">{error}</div>}
              <button 
                type="submit" 
                disabled={isLoading} 
                className="auth-submit-btn"
              >
                {isLoading ? (
                  <>
                    <span className="loading-spinner" style={{ marginRight: '8px' }}></span>
                    Connexion en cours...
                  </>
                ) : (
                  "Se connecter"
                )}
              </button>

              <div className="social-divider">
                <div style={{flex:1,height:1,background:'var(--border)'}} />
                <span>ou</span>
                <div style={{flex:1,height:1,background:'var(--border)'}} />
              </div>

              <div className="social-row">
                <button type="button" className="social-btn google">
                  <img src="https://www.svgrepo.com/show/355037/google.svg" alt="Google" style={{width:18,height:18}} />
                  Continuer avec Google
                </button>
              </div>
            </form>

            {isLoading && <LoadingSpinner label="Vérification des identifiants..." />}

            <div className="auth-footer">
              <p className="auth-link-group">
                Nouveau compte ? <Link to="/register" className="auth-link">S'inscrire</Link>
              </p>
              <p className="auth-link-group">
                Mot de passe oublié ? <Link to="/forgot-password" className="auth-link">Réinitialiser</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
