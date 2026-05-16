import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import apiClient from "../api/client";

const SupervisorAddInternPage = () => {
  const { user } = useAuth();
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [cvFile, setCvFile] = useState(null);

  const [createForm, setCreateForm] = useState({
    email: "",
    fullName: "",
    phone: "",
    education: "",
    skills: "",
    experience: ""
  });

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
    if (user?.role !== "supervisor") {
      return;
    }
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

      setSuccess(
        "Stagiaire créé. Il apparaît dans la liste des stagiaires en attente jusqu'à affectation à un projet. Utilisez « Affecter un stagiaire » pour l’associer à un projet."
      );
      setCreateForm({ email: "", fullName: "", phone: "", education: "", skills: "", experience: "" });
      setCvFile(null);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || "Échec de la création");
    } finally {
      setSubmittingCreate(false);
    }
  };

  return (
    <div className="add-intern-page">
      <div className="page-header">
        <h1>Ajouter un stagiaire</h1>
        <p>Créez un profil stagiaire en attente ; vous pourrez ensuite l’affecter à un projet depuis la page dédiée.</p>
      </div>

      <div className="add-intern-container">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <section className="form-section card">
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
      </div>
    </div>
  );
};

export default SupervisorAddInternPage;
