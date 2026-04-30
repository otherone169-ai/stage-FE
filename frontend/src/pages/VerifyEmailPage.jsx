import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import apiClient from "../api/client";

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [token, setToken] = useState(tokenFromUrl);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const verifyEmail = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const { data } = await apiClient.post("/auth/email-verification/confirm", { token });
      setMessage(data.message || "Email verifie avec succes.");
    } catch (err) {
      setError(err.response?.data?.message || "Impossible de verifier cet email");
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const { data } = await apiClient.post("/auth/email-verification/request", { email });
      setMessage(data.message || "Lien de verification envoye.");
    } catch (err) {
      setError(err.response?.data?.message || "Impossible d envoyer le lien de verification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Verification de l email</h1>
        <p>Validez votre compte avec le token recu par email.</p>

        <form onSubmit={verifyEmail} className="stack-form">
          <label htmlFor="token">Token de verification</label>
          <input
            id="token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
          />

          {error && <p className="form-error">{error}</p>}
          {message && <p className="form-success">{message}</p>}

          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? "Verification..." : "Verifier mon email"}
          </button>
        </form>

        <hr className="auth-divider" />

        <form onSubmit={resendVerification} className="stack-form">
          <label htmlFor="email">Renvoyer le lien a cet email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button type="submit" className="ghost-btn" disabled={loading}>
            {loading ? "Envoi..." : "Renvoyer le lien"}
          </button>
        </form>

        <p className="auth-switch">
          Retour a la <Link to="/login">connexion</Link>
        </p>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
