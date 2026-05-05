import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
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

const getStatusBadgeColor = (status) => {
  switch (status) {
    case "todo":
      return "#999"; // grey
    case "in_progress":
      return "#2563eb"; // blue
    case "done":
      return "#10b981"; // green
    default:
      return "#666";
  }
};

const TasksPage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [editForm, setEditForm] = useState({ title: "", description: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [remarks, setRemarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyTaskForm);
  const [progressForm, setProgressForm] = useState(emptyProgressForm);
  const [remarkContent, setRemarkContent] = useState("");
  const [transitionLoading, setTransitionLoading] = useState(false);

  const isSupervisor = user?.role === "supervisor";
  const isStudent = user?.role === "student";
  const taskCounts = tasks.reduce(
    (accumulator, task) => {
      accumulator.total += 1;
      if (task.status === "todo") accumulator.todo += 1;
      if (task.status === "in_progress") accumulator.inProgress += 1;
      if (task.status === "done") accumulator.done += 1;
      return accumulator;
    },
    { total: 0, todo: 0, inProgress: 0, done: 0 }
  );

  const loadRemarks = async (taskId) => {
    try {
      const { data } = await apiClient.get(`/tasks/${taskId}/remarks`);
      setRemarks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading remarks:", err);
      setRemarks([]);
    }
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

      // Handle deep linking: if taskId query param exists, select that task
      const taskIdParam = searchParams.get("taskId");
      if (taskIdParam) {
        const task = tasksRes.data.find(t => t.id === taskIdParam);
        if (task) {
          setSelectedTask(task);
          setProgressForm((current) => ({ ...current, status: task.status }));
          await loadRemarks(task.id);
          
          // Mark notification as read (best effort, don't block)
          const notificationId = searchParams.get("notificationId");
          if (notificationId) {
            try {
              await apiClient.patch(`/workflow/notifications/${notificationId}/read`);
            } catch (e) {
              console.error("Error marking notification as read:", e);
            }
          }
        } else {
          setError("Tâche non trouvée");
        }
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Votre session a expiré. Veuillez vous reconnecter.");
      } else {
        setError(err.response?.data?.message || "Erreur de chargement des taches");
      }
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

  const handleStartTask = async (taskId) => {
    try {
      setTransitionLoading(true);
      setError("");
      const result = await apiClient.patch(`/tasks/${taskId}/transition/start`);
      // Update selectedTask
      if (selectedTask?.id === taskId) {
        setSelectedTask(result.data);
      }
      // Reload tasks list
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Impossible de démarrer la tâche");
    } finally {
      setTransitionLoading(false);
    }
  };

  const handleFinishTask = async (taskId) => {
    try {
      setTransitionLoading(true);
      setError("");
      const result = await apiClient.patch(`/tasks/${taskId}/transition/done`);
      // Update selectedTask
      if (selectedTask?.id === taskId) {
        setSelectedTask(result.data);
      }
      // Reload tasks list
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Impossible de terminer la tâche");
    } finally {
      setTransitionLoading(false);
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

  const handleTaskEdit = (task) => {
    setSelectedTask(task);
    setEditForm({ title: task.title, description: task.description || "" });
    setIsEditing(true);
  };

  const handleTaskEditSubmit = async (event) => {
    event.preventDefault();
    if (!selectedTask) return;

    try {
      await apiClient.patch(`/tasks/${selectedTask.id}`, { 
        title: editForm.title, 
        description: editForm.description 
      });
      setIsEditing(false);
      await loadData();
      // Update selected task with new data
      const updatedTask = { ...selectedTask, title: editForm.title, description: editForm.description };
      setSelectedTask(updatedTask);
    } catch (err) {
      setError(err.response?.data?.message || "Modification de tâche impossible");
    }
  };

  const handleTaskEditCancel = () => {
    setIsEditing(false);
    setEditForm({ title: "", description: "" });
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
    <div className="tasks-page">
      <section className="card tasks-hero">
        <div>
          <p className="section-kicker">📝 Tâches</p>
          <h2>{isStudent ? "Mes tâches" : "Suivi des tâches"}</h2>
          <p className="section-subtitle">
            Suivez l'avancement, commentez les livrables et gardez un historique clair des actions sur chaque projet.
          </p>
        </div>

        <div className="task-metrics">
          <div>
            <strong>{taskCounts.total}</strong>
            <span>Total</span>
          </div>
          <div>
            <strong>{taskCounts.todo}</strong>
            <span>À faire</span>
          </div>
          <div>
            <strong>{taskCounts.inProgress}</strong>
            <span>En cours</span>
          </div>
          <div>
            <strong>{taskCounts.done}</strong>
            <span>Terminées</span>
          </div>
        </div>
      </section>

      <div className="tasks-layout">
        {isSupervisor && (
          <section className="card task-form-card">
            <h3 style={{ marginBottom: '20px', color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: '600' }}>Ajouter une tâche</h3>
            <form className="task-form" onSubmit={handleCreate}>
              <div className="form-group">
                <label htmlFor="task-title">Titre</label>
                <input
                  id="task-title"
                  placeholder="Entrez le titre de la tâche"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  required
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="task-description">Description</label>
                <textarea
                  id="task-description"
                  placeholder="Décrivez la tâche en détail"
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="form-textarea"
                  rows={4}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="task-project">Sélectionner un projet</label>
                <select
                  id="task-project"
                  value={form.projectId}
                  onChange={(e) => setForm((prev) => ({ ...prev, projectId: e.target.value }))}
                  required
                  className="form-select"
                >
                  <option value="">Choisissez un projet</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="task-deadline">Date d'échéance</label>
                <input
                  id="task-deadline"
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm((prev) => ({ ...prev, deadline: e.target.value }))}
                  className="form-input"
                />
              </div>
              
              <button type="submit" className="task-submit-btn">
                <span className="btn-icon">➕</span>
                Ajouter la tâche
              </button>
            </form>
          </section>
        )}

        {/* Edit Task Form */}
        {isEditing && selectedTask && (
          <section className="card task-edit-card">
            <h3 style={{ marginBottom: '20px', color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: '600' }}>Modifier la tâche</h3>
            <form className="task-form" onSubmit={handleTaskEditSubmit}>
              <div className="form-group">
                <label htmlFor="edit-task-title">Titre</label>
                <input
                  id="edit-task-title"
                  placeholder="Entrez le titre de la tâche"
                  value={editForm.title}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                  required
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="edit-task-description">Description</label>
                <textarea
                  id="edit-task-description"
                  placeholder="Décrivez la tâche en détail"
                  value={editForm.description}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="form-textarea"
                  rows={4}
                />
              </div>
              
              <div className="form-actions">
                <button type="submit" className="task-submit-btn">
                  <span className="btn-icon">💾</span>
                  Enregistrer les modifications
                </button>
                <button type="button" className="secondary-btn" onClick={handleTaskEditCancel}>
                  Annuler
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="card task-table-card">
          <div className="task-table-header">
            <h3>{isStudent ? "Mes tâches" : "Suivi des tâches"}</h3>
            <span className="task-table-hint">Cliquez sur Ouvrir pour voir les commentaires et la progression.</span>
          </div>
          {error && <p className="form-error">{error}</p>}
          <div className="table-wrap task-table-shell">
            <table>
              <thead>
                <tr>
                  <th>Titre</th>
                  <th>Projet</th>
                  <th>Statut</th>
                  <th>Echeance</th>
                  <th>Commentaires</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id}>
                    <td>
                      <strong>{task.title}</strong>
                      <div className="muted-cell">{task.description || "Aucune description"}</div>
                    </td>
                    <td>{task.project_title}</td>
                    <td>
                      <span 
                        className="status-badge" 
                        style={{ 
                          backgroundColor: getStatusBadgeColor(task.status),
                          color: "white",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: "600"
                        }}
                      >
                        {task.status === "todo" && "À faire"}
                        {task.status === "in_progress" && "En cours"}
                        {task.status === "done" && "Terminée"}
                      </span>
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
          <section className="card task-detail-card">
            <div className="task-detail-header">
              <div>
                <p className="section-kicker">Détails</p>
                <h3>{selectedTask.title}</h3>
              </div>
              <span 
                className="cv-badge" 
                style={{ 
                  backgroundColor: getStatusBadgeColor(selectedTask.status),
                  color: "white"
                }}
              >
                {selectedTask.status === "todo" && "À faire"}
                {selectedTask.status === "in_progress" && "En cours"}
                {selectedTask.status === "done" && "Terminée"}
              </span>
            </div>

            {isStudent && (
              <div className="task-actions">
                {selectedTask.status === "todo" && (
                  <button 
                    type="button" 
                    className="primary-btn"
                    onClick={() => handleStartTask(selectedTask.id)}
                    disabled={transitionLoading}
                  >
                    {transitionLoading ? "⏳ Démarrage..." : "▶️ Démarrer"}
                  </button>
                )}
                {selectedTask.status === "in_progress" && (
                  <button 
                    type="button" 
                    className="primary-btn"
                    onClick={() => handleFinishTask(selectedTask.id)}
                    disabled={transitionLoading}
                  >
                    {transitionLoading ? "⏳ Terminaison..." : "✓ Terminer"}
                  </button>
                )}
                {selectedTask.status === "done" && (
                  <div className="status-completed">
                    ✅ Tâche terminée
                  </div>
                )}
              </div>
            )}

            {isStudent && (
              <form className="stack-form" onSubmit={handleProgressSubmit}>
                <h4>Mise à jour de progression</h4>
                <textarea
                  placeholder="Détails de progression"
                  value={progressForm.progress}
                  onChange={(e) => setProgressForm((prev) => ({ ...prev, progress: e.target.value }))}
                />
                <input
                  type="text"
                  placeholder="Lien du fichier livrable (optionnel)"
                  value={progressForm.fileUrl}
                  onChange={(e) => setProgressForm((prev) => ({ ...prev, fileUrl: e.target.value }))}
                />
                <button type="submit" className="primary-btn">
                  Mettre à jour la progression
                </button>
              </form>
            )}

            <div className="task-description-section">
              <p className="section-kicker">Description</p>
              <p className="task-description-text">{selectedTask.description || "Aucune description"}</p>
            </div>

            <div className="task-comments-section">
              <p className="section-kicker">Commentaires ({remarks.length})</p>
              <form className="comment-form" onSubmit={handleRemarkSubmit}>
                <textarea
                  placeholder="Ajouter un commentaire..."
                  value={remarkContent}
                  onChange={(e) => setRemarkContent(e.target.value)}
                  required
                  className="comment-textarea"
                />
                <button type="submit" className="comment-submit-btn">
                  Ajouter un commentaire
                </button>
              </form>

              {remarks.length === 0 ? (
                <p className="no-comments">Aucun commentaire pour le moment.</p>
              ) : (
                <div className="remarks-list">
                  {remarks.map((remark) => (
                    <div key={remark.id} className="remark-item">
                      <strong>{remark.author_name || "Anonyme"}</strong>
                      <small>
                        {new Date(remark.created_at).toLocaleDateString()} {new Date(remark.created_at).toLocaleTimeString()}
                      </small>
                      <p>{remark.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default TasksPage;
