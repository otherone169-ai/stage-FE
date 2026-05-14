import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import apiClient from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";

const SupervisorAddInternPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [submittingAssign, setSubmittingAssign] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [projects, setProjects] = useState([]);
  const [pendingStudents, setPendingStudents] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [cvFile, setCvFile] = useState(null);

  const [createForm, setCreateForm] = useState({
    email: "",
    fullName: "",
    phone: "",
    education: "",
    skills: "",
    experience: ""
  });

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

  const handleCreateChange = (e) => {
    const { name, value } = e.target;
    setCreateForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ];
      if (!allowedTypes.includes(file.type)) {
        setError("Veuillez télécharger un fichier PDF ou Word (.doc, .docx)");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("La taille du fichier ne doit pas dépasser 5MB");
        return;
      }
      setCvFile(file);
      setError("");
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.email?.trim()) {
      setError("L'email est requis");
      return;
    }
    if (!cvFile) {
      setError("Le CV du stagiaire est obligatoire");
      return;
    }

    try {
      setSubmittingCreate(true);
      setError("");
      setSuccess("");

      const fd = new FormData();
      fd.append("email", createForm.email.trim());
      fd.append("fullName", createForm.fullName.trim());
      fd.append("phone", createForm.phone || "");
      fd.append("education", createForm.education || "");
      fd.append("skills", createForm.skills || "");
      fd.append("experience", createForm.experience || "");
      fd.append("cv", cvFile);

      await apiClient.post("/workflow/supervisors/students", fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setSuccess("Stagiaire créé. Il apparaît dans la liste des stagiaires en attente jusqu'à affectation à un projet.");
      setCreateForm({ email: "", fullName: "", phone: "", education: "", skills: "", experience: "" });
      setCvFile(null);
      await loadLists();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || "Échec de la création");
    } finally {
      setSubmittingCreate(false);
    }
  };

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
        <h1>Stagiaires</h1>
        <p>Créez des profils stagiaires puis affectez-les à un de vos projets.</p>
      </div>

      <div className="add-intern-container">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <section className="form-section card" style={{ marginBottom: "1.5rem" }}>
          <h3>Créer un stagiaire (profil en attente)</h3>
          <form onSubmit={handleCreateSubmit} className="add-intern-form">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={createForm.email}
                  onChange={handleCreateChange}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="fullName">Nom complet</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={createForm.fullName}
                  onChange={handleCreateChange}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Téléphone</label>
                <input type="tel" id="phone" name="phone" value={createForm.phone} onChange={handleCreateChange} className="form-input" />
              </div>
              <div className="form-group">
                <label htmlFor="education">Formation</label>
                <input type="text" id="education" name="education" value={createForm.education} onChange={handleCreateChange} className="form-input" />
              </div>
              <div className="form-group full-width">
                <label htmlFor="skills">Compétences</label>
                <input type="text" id="skills" name="skills" value={createForm.skills} onChange={handleCreateChange} className="form-input" />
              </div>
              <div className="form-group full-width">
                <label htmlFor="experience">Expérience</label>
                <textarea id="experience" name="experience" value={createForm.experience} onChange={handleCreateChange} rows={3} className="form-textarea" />
              </div>
              <div className="form-group full-width">
                <label htmlFor="cv">CV * (PDF ou Word, max 5 Mo)</label>
                <input type="file" id="cv" accept=".pdf,.doc,.docx" onChange={handleFileChange} className="form-file" />
                {cvFile && <p className="muted-cell">{cvFile.name}</p>}
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={submittingCreate}>
              {submittingCreate ? "Création…" : "Créer le stagiaire"}
            </button>
          </form>
        </section>

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

export default SupervisorAddInternPage;
