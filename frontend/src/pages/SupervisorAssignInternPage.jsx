import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import apiClient from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";

const SupervisorAssignInternPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submittingAssign, setSubmittingAssign] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [projects, setProjects] = useState([]);
  const [pendingStudents, setPendingStudents] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");

  const loadLists = useCallback(async () => {
    try {
      setLoading(true);
      const [projRes, pendRes] = await Promise.all([
        apiClient.get("/projects"),
        apiClient.get("/workflow/supervisors/pending-students")
      ]);
      setProjects(projRes.data || []);
      setPendingStudents(pendRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || "Impossible de charger les données");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === "supervisor") {
      loadLists();
    }
  }, [user, loadLists]);

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProjectId || !selectedStudentId) {
      setError("Sélectionnez un projet et un stagiaire en attente");
      return;
    }

    try {
      setSubmittingAssign(true);
      setError("");
      setSuccess("");

      await apiClient.post("/projects/assign", {
        projectId: selectedProjectId,
        studentId: selectedStudentId
      });

      setSuccess("Stagiaire affecté au projet.");
      setSelectedProjectId("");
      setSelectedStudentId("");
      await loadLists();
      setTimeout(() => navigate("/app/supervisor/my-projects"), 1500);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || "Échec de l'affectation");
    } finally {
      setSubmittingAssign(false);
    }
  };

  if (loading && projects.length === 0 && pendingStudents.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="add-intern-page">
      <div className="page-header">
        <h1>Affecter un stagiaire</h1>
        <p>Associez un stagiaire en attente à l’un de vos projets.</p>
      </div>

      <div className="add-intern-container">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <section className="form-section card">
          <h3>Affecter un stagiaire en attente à un projet</h3>
          <p className="muted-cell">Seuls les stagiaires que vous avez créés et sans mission active ou en pause sont listés.</p>
          <form onSubmit={handleAssignSubmit} className="add-intern-form">
            <div className="form-group">
              <label htmlFor="projectId">Projet *</label>
              <select
                id="projectId"
                value={selectedProjectId}
                onChange={(ev) => setSelectedProjectId(ev.target.value)}
                className="form-select"
                required
              >
                <option value="">Choisir un projet</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="studentId">Stagiaire en attente *</label>
              <select
                id="studentId"
                value={selectedStudentId}
                onChange={(ev) => setSelectedStudentId(ev.target.value)}
                className="form-select"
                required
              >
                <option value="">Choisir un stagiaire</option>
                {pendingStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name || s.email} ({s.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => navigate("/app/supervisor/my-projects")}>
                Retour
              </button>
              <button type="submit" className="btn-primary" disabled={submittingAssign}>
                {submittingAssign ? "Affectation…" : "Affecter au projet"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};

export default SupervisorAssignInternPage;
