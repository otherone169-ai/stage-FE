import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import client from "../api/client";

const WeeklyFollowUpPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [interns, setInterns] = useState([]);
  const [selectedIntern, setSelectedIntern] = useState(null);
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    weekNumber: "",
    commitHash: "",
    tasksSummary: "",
    challenges: ""
  });

  useEffect(() => {
    if (user?.role !== "student") {
      navigate("/login");
      return;
    }
    loadInterns();
  }, [user, navigate]);

  const loadInterns = async () => {
    try {
      setLoading(true);
      // Get interns from dashboard stats
      const response = await client.get("/workflow/dashboard/student");
      if (response.data.internships) {
        setInterns(response.data.internships);
        if (response.data.internships.length > 0) {
          setSelectedIntern(response.data.internships[0].id);
          loadFollowUps(response.data.internships[0].id);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load internships");
    } finally {
      setLoading(false);
    }
  };

  const loadFollowUps = async (internId) => {
    try {
      const response = await client.get(`/workflow/students/interns/${internId}/follow-ups`);
      setFollowUps(response.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load follow-ups");
    }
  };

  const handleSelectIntern = (internId) => {
    setSelectedIntern(internId);
    loadFollowUps(internId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedIntern) {
      setError("Veuillez sélectionner un stage");
      return;
    }

    try {
      setError("");
      await client.post("/workflow/students/interns/follow-up", {
        internId: selectedIntern,
        weekNumber: parseInt(formData.weekNumber),
        commitHash: formData.commitHash,
        tasksSummary: formData.tasksSummary,
        challenges: formData.challenges
      });

      setSuccess("Suivi hebdomadaire enregistré!");
      setFormData({
        weekNumber: "",
        commitHash: "",
        tasksSummary: "",
        challenges: ""
      });
      setShowForm(false);
      loadFollowUps(selectedIntern);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit follow-up");
    }
  };

  if (!user || user.role !== "student") {
    return <div className="page-wrapper"><p>Unauthorized</p></div>;
  }

  return (
    <div className="page-wrapper">
      <div className="card">
        <h2>Suivi hebdomadaire</h2>

        {error && <div className="form-error">{error}</div>}
        {success && <div className="form-success">{success}</div>}

        {loading ? (
          <p>Chargement...</p>
        ) : (
          <>
            <div style={{ marginBottom: "20px" }}>
              <label htmlFor="intern-select"><strong>Sélectionner un stage:</strong></label>
              <select
                id="intern-select"
                value={selectedIntern || ""}
                onChange={(e) => handleSelectIntern(e.target.value)}
                style={{ marginTop: "8px", padding: "8px", borderRadius: "8px", border: "1px solid var(--border)" }}
              >
                <option value="">-- Sélectionner --</option>
                {interns.map(intern => (
                  <option key={intern.id} value={intern.id}>
                    {intern.project_title || intern.title}
                  </option>
                ))}
              </select>
            </div>

            {!showForm ? (
              <button className="primary-btn" onClick={() => setShowForm(true)}>
                + Nouvelle entrée hebdomadaire
              </button>
            ) : (
              <form onSubmit={handleSubmit} className="stack-form">
                <input
                  type="number"
                  placeholder="Numéro de la semaine"
                  value={formData.weekNumber}
                  onChange={(e) => setFormData({ ...formData, weekNumber: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Hash du commit (optionnel)"
                  value={formData.commitHash}
                  onChange={(e) => setFormData({ ...formData, commitHash: e.target.value })}
                />
                <textarea
                  placeholder="Résumé des tâches réalisées"
                  value={formData.tasksSummary}
                  onChange={(e) => setFormData({ ...formData, tasksSummary: e.target.value })}
                  required
                />
                <textarea
                  placeholder="Défis rencontrés (optionnel)"
                  value={formData.challenges}
                  onChange={(e) => setFormData({ ...formData, challenges: e.target.value })}
                />
                <div style={{ display: "flex", gap: "8px" }}>
                  <button type="submit" className="primary-btn">Enregistrer</button>
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => setShowForm(false)}
                  >
                    Annuler
                  </button>
                </div>
              </form>
            )}

            <h3 style={{ marginTop: "24px" }}>Historique</h3>
            {followUps.length === 0 ? (
              <p>Aucune entrée</p>
            ) : (
              <div style={{ display: "grid", gap: "12px" }}>
                {followUps.map(followUp => (
                  <div key={followUp.id} style={{
                    padding: "12px",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    backgroundColor: "var(--bg-main)"
                  }}>
                    <strong>Semaine {followUp.week_number}</strong>
                    {followUp.commit_hash && (
                      <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                        Commit: {followUp.commit_hash}
                      </p>
                    )}
                    <p>{followUp.tasks_summary}</p>
                    {followUp.challenges && (
                      <p style={{ color: "var(--danger)" }}>Défis: {followUp.challenges}</p>
                    )}
                    <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                      {new Date(followUp.submitted_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default WeeklyFollowUpPage;
