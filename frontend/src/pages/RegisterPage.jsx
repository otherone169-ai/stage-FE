import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import LoadingSpinner from "../components/LoadingSpinner";
import AuthPageHeader from "../components/AuthPageHeader";
import FormField from "../components/FormField";
import { useAuth } from "../hooks/useAuth";

const RegisterPage = () => {
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    companyName: "",
    position: "",
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

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
      case "fullName":
        if (!value) return "Le nom complet est requis";
        if (value.length < 2) return "Le nom doit contenir au moins 2 caractères";
        return "";
      case "companyName":
        if (!value) return "Le nom de l'entreprise est requis";
        return "";
      case "position":
        if (!value) return "Le poste est requis";
        return "";
      case "email":
        if (!value) return "L'email est requis";
        if (!validateEmail(value)) return "Format d'email invalide";
        return "";
      case "password":
        if (!value) return "Le mot de passe est requis";
        if (value.length < 8) return "Le mot de passe doit contenir au moins 8 caractères";
        return "";
      default:
        return "";
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");

    const fields = ["fullName", "companyName", "position", "email", "password"];
    const hasInvalidData =
      !form.fullName ||
      form.fullName.length < 2 ||
      !form.companyName ||
      !form.position ||
      !form.email ||
      !validateEmail(form.email) ||
      !form.password ||
      form.password.length < 8;

    if (hasInvalidData) {
      setTouched(fields.reduce((acc, field) => ({ ...acc, [field]: true }), {}));
      setError("Veuillez corriger les erreurs dans le formulaire");
      return;
    }

    const payload = {
      email: form.email,
      password: form.password,
      fullName: form.fullName,
      companyName: form.companyName,
      position: form.position
    };

    const result = await register(payload);
    if (!result.ok) {
      setError(result.message);
      return;
    }

    if (result.requiresEmailVerification) {
      setNotice(result.message || "Un email de verification a ete envoye.");
      return;
    }

    navigate("/app/dashboard", { replace: true });
  };

  return (
    <div className="auth-page-shell">
      <AuthPageHeader />

      <div className="auth-layout auth-layout-single">
        <div className="auth-form-container">
          <div className="auth-card">
            <div className="auth-header">
              <h1>Inscription Superviseur</h1>
              <p>Créez votre accès superviseur pour gérer les stages, projets et suivis.</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <FormField
                id="fullName"
                label="Nom complet"
                name="fullName"
                placeholder="Jean Dupont"
                value={form.fullName}
                onChange={handleChange}
                onBlur={() => handleBlur("fullName")}
                required
                error={getFieldError("fullName", form.fullName)}
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 12a5 5 0 100-10 5 5 0 000 10zM3 21a9 9 0 0118 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              />

              <FormField
                id="companyName"
                label="Entreprise"
                name="companyName"
                placeholder="Acme Corporation"
                value={form.companyName}
                onChange={handleChange}
                onBlur={() => handleBlur("companyName")}
                required
                error={getFieldError("companyName", form.companyName)}
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M7 7V5a2 2 0 012-2h6a2 2 0 012 2v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              />

              <FormField
                id="position"
                label="Poste"
                name="position"
                placeholder="Responsable de stage"
                value={form.position}
                onChange={handleChange}
                onBlur={() => handleBlur("position")}
                error={getFieldError("position", form.position)}
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 12v6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 8h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              />

              <FormField
                id="email"
                label="Adresse email"
                name="email"
                type="email"
                placeholder="nom@entreprise.com"
                value={form.email}
                onChange={handleChange}
                onBlur={() => handleBlur("email")}
                required
                error={getFieldError("email", form.email)}
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 8.5L12 13l9-4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              />

              <FormField
                id="password"
                label="Mot de passe"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                minLength={8}
                value={form.password}
                onChange={handleChange}
                onBlur={() => handleBlur("password")}
                required
                error={getFieldError("password", form.password)}
                showPasswordStrength={true}
                passwordStrength={calculatePasswordStrength(form.password)}
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

              {error && <div className="form-error">{error}</div>}
              {notice && <div className="form-success">{notice}</div>}

              <button type="submit" disabled={isLoading} className="auth-submit-btn">
                {isLoading ? (
                  <>
                    <span className="loading-spinner" style={{ marginRight: '8px' }}></span>
                    Création en cours...
                  </>
                ) : (
                  "Créer le compte superviseur"
                )}
              </button>

            </form>

            {isLoading && <LoadingSpinner label="Création du compte..." />}

            <div className="auth-footer">
              <p className="auth-link-group">
                Déjà inscrit ? <Link to="/login" className="auth-link">Se connecter</Link>
              </p>
              {notice && (
                <p className="auth-link-group">
                  Puis <Link to="/verify-email" className="auth-link">vérifier votre email</Link> avant de vous connecter.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
