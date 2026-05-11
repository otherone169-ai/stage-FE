import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import { useAuth } from "../hooks/useAuth";
import FormField from "../components/FormField";

const buildInitialProjectForm = () => ({
  internshipId: "",
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
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [projectForm, setProjectForm] = useState(buildInitialProjectForm());
  const [taskForm, setTaskForm] = useState(buildInitialTaskForm());
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
      const [projectsResponse, internshipsResponse] = await Promise.all([
        client.get("/projects"),
        client.get("/internships/my")
      ]);
      setProjects(projectsResponse.data || []);
      setInternships(internshipsResponse.data || []);
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
    if (!taskForm.title.trim()) {
      return;
    }

    setProjectForm((prev) => ({
      ...prev,
      tasks: [...prev.tasks, { title: taskForm.title.trim(), description: taskForm.description.trim() }]
    }));
    setTaskForm(buildInitialTaskForm());
  };

  const removeTask = (index) => {
    setProjectForm((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((_, currentIndex) => currentIndex !== index)
    }));
  };

  const handleProjectSubmit = async (event) => {
    event.preventDefault();

    if (!projectForm.internshipId) {
      setError("Please select an internship first.");
      return;
    }

    if (!projectForm.title.trim()) {
      setError("Project title is required.");
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response = await client.post("/projects", {
        internshipId: projectForm.internshipId,
        title: projectForm.title.trim(),
        description: projectForm.description.trim() || "",
        objectives: projectForm.objectives.trim() || "",
        location: projectForm.location.trim() || "",
        duration: projectForm.duration.trim() || "",
        domain: projectForm.domain.trim() || "",
        requirements: projectForm.requirements.trim() || "",
        tasks: projectForm.tasks
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
    return <div className="loading-spinner">Loading...</div>;
  }

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1>Project builder</h1>
        <p className="page-subtitle">Create projects under your internships and prepare the initial task plan.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="actions-bar">
        <button className="btn btn-primary" onClick={() => setShowCreateForm((current) => !current)}>
          {showCreateForm ? "Cancel" : "Create a project"}
        </button>
      </div>

      {showCreateForm && (
        <div className="card">
          <h2>Create a project</h2>
          <form onSubmit={handleProjectSubmit} className="stack-form">
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="internshipId">Internship</label>
                <select
                  id="internshipId"
                  name="internshipId"
                  value={projectForm.internshipId}
                  onChange={handleProjectInputChange}
                  className="form-select"
                  required
                >
                  <option value="">Select an internship</option>
                  {internships.map((internship) => (
                    <option key={internship.id} value={internship.id}>
                      {internship.title}
                    </option>
                  ))}
                </select>
              </div>

              <FormField id="title" label="Project title" name="title" value={projectForm.title} onChange={handleProjectInputChange} required />
              <FormField id="description" label="Description" name="description" value={projectForm.description} onChange={handleProjectInputChange} multiline />
              <FormField id="objectives" label="Objectives" name="objectives" value={projectForm.objectives} onChange={handleProjectInputChange} multiline />
              <FormField id="location" label="Location" name="location" value={projectForm.location} onChange={handleProjectInputChange} />
              <FormField id="duration" label="Duration" name="duration" value={projectForm.duration} onChange={handleProjectInputChange} />
              <FormField id="domain" label="Domain" name="domain" value={projectForm.domain} onChange={handleProjectInputChange} />
              <FormField id="requirements" label="Requirements" name="requirements" value={projectForm.requirements} onChange={handleProjectInputChange} multiline />
            </div>

            <div className="tasks-section">
              <h3>Initial tasks</h3>
              <div className="task-input-group">
                <FormField id="taskTitle" label="Task title" name="title" value={taskForm.title} onChange={handleTaskInputChange} />
                <FormField id="taskDescription" label="Task description" name="description" value={taskForm.description} onChange={handleTaskInputChange} multiline />
                <button type="button" className="btn btn-secondary" onClick={addTask}>
                  Add task
                </button>
              </div>

              {projectForm.tasks.length > 0 && (
                <div className="tasks-list">
                  {projectForm.tasks.map((task, index) => (
                    <div key={`${task.title}-${index}`} className="task-item">
                      <strong>{task.title}</strong>
                      {task.description && <p>{task.description}</p>}
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => removeTask(index)}>
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">Create project</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowCreateForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="projects-list">
        {projects.length === 0 ? (
          <div className="empty-state">
            <h3>No projects yet</h3>
            <p>Create your first project under one of your internships.</p>
          </div>
        ) : (
          projects.map((project) => (
            <div key={project.id} className="project-card">
              <div className="project-header">
                <div>
                  <h3>{project.title}</h3>
                  <p className="muted-cell">{project.internship_title}</p>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => deleteProject(project.id)}>
                  Delete
                </button>
              </div>

              {project.description && <p className="project-description">{project.description}</p>}

              <div className="project-meta">
                <div className="meta-item"><span className="meta-label">Location:</span><span>{project.location || "-"}</span></div>
                <div className="meta-item"><span className="meta-label">Duration:</span><span>{project.duration || "-"}</span></div>
                <div className="meta-item"><span className="meta-label">Domain:</span><span>{project.domain || "-"}</span></div>
              </div>

              <div className="project-stats">
                <div className="stat"><span className="stat-number">{project.task_count || 0}</span><span className="stat-label">Tasks</span></div>
                <div className="stat"><span className="stat-number">{project.completed_task_count || 0}</span><span className="stat-label">Done</span></div>
                <div className="stat"><span className="stat-number">{project.interns_count || 0}</span><span className="stat-label">Interns</span></div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SupervisorProjectsPage;
