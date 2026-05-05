import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import { useAuth } from "../hooks/useAuth";
import FormField from "../components/FormField";

const buildInitialProjectForm = () => ({
  title: "",
  description: "",
  objectives: "",
  location: "",
  duration: "",
  domain: "",
  requirements: "",
  tasks: []
});

const buildInitialTaskForm = () => ({
  title: "",
  description: ""
});

const SupervisorProjectsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [projectForm, setProjectForm] = useState(buildInitialProjectForm());
  const [taskForm, setTaskForm] = useState(buildInitialTaskForm());
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!user || user.role !== "supervisor") {
      navigate("/app/login");
      return;
    }

    loadProjects();
  }, [user, navigate]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await client.get("/api/projects");
      setProjects(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const handleProjectInputChange = (event) => {
    const { name, value } = event.target;
    setProjectForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleTaskInputChange = (event) => {
    const { name, value } = event.target;
    setTaskForm((prev) => ({ ...prev, [name]: value }));
  };

  const addTask = () => {
    if (taskForm.title.trim()) {
      setProjectForm((prev) => ({
        ...prev,
        tasks: [...prev.tasks, { ...taskForm, title: taskForm.title.trim() }]
      }));
      setTaskForm(buildInitialTaskForm());
    }
  };

  const removeTask = (index) => {
    setProjectForm((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((_, i) => i !== index)
    }));
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
      await loadProjects();
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
      await loadProjects();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete project");
    }
  };

  if (loading) {
    return <div className="loading-spinner">Chargement...</div>;
  }

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1>🏗️ Mes Projets</h1>
        <p className="page-subtitle">
          Gérez vos projets et assignez des tâches aux stagiaires
        </p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="actions-bar">
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? "Annuler" : "➕ Créer un projet"}
        </button>
      </div>

      {showCreateForm && (
        <div className="card">
          <h2>🏗️ Créer un nouveau projet</h2>
          <p className="section-subtitle">
            Définissez le cadre de travail pour vos stagiaires
          </p>

          <form onSubmit={handleProjectSubmit} className="stack-form">
            <div className="form-grid">
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
            </div>

            <div className="tasks-section">
              <h3>📝 Tâches initiales</h3>
              <div className="task-input-group">
                <FormField
                  id="taskTitle"
                  label="Titre de la tâche"
                  name="title"
                  value={taskForm.title}
                  onChange={handleTaskInputChange}
                  placeholder="Ex: Configuration de l'environnement"
                />
                <FormField
                  id="taskDescription"
                  label="Description"
                  name="description"
                  value={taskForm.description}
                  onChange={handleTaskInputChange}
                  placeholder="Description de la tâche"
                  multiline
                />
                <button type="button" className="btn btn-secondary" onClick={addTask}>
                  ➕ Ajouter la tâche
                </button>
              </div>

              {projectForm.tasks.length > 0 && (
                <div className="tasks-list">
                  <h4>Tâches à créer ({projectForm.tasks.length})</h4>
                  {projectForm.tasks.map((task, index) => (
                    <div key={index} className="task-item">
                      <strong>{task.title}</strong>
                      {task.description && <p>{task.description}</p>}
                      <button 
                        type="button" 
                        className="btn btn-danger btn-sm"
                        onClick={() => removeTask(index)}
                      >
                        ❌ Supprimer
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                ✅ Créer le projet
              </button>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setShowCreateForm(false)}
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="projects-list">
        {projects.length === 0 ? (
          <div className="empty-state">
            <h3>Aucun projet</h3>
            <p>Commencez par créer votre premier projet pour encadrer vos stagiaires.</p>
          </div>
        ) : (
          projects.map((project) => (
            <div key={project.id} className="project-card">
              <div className="project-header">
                <h3>{project.title}</h3>
                <div className="project-actions">
                  <button className="btn btn-secondary btn-sm">
                    👥 Assigner des stagiaires
                  </button>
                  <button 
                    className="btn btn-danger btn-sm"
                    onClick={() => deleteProject(project.id)}
                  >
                    🗑️ Supprimer
                  </button>
                </div>
              </div>
              
              {project.description && (
                <p className="project-description">{project.description}</p>
              )}
              
              {project.objectives && (
                <div className="project-objectives">
                  <h4>🎯 Objectifs</h4>
                  <p>{project.objectives}</p>
                </div>
              )}

              <div className="project-meta">
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

              <div className="project-stats">
                <div className="stat">
                  <span className="stat-number">{project.task_count || 0}</span>
                  <span className="stat-label">Tâches</span>
                </div>
                <div className="stat">
                  <span className="stat-number">{project.completed_task_count || 0}</span>
                  <span className="stat-label">Terminées</span>
                </div>
                <div className="stat">
                  <span className="stat-number">{project.interns_count || 0}</span>
                  <span className="stat-label">Stagiaires</span>
                </div>
              </div>

              {project.requirements && (
                <div className="project-requirements">
                  <h4>📋 Prérequis</h4>
                  <p>{project.requirements}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SupervisorProjectsPage;
