import { useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../api/client";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
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

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Mot de passe oublie</h1>
        <p>Entrez votre email pour recevoir un lien de reinitialisation.</p>

        <form onSubmit={handleSubmit} className="stack-form">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {error && <p className="form-error">{error}</p>}
          {message && <p className="form-success">{message}</p>}

          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? "Envoi..." : "Envoyer le lien"}
          </button>
        </form>

        <p className="auth-switch">
          Retour a la <Link to="/login">connexion</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
