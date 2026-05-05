import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import client from "../api/client";

const EnhancedDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    loadStats();
  }, [user, navigate]);

  const loadStats = async () => {
    try {
      setLoading(true);
      let endpoint = "";
      if (user.role === "supervisor") {
        endpoint = "/workflow/dashboard/supervisor";
      } else if (user.role === "student") {
        endpoint = "/workflow/dashboard/student";
      } else if (user.role === "admin") {
        endpoint = "/workflow/dashboard/admin";
      }

      if (endpoint) {
        const response = await client.get(endpoint);
        setStats(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load stats");
    } finally {
      setLoading(false);
    }
  };

  const renderSupervisorDashboard = () => {
    if (!stats || !stats.studentStats) return null;

    const { studentStats, projectStats, internships } = stats;

    return (
      <div className="page-wrapper">
        <h2>Tableau de bord superviseur</h2>

        {/* Student Stats Cards */}
        <div className="dashboard-grid">
          <div className="metric-card">
            <div style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--accent)" }}>
              {studentStats.total}
            </div>
            <p>Stagiaires au total</p>
          </div>
          <div className="metric-card">
            <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#ff9800" }}>
              {studentStats.pending}
            </div>
            <p>En attente</p>
          </div>
          <div className="metric-card">
            <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#4caf50" }}>
              {studentStats.accepted}
            </div>
            <p>Acceptés</p>
          </div>
          <div className="metric-card">
            <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#2196f3" }}>
              {studentStats.confirmed}
            </div>
            <p>Confirmés</p>
          </div>
        </div>

        {/* Projects Table */}
        <div className="card" style={{ marginTop: "24px" }}>
          <h3>Projets</h3>
          {projectStats && projectStats.length > 0 ? (
            <table style={{ width: "100%", marginTop: "12px" }}>
              <thead>
                <tr>
                  <th>Titre</th>
                  <th>Stagiaires</th>
                </tr>
              </thead>
              <tbody>
                {projectStats.map(project => (
                  <tr key={project.id}>
                    <td>{project.title}</td>
                    <td>{project.student_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Aucun projet</p>
          )}
        </div>

        {/* Internships with Progress */}
        <div className="card" style={{ marginTop: "24px" }}>
          <h3>Stages avec progression</h3>
          {internships && internships.length > 0 ? (
            <div style={{ display: "grid", gap: "16px" }}>
              {internships.map(internship => (
                <div key={internship.id} style={{
                  padding: "16px",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  backgroundColor: "var(--bg-main)"
                }}>
                  <h4>{internship.title}</h4>
                  <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
                    {internship.total_students} stagiaires ({internship.confirmed_students} confirmés)
                  </p>
                  <div style={{
                    marginTop: "8px",
                    height: "8px",
                    backgroundColor: "var(--border)",
                    borderRadius: "4px",
                    overflow: "hidden"
                  }}>
                    <div style={{
                      height: "100%",
                      backgroundColor: "var(--accent)",
                      width: `${internship.progressPercent}%`,
                      transition: "width 0.3s ease"
                    }} />
                  </div>
                  <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: "4px" }}>
                    {internship.progressPercent}% - {internship.daysRemaining} jours restants
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p>Aucun stage</p>
          )}
        </div>
      </div>
    );
  };

  const renderStudentDashboard = () => {
    if (!stats || !stats.internships) return null;

    const { internships, taskStats } = stats;

    return (
      <div className="page-wrapper">
        <h2>Mon tableau de bord</h2>

        {/* Task Stats */}
        <div className="dashboard-grid">
          <div className="metric-card">
            <div style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--accent)" }}>
              {taskStats.total}
            </div>
            <p>Tâches au total</p>
          </div>
          <div className="metric-card">
            <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#ff9800" }}>
              {taskStats.todo}
            </div>
            <p>À faire</p>
          </div>
          <div className="metric-card">
            <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#2196f3" }}>
              {taskStats.in_progress}
            </div>
            <p>En cours</p>
          </div>
          <div className="metric-card">
            <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#4caf50" }}>
              {taskStats.done}
            </div>
            <p>Terminées</p>
          </div>
        </div>

        {/* Internships */}
        <div className="card" style={{ marginTop: "24px" }}>
          <h3>Mes stages</h3>
          {internships && internships.length > 0 ? (
            <div style={{ display: "grid", gap: "16px" }}>
              {internships.map(internship => (
                <div key={internship.id} style={{
                  padding: "16px",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  backgroundColor: "var(--bg-main)"
                }}>
                  <h4>{internship.project_title}</h4>
                  <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
                    Superviseur: {internship.supervisor_name}
                  </p>
                  <p style={{
                    marginTop: "4px",
                    padding: "4px 8px",
                    backgroundColor: internship.acceptance_status === "confirmed" ? "#c8e6c9" : "#fff3cd",
                    borderRadius: "4px",
                    display: "inline-block",
                    fontSize: "0.8rem"
                  }}>
                    {internship.acceptance_status}
                  </p>
                  
                  {internship.progressPercent !== undefined && (
                    <>
                      <div style={{
                        marginTop: "12px",
                        height: "8px",
                        backgroundColor: "var(--border)",
                        borderRadius: "4px",
                        overflow: "hidden"
                      }}>
                        <div style={{
                          height: "100%",
                          backgroundColor: "var(--accent)",
                          width: `${internship.progressPercent}%`,
                          transition: "width 0.3s ease"
                        }} />
                      </div>
                      <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: "4px" }}>
                        {internship.progressPercent}% - {internship.daysRemaining} jours restants
                      </p>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p>Aucun stage</p>
          )}
        </div>
      </div>
    );
  };

  const renderAdminDashboard = () => {
    if (!stats || !stats.globalStats) return null;

    const { globalStats, supervisorStats, topProjects } = stats;

    return (
      <div className="page-wrapper">
        <div style={{ marginBottom: "24px" }}>
          <h2>Tableau de bord administrateur</h2>
          <p className="section-subtitle">Vue d'ensemble du système</p>
        </div>

        {/* Global Stats */}
        <div className="dashboard-grid">
          <div className="metric-card">
            <div style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--accent)" }}>
              {globalStats.total_users}
            </div>
            <p>Utilisateurs</p>
          </div>
          <div className="metric-card">
            <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#2196f3" }}>
              {globalStats.total_students}
            </div>
            <p>Stagiaires</p>
          </div>
          <div className="metric-card">
            <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#9c27b0" }}>
              {globalStats.total_supervisors}
            </div>
            <p>Superviseurs</p>
          </div>
          <div className="metric-card">
            <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#4caf50" }}>
              {globalStats.confirmed_interns}
            </div>
            <p>Stagiaires confirmés</p>
          </div>
        </div>

        {/* Supervisors Table */}
        <div className="card" style={{ marginTop: "24px" }}>
          <h3>Superviseurs</h3>
          {supervisorStats && supervisorStats.length > 0 ? (
            <table style={{ width: "100%", marginTop: "12px" }}>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Position</th>
                  <th>Stagiaires gérés</th>
                  <th>Confirmés</th>
                  <th>En attente</th>
                </tr>
              </thead>
              <tbody>
                {supervisorStats.map(supervisor => (
                  <tr key={supervisor.id}>
                    <td>{supervisor.full_name}</td>
                    <td>{supervisor.position || "-"}</td>
                    <td>{supervisor.managed_students}</td>
                    <td>{supervisor.confirmed_students}</td>
                    <td>{supervisor.pending_students}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Aucun superviseur</p>
          )}
        </div>

        {/* Top Projects */}
        <div className="card" style={{ marginTop: "24px" }}>
          <h3>Projets populaires</h3>
          {topProjects && topProjects.length > 0 ? (
            <div style={{ display: "grid", gap: "12px" }}>
              {topProjects.map((project, idx) => (
                <div key={project.id} style={{
                  padding: "12px",
                  backgroundColor: "var(--bg-main)",
                  borderRadius: "8px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <span>
                    <strong>{idx + 1}.</strong> {project.title}
                  </span>
                  <span style={{
                    backgroundColor: "var(--accent)",
                    color: "#fff",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "0.9rem"
                  }}>
                    {project.student_count} stagiaires
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p>Aucun projet</p>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="page-wrapper"><p>Chargement du tableau de bord...</p></div>;
  }

  if (error) {
    return <div className="page-wrapper"><div className="form-error">{error}</div></div>;
  }

  if (user.role === "supervisor") return renderSupervisorDashboard();
  if (user.role === "student") return renderStudentDashboard();
  if (user.role === "admin") return renderAdminDashboard();

  return <div className="page-wrapper"><p>Rôle non reconnu</p></div>;
};

export default EnhancedDashboardPage;
