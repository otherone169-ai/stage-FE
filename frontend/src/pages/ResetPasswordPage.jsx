import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import apiClient from "../api/client";

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const { data } = await apiClient.post("/auth/password-reset/confirm", {
        token,
        newPassword
      });
      setMessage(data.message || "Mot de passe reinitialise avec succes.");
      setNewPassword("");
    } catch (err) {
      setError(err.response?.data?.message || "Echec de la reinitialisation du mot de passe");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Reinitialiser le mot de passe</h1>
        <p>Definissez un nouveau mot de passe pour votre compte.</p>

        <form onSubmit={handleSubmit} className="stack-form">
          <label htmlFor="token">Token</label>
          <input
            id="token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
          />

          <label htmlFor="newPassword">Nouveau mot de passe</label>
          <input
            id="newPassword"
            type="password"
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          {error && <p className="form-error">{error}</p>}
          {message && <p className="form-success">{message}</p>}

          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? "Validation..." : "Reinitialiser"}
          </button>
        </form>

        <p className="auth-switch">
          Retour a la <Link to="/login">connexion</Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
