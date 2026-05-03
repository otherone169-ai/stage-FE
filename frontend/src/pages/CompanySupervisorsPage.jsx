import { useEffect, useState } from "react";
import apiClient from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";

const CompanySupervisorsPage = () => {
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({
    email: "",
    password: "",
    fullName: "",
    position: ""
  });

  const loadSupervisors = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await apiClient.get("/companies/supervisors");
      setSupervisors(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Impossible de charger les superviseurs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSupervisors();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setNotice("");

      await apiClient.post("/companies/supervisors", {
        email: form.email.trim(),
        password: form.password,
        fullName: form.fullName.trim(),
        position: form.position.trim() || null
      });

      setForm({ email: "", password: "", fullName: "", position: "" });
      setNotice("Superviseur ajoute avec succes.");
      await loadSupervisors();
    } catch (err) {
      setError(err.response?.data?.message || "Creation du superviseur impossible");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Chargement des superviseurs..." />;
  }

  return (
    <div className="page-grid">
      <section className="card">
        <h3>Ajouter un superviseur</h3>
        <p className="card-meta">Creer un compte superviseur rattache a votre entreprise.</p>

        {error && <p className="form-error">{error}</p>}
        {notice && <p className="form-success">{notice}</p>}

        <form className="stack-form" onSubmit={handleSubmit}>
          <label>Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            required
          />

          <label>Mot de passe</label>
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            required
            minLength={8}
          />

          <label>Nom complet</label>
          <input
            value={form.fullName}
            onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
            required
          />

          <label>Poste</label>
          <input
            value={form.position}
            onChange={(event) => setForm((current) => ({ ...current, position: event.target.value }))}
            placeholder="Ex. Superviseur technique"
          />

          <button type="submit" className="primary-btn" disabled={saving}>
            {saving ? "Creation..." : "Ajouter le superviseur"}
          </button>
        </form>
      </section>

      <section className="card">
        <h3>Superviseurs de la company</h3>
        <p className="card-meta">Liste des superviseurs rattaches a votre entreprise.</p>

        <ul>
          {supervisors.map((supervisor) => (
            <li key={supervisor.id}>
              {supervisor.full_name} - {supervisor.email}
              {supervisor.position ? ` (${supervisor.position})` : ""}
            </li>
          ))}
        </ul>

        {supervisors.length === 0 && <p>Aucun superviseur pour le moment.</p>}
      </section>
    </div>
  );
};

export default CompanySupervisorsPage;