import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import { useAuth } from "../hooks/useAuth";
import FormField from "../components/FormField";
import PageLayout from "../components/PageLayout";

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
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [projectForm, setProjectForm] = useState(buildInitialProjectForm());
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!user || user.role !== "supervisor") {
      navigate("/app/dashboard");
      return;
    }

    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [projectsResponse, studentsResponse, pendingRes] = await Promise.all([
        client.get("/projects"),
        client.get("/supervisors/students"),
        client.get("/workflow/supervisors/pending-students")
      ]);
      setProjects(projectsResponse.data || []);
      setStudents(studentsResponse.data || []);
      setPendingCount((pendingRes.data || []).length);
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
      setError("Project title is required.");
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response = await client.post("/projects", {
        title: projectForm.title.trim(),
        description: projectForm.description.trim() || "",
        objectives: projectForm.objectives.trim() || "",
        location: projectForm.location.trim() || "",
        duration: projectForm.duration.trim() || "",
        domain: projectForm.domain.trim() || "",
        requirements: projectForm.requirements.trim() || ""
      });

      setSuccess(`Project "${response.data.title}" created successfully.`);
      setProjectForm(buildInitialProjectForm());
      setShowCreateForm(false);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create project");
    }
  };

  const deleteProject = async (projectId) => {
    if (!window.confirm("Delete this project?")) {
      return;
    }

    try {
      setError("");
      await client.delete(`/projects/${projectId}`);
      setSuccess("Project deleted.");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete project");
    }
  };

  if (loading) {
    return (
      <div className="supervisor-projects-container">
        <div className="loading-spinner-professional">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  return (
    <PageLayout
      title="My projects and interns"
      subtitle="Manage your projects and stagiaires."
      actions={
        <button className="btn btn-primary" onClick={() => setShowCreateForm((current) => !current)}>
          {showCreateForm ? "Cancel" : "Create a project"}
        </button>
      }
    >
      <div className="projects-stats-grid">
        <div className="stat-card">
          <div className="stat-card-value">{projects.length}</div>
          <div className="stat-card-label">Projects</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{pendingCount}</div>
          <div className="stat-card-label">Stagiaires en attente</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{students.filter((s) => s.assigned_project_id).length}</div>
          <div className="stat-card-label">Affectés à un projet</div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="projects-grid">
        {projects.length === 0 ? (
          <div className="empty-state-professional stretched">
            <h3>No projects yet</h3>
            <p>Create your first project, then assign pending stagiaires.</p>
          </div>
        ) : (
          projects.map((project) => (
            <div key={project.id} className="project-card">
              <div className="project-card-header">
                <div>
                  <h3 className="project-card-title">{project.title}</h3>
                </div>
              </div>

              {project.description && <p className="project-card-description">{project.description}</p>}

              <div className="project-card-meta">
                <div className="meta-item"><span className="meta-label">Location:</span><span>{project.location || "-"}</span></div>
                <div className="meta-item"><span className="meta-label">Duration:</span><span>{project.duration || "-"}</span></div>
                <div className="meta-item"><span className="meta-label">Domain:</span><span>{project.domain || "-"}</span></div>
              </div>

              <div className="project-card-stats">
                <div className="project-stat"><span className="project-stat-value">{project.task_count || 0}</span><span className="project-stat-label">Tasks</span></div>
                <div className="project-stat"><span className="project-stat-value">{project.completed_task_count || 0}</span><span className="project-stat-label">Done</span></div>
                <div className="project-stat"><span className="project-stat-value">{project.interns_count || 0}</span><span className="project-stat-label">Interns</span></div>
              </div>

              <div className="project-card-actions">
                <button className="btn btn-secondary" onClick={() => deleteProject(project.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showCreateForm && (
        <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Create a new project</h3>
              <button className="modal-close-btn" onClick={() => setShowCreateForm(false)} aria-label="Close">
                X
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleProjectSubmit} className="form-grid">
                <FormField id="title" label="Project title" name="title" value={projectForm.title} onChange={handleProjectInputChange} required />
                <FormField id="description" label="Description" name="description" value={projectForm.description} onChange={handleProjectInputChange} multiline />
                <FormField id="objectives" label="Objectives" name="objectives" value={projectForm.objectives} onChange={handleProjectInputChange} multiline />
                <FormField id="location" label="Location" name="location" value={projectForm.location} onChange={handleProjectInputChange} />
                <FormField id="duration" label="Duration" name="duration" value={projectForm.duration} onChange={handleProjectInputChange} />
                <FormField id="domain" label="Domain" name="domain" value={projectForm.domain} onChange={handleProjectInputChange} />
                <FormField id="requirements" label="Requirements" name="requirements" value={projectForm.requirements} onChange={handleProjectInputChange} multiline />
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowCreateForm(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={handleProjectSubmit}>
                Create project
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
};

export default SupervisorMyProjectsPage;
