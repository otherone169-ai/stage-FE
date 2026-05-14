import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../hooks/useAuth";

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

const MyProjectPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        // Fetch assigned project
        const projectRes = await apiClient.get("/projects/my-assigned");
        setProject(projectRes.data);

        // Fetch tasks for the assigned project
        const tasksRes = await apiClient.get("/tasks");
        setTasks(tasksRes.data || []);
      } catch (err) {
        if (err.response?.status === 401) {
          setError("Votre session a expiré. Veuillez vous reconnecter.");
        } else if (err.response?.status === 404) {
          setError("Aucun projet assigné. Veuillez attendre l'affectation d'un superviseur.");
        } else {
          setError(err.response?.data?.message || "Erreur de chargement du projet");
        }
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadData();
    }
  }, [user]);

  if (loading) return <LoadingSpinner label="Chargement du projet..." />;

  if (!project) {
    return (
      <div className="my-project-page">
        <section className="card">
          <div style={{ textAlign: "center", padding: "40px" }}>
            <p style={{ fontSize: "18px", color: "#666" }}>📭 Aucun projet assigné</p>
            <p style={{ color: "#999", marginTop: "10px" }}>
              Vous recevrez une notification dès qu'un superviseur vous assignera un projet.
            </p>
          </div>
        </section>
      </div>
    );
  }

  const progressPercentage =
    project.total_tasks > 0 ? Math.round((project.done_tasks / project.total_tasks) * 100) : 0;

  return (
    <div className="my-project-page">
      {error && (
        <section className="card" style={{ backgroundColor: "#fee", border: "1px solid #fcc", marginBottom: "20px" }}>
          <p style={{ color: "#c33" }}>{error}</p>
        </section>
      )}

      {/* Project Header */}
      <section className="card project-hero">
        <div>
          <p className="section-kicker">📌 Mon Projet</p>
          <h2>{project.title}</h2>
          <p className="section-subtitle">{project.description || project.title}</p>
        </div>
        <div
          style={{
            textAlign: "right",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            alignItems: "flex-end"
          }}
        >
          <div style={{ fontSize: "32px", fontWeight: "bold", color: "#2563eb" }}>
            {progressPercentage}%
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>Progression</div>
        </div>
      </section>

      {/* Project Details */}
      <section className="card">
        <h3>Description du projet</h3>
        <p>{project.description || "Aucune description"}</p>
        {project.objectives && (
          <>
            <h3 style={{ marginTop: "20px" }}>Objectifs</h3>
            <p>{project.objectives}</p>
          </>
        )}
      </section>

      {/* Task Summary */}
      <section className="card">
        <h3>Résumé des tâches</h3>
        <div className="task-metrics">
          <div>
            <strong>{project.total_tasks}</strong>
            <span>Total</span>
          </div>
          <div>
            <strong>{project.todo_tasks}</strong>
            <span>À faire</span>
          </div>
          <div>
            <strong>{project.in_progress_tasks}</strong>
            <span>En cours</span>
          </div>
          <div>
            <strong>{project.done_tasks}</strong>
            <span>Terminées</span>
          </div>
        </div>
      </section>

      {/* Task List */}
      <section className="card task-table-card">
        <div className="task-table-header">
          <h3>Tâches du projet</h3>
          <span className="task-table-hint">Cliquez sur une tâche pour voir les détails et mettre à jour le statut.</span>
        </div>

        {tasks.length === 0 ? (
          <p className="muted-cell" style={{ padding: "20px", textAlign: "center" }}>
            Aucune tâche dans ce projet pour le moment.
          </p>
        ) : (
          <div className="table-wrap task-table-shell">
            <table>
              <thead>
                <tr>
                  <th>Titre</th>
                  <th>Statut</th>
                  <th>Échéance</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id}>
                    <td>
                      <strong>{task.title}</strong>
                      {task.description && (
                        <div className="muted-cell" style={{ fontSize: "12px", marginTop: "4px" }}>
                          {task.description}
                        </div>
                      )}
                    </td>
                    <td>
                      <span
                        className="status-badge"
                        style={{
                          backgroundColor: getStatusBadgeColor(task.status),
                          color: "white",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: "600",
                          display: "inline-block"
                        }}
                      >
                        {task.status === "todo" && "À faire"}
                        {task.status === "in_progress" && "En cours"}
                        {task.status === "done" && "Terminée"}
                      </span>
                    </td>
                    <td>{task.deadline ? new Date(task.deadline).toLocaleDateString() : "-"}</td>
                    <td>
                      <button
                        type="button"
                        className="secondary-btn small"
                        onClick={() => navigate(`/app/tasks?taskId=${task.id}`)}
                      >
                        Ouvrir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Cta to Tasks Page */}
      <section className="card" style={{ textAlign: "center", padding: "30px" }}>
        <p style={{ marginBottom: "15px", color: "#666" }}>
          Consultez la page complète des tâches pour gérer votre progression
        </p>
        <button
          type="button"
          className="primary-btn"
          onClick={() => navigate("/app/tasks")}
        >
          📝 Aller aux tâches complètes
        </button>
      </section>
    </div>
  );
};

export default MyProjectPage;
