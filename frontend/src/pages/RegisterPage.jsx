import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../hooks/useAuth";

const RegisterPage = () => {
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    companyName: "",
    email: "",
    password: "",
    role: "student",
    location: "",
    website: ""
  });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");

    const payload = {
      email: form.email,
      password: form.password,
      role: form.role,
      fullName: form.role === "student" ? form.fullName : undefined,
      companyName: form.role === "company" ? form.companyName : undefined,
      location: form.role === "company" ? form.location : undefined,
      website: form.role === "company" ? form.website : undefined
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
    <div className="auth-page">
      <div className="auth-card">
        <h1>Inscription</h1>
        <p>Creez un compte selon votre role.</p>

        <form onSubmit={handleSubmit} className="stack-form">
          {form.role === "student" && (
            <>
              <label htmlFor="fullName">Nom complet</label>
              <input
                id="fullName"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                required
              />
            </>
          )}

          {form.role === "company" && (
            <>
              <label htmlFor="companyName">Nom entreprise</label>
              <input
                id="companyName"
                name="companyName"
                value={form.companyName}
                onChange={handleChange}
                required
              />
            </>
          )}

          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" value={form.email} onChange={handleChange} required />

          <label htmlFor="password">Mot de passe</label>
          <input
            id="password"
            name="password"
            type="password"
            minLength={8}
            value={form.password}
            onChange={handleChange}
            required
          />

          <label htmlFor="role">Role</label>
          <select id="role" name="role" value={form.role} onChange={handleChange}>
            <option value="student">Stagiaire</option>
            <option value="company">Entreprise</option>
          </select>

          {form.role === "company" && (
            <>
              <label htmlFor="location">Localisation</label>
              <input
                id="location"
                name="location"
                value={form.location}
                onChange={handleChange}
              />
              <label htmlFor="website">Website</label>
              <input id="website" name="website" value={form.website} onChange={handleChange} />
            </>
          )}

          {error && <p className="form-error">{error}</p>}
          {notice && <p className="form-success">{notice}</p>}

          <button type="submit" disabled={isLoading} className="primary-btn">
            {isLoading ? "Creation..." : "Creer un compte"}
          </button>
        </form>

        {isLoading && <LoadingSpinner label="Creation du compte..." />}

        <p className="auth-switch">
          Deja inscrit ? <Link to="/login">Se connecter</Link>
        </p>

        {notice && (
          <p className="auth-switch">
            Puis <Link to="/verify-email">verifier votre email</Link> avant de vous connecter.
          </p>
        )}
      </div>
    </div>
  );
};

export default RegisterPage;
