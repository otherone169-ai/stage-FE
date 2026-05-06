import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import { useAuth } from "../hooks/useAuth";
import FormField from "../components/FormField";
import PageLayout from "../components/PageLayout";
import EmptyState from "../components/EmptyState";

const buildInitialProjectForm = () => ({
  title: "",
  description: "",
  objectives: "",
  location: "",
  duration: "",
  domain: "",
  requirements: ""
});


const SupervisorMyProjectsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("projects");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [projectForm, setProjectForm] = useState(buildInitialProjectForm());
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!user || user.role !== "supervisor") {
      navigate("/app/login");
      return;
    }

    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [projectsResponse, studentsResponse] = await Promise.all([
        client.get("/api/projects"),
        client.get("/api/students")
      ]);
      setProjects(projectsResponse.data || []);
      setStudents(studentsResponse.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleProjectInputChange = (event) => {
    const { name, value } = event.target;
    setProjectForm((prev) => ({ ...prev, [name]: value }));
  };

  
  const handleProjectSubmit = async (event) => {
    event.preventDefault();

    if (!projectForm.title.trim()) {
      setError("Le titre du projet est requis");
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response = await client.post("/api/projects", {
        title: projectForm.title.trim(),
        description: projectForm.description.trim() || "",
        objectives: projectForm.objectives.trim() || "",
        location: projectForm.location.trim() || "",
        duration: projectForm.duration.trim() || "",
        domain: projectForm.domain.trim() || "",
        requirements: projectForm.requirements.trim() || "",
        tasks: projectForm.tasks
      });

      setSuccess(`Projet "${response.data.title}" créé avec succès.`);
      setProjectForm(buildInitialProjectForm());
      setShowCreateForm(false);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create project");
    }
  };

  
  const deleteProject = async (projectId) => {
    if (!window.confirm("Supprimer ce projet ?")) {
      return;
    }

    try {
      setError("");
      await client.delete(`/api/projects/${projectId}`);
      setSuccess("Projet supprimé");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete project");
    }
  };

  if (loading) {
    return (
      <div className="supervisor-projects-container">
        <div className="loading-spinner-professional">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <PageLayout 
      title="🏗️ Mes Projets & Stagiaires"
      subtitle="Gérez vos projets et assignez des stagiaires de manière professionnelle"
      actions={
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? "✖️ Annuler" : "➕ Créer un projet"}
        </button>
      }
    >
      {/* Professional Stats Grid */}
      <div className="projects-stats-grid">
        <div className="stat-card">
          <div className="stat-card-icon">📊</div>
          <div className="stat-card-value">{projects.length}</div>
          <div className="stat-card-label">Projets actifs</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">👥</div>
          <div className="stat-card-value">{students.filter(s => !s.assigned_project_id).length}</div>
          <div className="stat-card-label">Stagiaires disponibles</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">✅</div>
          <div className="stat-card-value">{students.filter(s => s.assigned_project_id).length}</div>
          <div className="stat-card-label">Stagiaires assignés</div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Projects Tab */}
      <div className="projects-grid">
        {projects.length === 0 ? (
          <div className="empty-state-professional stretched">
            <div className="empty-state-icon">📁</div>
            <h3 className="empty-state-title">Aucun projet</h3>
            <p className="empty-state-description">Commencez par créer votre premier projet pour encadrer vos stagiaires.</p>
          </div>
        ) : (
          projects.map((project) => (
            <div key={project.id} className="project-card">
              <div className="project-card-header">
                <h3 className="project-card-title">{project.title}</h3>
              </div>
              
              {project.description && (
                <p className="project-card-description">{project.description}</p>
              )}
              
              {project.objectives && (
                <div className="project-objectives">
                  <h4>🎯 Objectifs</h4>
                  <p>{project.objectives}</p>
                </div>
              )}

              <div className="project-card-meta">
                <div className="meta-item">
                  <span className="meta-label">📍 Localisation:</span>
                  <span>{project.location || "Non spécifiée"}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">⏱️ Durée:</span>
                  <span>{project.duration || "Non spécifiée"}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">🔧 Domaine:</span>
                  <span>{project.domain || "Non spécifié"}</span>
                </div>
              </div>

              <div className="project-card-stats">
                <div className="project-stat">
                  <span className="project-stat-value">{project.task_count || 0}</span>
                  <span className="project-stat-label">Tâches</span>
                </div>
                <div className="project-stat">
                  <span className="project-stat-value">{project.completed_task_count || 0}</span>
                  <span className="project-stat-label">Terminées</span>
                </div>
                <div className="project-stat">
                  <span className="project-stat-value">{project.interns_count || 0}</span>
                  <span className="project-stat-label">Stagiaires</span>
                </div>
              </div>

              {project.requirements && (
                <div className="project-requirements">
                  <h4>📋 Prérequis</h4>
                  <p>{project.requirements}</p>
                </div>
              )}

              <div className="project-card-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={() => deleteProject(project.id)}
                  aria-label={`Supprimer le projet ${project.title}`}
                >
                  🗑️ Supprimer
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateForm && (
        <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🏗️ Créer un nouveau projet</h3>
              <button 
                className="modal-close-btn"
                onClick={() => setShowCreateForm(false)}
                aria-label="Fermer"
              >
                ✖️
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleProjectSubmit} className="form-grid">
                <FormField
                  id="title"
                  label="Titre du projet *"
                  name="title"
                  value={projectForm.title}
                  onChange={handleProjectInputChange}
                  required
                  placeholder="Ex: Application Web de Gestion"
                />

                <FormField
                  id="description"
                  label="Description"
                  name="description"
                  value={projectForm.description}
                  onChange={handleProjectInputChange}
                  placeholder="Description détaillée du projet"
                  multiline
                />

                <FormField
                  id="objectives"
                  label="Objectifs"
                  name="objectives"
                  value={projectForm.objectives}
                  onChange={handleProjectInputChange}
                  placeholder="Objectifs à atteindre"
                  multiline
                />

                <FormField
                  id="location"
                  label="Localisation"
                  name="location"
                  value={projectForm.location}
                  onChange={handleProjectInputChange}
                  placeholder="Ex: Remote, Paris, etc."
                />

                <FormField
                  id="duration"
                  label="Durée"
                  name="duration"
                  value={projectForm.duration}
                  onChange={handleProjectInputChange}
                  placeholder="Ex: 3 mois, 6 semaines"
                />

                <FormField
                  id="domain"
                  label="Domaine"
                  name="domain"
                  value={projectForm.domain}
                  onChange={handleProjectInputChange}
                  placeholder="Ex: Développement Web, Marketing"
                />

                <FormField
                  id="requirements"
                  label="Prérequis"
                  name="requirements"
                  value={projectForm.requirements}
                  onChange={handleProjectInputChange}
                  placeholder="Compétences requises"
                  multiline
                />
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" 
                className="btn btn-secondary"
                onClick={() => setShowCreateForm(false)}
              >
                Annuler
              </button>
              <button type="submit" className="btn btn-primary" onClick={handleProjectSubmit}>
                ✅ Créer le projet
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
};

export default SupervisorMyProjectsPage;
