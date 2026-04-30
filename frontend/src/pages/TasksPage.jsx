import { useEffect, useState } from "react";
import apiClient from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../hooks/useAuth";

const taskStatusOptions = [
  { value: "todo", label: "Todo" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" }
];

const emptyTaskForm = { title: "", description: "", projectId: "", deadline: "" };
const emptyProgressForm = { status: "in_progress", progress: "", fileUrl: "" };

const TasksPage = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [remarks, setRemarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyTaskForm);
  const [progressForm, setProgressForm] = useState(emptyProgressForm);
  const [remarkContent, setRemarkContent] = useState("");

  const isSupervisor = user?.role === "supervisor";
  const isStudent = user?.role === "student";

  const loadRemarks = async (taskId) => {
    const { data } = await apiClient.get(`/tasks/${taskId}/remarks`);
    setRemarks(Array.isArray(data) ? data : []);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [tasksRes, projectsRes] = await Promise.all([
        apiClient.get("/tasks"),
        isSupervisor ? apiClient.get("/projects") : Promise.resolve({ data: [] })
      ]);
      setTasks(tasksRes.data);
      setProjects(projectsRes.data);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur de chargement des taches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectTask = async (task) => {
    try {
      setSelectedTask(task);
      setProgressForm((current) => ({ ...current, status: task.status }));
      await loadRemarks(task.id);
    } catch (err) {
      setError(err.response?.data?.message || "Chargement des commentaires impossible");
    }
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setError("");

    try {
      await apiClient.post("/tasks", {
        title: form.title,
        description: form.description,
        projectId: form.projectId,
        deadline: form.deadline || null
      });
      setForm(emptyTaskForm);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Creation de tache impossible");
    }
  };

  const handleStatusChange = async (taskId, status) => {
    try {
      if (isStudent) {
        await apiClient.post(`/students/tasks/${taskId}/updates`, { status, progress: "" });
      } else {
        await apiClient.patch(`/tasks/${taskId}/status`, { status });
      }
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Mise a jour du statut impossible");
    }
  };

  const handleProgressSubmit = async (event) => {
    event.preventDefault();
    if (!selectedTask) return;

    try {
      await apiClient.post(`/students/tasks/${selectedTask.id}/updates`, progressForm);
      setProgressForm(emptyProgressForm);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Mise a jour de progression impossible");
    }
  };

  const handleRemarkSubmit = async (event) => {
    event.preventDefault();
    if (!selectedTask) return;

    try {
      await apiClient.post(`/tasks/${selectedTask.id}/remarks`, { content: remarkContent });
      setRemarkContent("");
      await loadRemarks(selectedTask.id);
    } catch (err) {
      setError(err.response?.data?.message || "Ajout du commentaire impossible");
    }
  };

  const handleTaskEdit = async (task) => {
    const title = window.prompt("Titre de la tache", task.title);
    if (title === null) return;

    const description = window.prompt("Description", task.description || "");
    if (description === null) return;

    try {
      await apiClient.patch(`/tasks/${task.id}`, { title, description });
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Modification de tache impossible");
    }
  };

  const handleTaskDelete = async (task) => {
    if (!window.confirm("Supprimer cette tache ?")) return;

    try {
      await apiClient.delete(`/tasks/${task.id}`);
      if (selectedTask?.id === task.id) {
        setSelectedTask(null);
        setRemarks([]);
      }
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Suppression de tache impossible");
    }
  };

  if (loading) return <LoadingSpinner label="Chargement des taches..." />;

  return (
    <div className="page-grid">
      {isSupervisor && (
        <section className="card">
          <h3>Ajouter une tache</h3>
          <form className="stack-form" onSubmit={handleCreate}>
            <input
              placeholder="Titre"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              required
            />
            <textarea
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            />
            <select
              value={form.projectId}
              onChange={(e) => setForm((prev) => ({ ...prev, projectId: e.target.value }))}
              required
            >
              <option value="">Selectionner un stage</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.internship_title || project.title}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={form.deadline}
              onChange={(e) => setForm((prev) => ({ ...prev, deadline: e.target.value }))}
            />
            <button type="submit" className="primary-btn">
              Ajouter la tache
            </button>
          </form>
        </section>
      )}

      <section className="card">
        <h3>{isStudent ? "Mes taches" : "Suivi des taches"}</h3>
        {error && <p className="form-error">{error}</p>}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Titre</th>
                <th>Stage</th>
                <th>Statut</th>
                <th>Echeance</th>
                <th>Commentaires</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id}>
                  <td>{task.title}</td>
                  <td>{task.internship_title || task.project_title}</td>
                  <td>
                    <select value={task.status} onChange={(e) => handleStatusChange(task.id, e.target.value)}>
                      {taskStatusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>{task.deadline ? new Date(task.deadline).toLocaleDateString() : "-"}</td>
                  <td>{task.remark_count ?? 0}</td>
                  <td>
                    <div className="inline-actions">
                      <button type="button" className="secondary-btn small" onClick={() => selectTask(task)}>
                        Ouvrir
                      </button>
                      {isSupervisor && (
                        <>
                          <button type="button" className="secondary-btn small" onClick={() => handleTaskEdit(task)}>
                            Modifier
                          </button>
                          <button type="button" className="danger-btn small" onClick={() => handleTaskDelete(task)}>
                            Supprimer
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selectedTask && (
        <section className="card">
          <h3>{selectedTask.title}</h3>

          {isStudent && (
            <form className="stack-form" onSubmit={handleProgressSubmit}>
              <label>Progression</label>
              <textarea
                placeholder="Detaillez votre avancement"
                value={progressForm.progress}
                onChange={(e) => setProgressForm((prev) => ({ ...prev, progress: e.target.value }))}
              />
              <label>Statut</label>
              <select
                value={progressForm.status}
                onChange={(e) => setProgressForm((prev) => ({ ...prev, status: e.target.value }))}
              >
                {taskStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <input
                placeholder="Lien de livrable optionnel"
                value={progressForm.fileUrl}
                onChange={(e) => setProgressForm((prev) => ({ ...prev, fileUrl: e.target.value }))}
              />
              <button type="submit" className="primary-btn">
                Envoyer la progression
              </button>
            </form>
          )}

          <form className="stack-form" onSubmit={handleRemarkSubmit}>
            <label>Commentaire</label>
            <textarea
              placeholder="Ajouter un commentaire"
              value={remarkContent}
              onChange={(e) => setRemarkContent(e.target.value)}
              required
            />
            <button type="submit" className="secondary-btn">
              Ajouter le commentaire
            </button>
          </form>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Auteur</th>
                  <th>Role</th>
                  <th>Commentaire</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {remarks.map((remark) => (
                  <tr key={remark.id}>
                    <td>{remark.email}</td>
                    <td>{remark.user_role}</td>
                    <td>{remark.content}</td>
                    <td>{new Date(remark.created_at).toLocaleString()}</td>
                  </tr>
                ))}
                {remarks.length === 0 && (
                  <tr>
                    <td colSpan={4}>Aucun commentaire.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};

export default TasksPage;
