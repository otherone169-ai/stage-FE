import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../hooks/useAuth";

const LoginPage = () => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const from = location.state?.from?.pathname || "/app/dashboard";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const result = await login(email, password);
    if (!result.ok) {
      setError(result.message);
      return;
    }

    navigate(from, { replace: true });
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Connexion</h1>
        <p>Accedez a la plateforme de gestion des stagiaires.</p>

        <form onSubmit={handleSubmit} className="stack-form">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="password">Mot de passe</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className="form-error">{error}</p>}

          <button type="submit" disabled={isLoading} className="primary-btn">
            {isLoading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        {isLoading && <LoadingSpinner label="Verification des identifiants..." />}

        <p className="auth-switch">
          Nouveau compte ? <Link to="/register">S inscrire</Link>
        </p>
        <p className="auth-switch">
          Mot de passe oublie ? <Link to="/forgot-password">Reinitialiser</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
