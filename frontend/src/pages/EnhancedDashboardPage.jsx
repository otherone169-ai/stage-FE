import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import StudentPlacementCard from "../components/dashboard/StudentPlacementCard";
import SupervisorProjectTimelineCard from "../components/dashboard/SupervisorProjectTimelineCard";
import EmptyState from "../components/EmptyState";
import LoadingSpinner from "../components/LoadingSpinner";
import PageLayout from "../components/PageLayout";
import { Alert, Card, StatCard } from "../components/ui";
import { useAuth } from "../hooks/useAuth";

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

    const loadStats = async () => {
      try {
        setLoading(true);
        setError("");

        const endpoint =
          user.role === "supervisor"
            ? "/workflow/dashboard/supervisor"
            : user.role === "student"
              ? "/workflow/dashboard/student"
              : "/workflow/dashboard/admin";

        const response = await client.get(endpoint);
        setStats(response.data);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load stats");
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [user, navigate]);

  if (loading) {
    return <LoadingSpinner label="Chargement des statistiques…" />;
  }

  if (error) {
    return <Alert variant="error">{error}</Alert>;
  }

  if (user?.role === "supervisor") {
    const summary = stats?.summary || {};
    const projectsProgress = stats?.projects || [];
    const totalInterns = summary.totalInterns ?? stats?.studentStats?.total ?? 0;
    const totalProjects = summary.totalProjects ?? stats?.projectStats?.length ?? 0;
    const unassignedStudents = summary.unassignedStudents ?? 0;

    return (
      <PageLayout
        title="Tableau de bord"
        subtitle="Vue d'ensemble de vos stagiaires, projets et échéances."
        containerClassName="enhanced-dashboard enhanced-dashboard--supervisor"
      >
        <div className="dashboard-grid ds-stat-grid">
          <StatCard label="Total stagiaires" value={totalInterns} icon="👥" />
          <StatCard label="Total projets" value={totalProjects} icon="▣" />
          <StatCard label="Stagiaires non affectés" value={unassignedStudents} icon="◎" />
        </div>

        <Card title="Échéances des projets" subtitle="Suivi de l'avancement et des dates clés par projet.">
          {projectsProgress.length === 0 ? (
            <EmptyState
              icon="▣"
              title="Aucun projet"
              description="Créez un projet pour commencer à suivre les échéances et les affectations."
            />
          ) : (
            <div className="supervisor-timelines-grid">
              {projectsProgress.map((project) => (
                <SupervisorProjectTimelineCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </Card>
      </PageLayout>
    );
  }

  if (user?.role === "student") {
    const projects = stats?.projects || [];
    const taskStats = stats?.taskStats || {};

    return (
      <PageLayout
        title="Statistiques avancées"
        subtitle="Suivez vos projets, tâches et l'avancement de vos stages."
        containerClassName="enhanced-dashboard enhanced-dashboard--student"
      >
        <div className="dashboard-grid ds-stat-grid">
          <div className="metric-card ds-stat-card">
            <strong className="ds-stat-card__value">{taskStats.total ?? 0}</strong>
            <p className="ds-stat-card__hint">Tâches totales</p>
          </div>
          <div className="metric-card ds-stat-card">
            <strong className="ds-stat-card__value">{taskStats.todo ?? 0}</strong>
            <p className="ds-stat-card__hint">À faire</p>
          </div>
          <div className="metric-card ds-stat-card">
            <strong className="ds-stat-card__value">{taskStats.in_progress ?? 0}</strong>
            <p className="ds-stat-card__hint">En cours</p>
          </div>
          <div className="metric-card ds-stat-card">
            <strong className="ds-stat-card__value">{taskStats.done ?? 0}</strong>
            <p className="ds-stat-card__hint">Terminées</p>
          </div>
        </div>

        <Card title="Mes projets" subtitle="Vos affectations de stage en cours et passées.">
          {projects.length === 0 ? (
            <EmptyState
              icon="◇"
              title="Aucun projet assigné"
              description="Vous recevrez une notification dès qu'un superviseur vous affectera à un projet."
            />
          ) : (
            <div className="student-placements-grid">
              {projects.map((placement) => (
                <StudentPlacementCard key={placement.id} placement={placement} />
              ))}
            </div>
          )}
        </Card>
      </PageLayout>
    );
  }

  const globalStats = stats?.globalStats || {};
  const supervisorStats = stats?.supervisorStats || [];
  const topProjects = stats?.topProjects || [];

  return (
    <div className="page-wrapper">
      <h2>Admin advanced stats</h2>

      <div className="dashboard-grid">
        <div className="metric-card"><strong>{globalStats.total_users ?? 0}</strong><p>Users</p></div>
        <div className="metric-card"><strong>{globalStats.total_students ?? 0}</strong><p>Students</p></div>
        <div className="metric-card"><strong>{globalStats.total_supervisors ?? 0}</strong><p>Supervisors</p></div>
        <div className="metric-card"><strong>{globalStats.total_projects ?? 0}</strong><p>Projects</p></div>
      </div>

      <section className="card" style={{ marginTop: "24px" }}>
        <h3>Supervisors</h3>
        {supervisorStats.length === 0 ? (
          <p>No supervisors found.</p>
        ) : (
          <table style={{ width: "100%", marginTop: "12px" }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Position</th>
                <th>Company</th>
                <th>Managed interns</th>
                <th>Active</th>
                <th>Completed</th>
              </tr>
            </thead>
            <tbody>
              {supervisorStats.map((supervisor) => (
                <tr key={supervisor.id}>
                  <td>{supervisor.full_name}</td>
                  <td>{supervisor.position || "-"}</td>
                  <td>{supervisor.company_name || "-"}</td>
                  <td>{supervisor.managed_students}</td>
                  <td>{supervisor.active_students}</td>
                  <td>{supervisor.completed_students}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card" style={{ marginTop: "24px" }}>
        <h3>Top projects</h3>
        {topProjects.length === 0 ? (
          <p>No projects found.</p>
        ) : (
          <div style={{ display: "grid", gap: "12px" }}>
            {topProjects.map((project, index) => (
              <div
                key={project.id}
                style={{
                  padding: "12px",
                  backgroundColor: "var(--bg-main)",
                  borderRadius: "8px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <span>
                  <strong>{index + 1}.</strong> {project.title}
                </span>
                <span>{project.student_count} interns</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default EnhancedDashboardPage;
