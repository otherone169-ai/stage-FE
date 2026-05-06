import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import apiClient from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";

const SupervisorAddInternPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [internships, setInternships] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedInternship, setSelectedInternship] = useState("");
  const [cvFile, setCvFile] = useState(null);

  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    phone: "",
    education: "",
    skills: "",
    experience: "",
    startDate: "",
    endDate: "",
    projectId: ""
  });

  useEffect(() => {
    const loadInternships = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get("/workflow/supervisors/internships");
        setInternships(response.data || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load internships");
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === "supervisor") {
      loadInternships();
    }
  }, [user]);

  useEffect(() => {
    if (selectedInternship) {
      const loadProjects = async () => {
        try {
          const response = await apiClient.get(`/api/projects?internship_id=${selectedInternship}`);
          setProjects(response.data || []);
        } catch (err) {
          console.error("Failed to load projects:", err);
        }
      };
      loadProjects();
    } else {
      setProjects([]);
      setFormData(prev => ({ ...prev, projectId: "" }));
    }
  }, [selectedInternship]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setError("Veuillez télécharger un fichier PDF ou Word (.doc, .docx)");
        return;
      }
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError("La taille du fichier ne doit pas dépasser 5MB");
        return;
      }
      setCvFile(file);
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedInternship) {
      setError("Veuillez sélectionner un stage");
      return;
    }

    if (!formData.email || !formData.fullName) {
      setError("L'email et le nom complet sont requis");
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      setError("Les dates de début et de fin du stage sont obligatoires");
      return;
    }

    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      setError("La date de fin doit être postérieure à la date de début");
      return;
    }

    if (!cvFile) {
      setError("Le CV du stagiaire est obligatoire");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const formDataToSend = new FormData();
      formDataToSend.append('email', formData.email);
      formDataToSend.append('fullName', formData.fullName);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('education', formData.education);
      formDataToSend.append('skills', formData.skills);
      formDataToSend.append('experience', formData.experience);
      formDataToSend.append('startDate', formData.startDate);
      formDataToSend.append('endDate', formData.endDate);
      
      if (formData.projectId) {
        formDataToSend.append('projectId', formData.projectId);
      }
      
      if (cvFile) {
        formDataToSend.append('cv', cvFile);
      }

      const response = await apiClient.post(
        `/workflow/supervisors/internships/${selectedInternship}/students`,
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setSuccess(`Stagiaire "${formData.fullName}" ajouté avec succès!`);
      
      // Reset form
      setFormData({
        email: "",
        fullName: "",
        phone: "",
        education: "",
        skills: "",
        experience: "",
        startDate: "",
        endDate: "",
        projectId: ""
      });
      setCvFile(null);
      setSelectedInternship("");
      
      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/app/supervisor/my-projects');
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || "Failed to add intern");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="add-intern-page">
      <div className="page-header">
        <h1>➕ Ajouter un stagiaire</h1>
        <p>Ajoutez un nouveau stagiaire à votre équipe</p>
      </div>

      <div className="add-intern-container">
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="add-intern-form">
          {/* Stage Selection */}
          <div className="form-section">
            <h3>📋 Sélection du stage</h3>
            <div className="form-group">
              <label htmlFor="internship">Stage *</label>
              <select
                id="internship"
                value={selectedInternship}
                onChange={(e) => setSelectedInternship(e.target.value)}
                required
                className="form-select"
              >
                <option value="">Sélectionnez un stage</option>
                {internships.map(internship => (
                  <option key={internship.id} value={internship.id}>
                    {internship.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Project Selection */}
          {projects.length > 0 && (
            <div className="form-section">
              <h3>🏗️ Sélection du projet</h3>
              <div className="form-group">
                <label htmlFor="projectId">Projet (optionnel)</label>
                <select
                  id="projectId"
                  name="projectId"
                  value={formData.projectId}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="">Créer un nouveau projet automatiquement</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Student Information */}
          <div className="form-section">
            <h3>👤 Informations du stagiaire</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="stagiaire@exemple.com"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="fullName">Nom complet *</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                  placeholder="Jean Dupont"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Téléphone</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+216XXXXXXXXX"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="education">Formation</label>
                <input
                  type="text"
                  id="education"
                  name="education"
                  value={formData.education}
                  onChange={handleInputChange}
                  placeholder="Master en informatique"
                  className="form-input"
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="skills">Compétences</label>
                <input
                  type="text"
                  id="skills"
                  name="skills"
                  value={formData.skills}
                  onChange={handleInputChange}
                  placeholder="React, Node.js, PostgreSQL"
                  className="form-input"
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="experience">Expérience</label>
                <textarea
                  id="experience"
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  placeholder="Description de l'expérience professionnelle..."
                  rows="3"
                  className="form-textarea"
                />
              </div>
            </div>
          </div>

          {/* Duration */}
          <div className="form-section">
            <h3>📅 Durée du stage</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="startDate">Date de début *</label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="endDate">Date de fin *</label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* CV Upload */}
          <div className="form-section">
            <h3>📄 CV du stagiaire</h3>
            <div className="form-group">
              <label htmlFor="cv">CV * (PDF ou Word, max 5MB)</label>
              <input
                type="file"
                id="cv"
                name="cv"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx"
                required
                className="form-file"
              />
              {cvFile && (
                <div className="file-info">
                  <span>📎 {cvFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setCvFile(null)}
                    className="btn-remove-file"
                  >
                    ✖
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/app/supervisor/my-projects')}
              className="btn-secondary"
              disabled={submitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Ajout en cours...' : '➕ Ajouter le stagiaire'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupervisorAddInternPage;
