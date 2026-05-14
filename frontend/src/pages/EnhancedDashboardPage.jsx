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
    return <div className="page-wrapper"><p>Loading dashboard...</p></div>;
  }

  if (error) {
    return <div className="page-wrapper"><div className="form-error">{error}</div></div>;
  }

  if (user?.role === "supervisor") {
    const studentStats = stats?.studentStats || {};
    const projectStats = stats?.projectStats || [];
    const projectsProgress = stats?.projects || [];

    return (
      <div className="page-wrapper">
        <h2>Supervisor advanced stats</h2>

        <div className="dashboard-grid">
          <div className="metric-card"><strong>{studentStats.total ?? 0}</strong><p>Total interns</p></div>
          <div className="metric-card"><strong>{studentStats.active ?? 0}</strong><p>Active</p></div>
          <div className="metric-card"><strong>{studentStats.paused ?? 0}</strong><p>Paused</p></div>
          <div className="metric-card"><strong>{studentStats.completed ?? 0}</strong><p>Completed</p></div>
        </div>

        <section className="card" style={{ marginTop: "24px" }}>
          <h3>Projects</h3>
          {projectStats.length === 0 ? (
            <p>No projects yet.</p>
          ) : (
            <table style={{ width: "100%", marginTop: "12px" }}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Assigned interns</th>
                </tr>
              </thead>
              <tbody>
                {projectStats.map((project) => (
                  <tr key={project.id}>
                    <td>{project.title}</td>
                    <td>{project.student_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="card" style={{ marginTop: "24px" }}>
          <h3>Project timelines</h3>
          {projectsProgress.length === 0 ? (
            <p>No projects yet.</p>
          ) : (
            <div style={{ display: "grid", gap: "16px" }}>
              {projectsProgress.map((project) => (
                <div key={project.id} style={{ padding: "16px", border: "1px solid var(--border)", borderRadius: "8px" }}>
                  <h4>{project.title}</h4>
                  <p>{project.total_students} interns, {project.active_students} active</p>
                  <p>{project.progressPercent}% progress</p>
                  <p>{project.daysRemaining ?? "-"} days remaining</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }

  if (user?.role === "student") {
    const projects = stats?.projects || [];
    const taskStats = stats?.taskStats || {};

    return (
      <div className="page-wrapper">
        <h2>Student advanced stats</h2>

        <div className="dashboard-grid">
          <div className="metric-card"><strong>{taskStats.total ?? 0}</strong><p>Total tasks</p></div>
          <div className="metric-card"><strong>{taskStats.todo ?? 0}</strong><p>Todo</p></div>
          <div className="metric-card"><strong>{taskStats.in_progress ?? 0}</strong><p>In progress</p></div>
          <div className="metric-card"><strong>{taskStats.done ?? 0}</strong><p>Done</p></div>
        </div>

        <section className="card" style={{ marginTop: "24px" }}>
          <h3>My projects</h3>
          {projects.length === 0 ? (
            <p>No project assigned yet.</p>
          ) : (
            <div style={{ display: "grid", gap: "16px" }}>
              {projects.map((placement) => (
                <div key={placement.id} style={{ padding: "16px", border: "1px solid var(--border)", borderRadius: "8px" }}>
                  <h4>{placement.project_title}</h4>
                  <p>Supervisor: {placement.supervisor_name}</p>
                  <p>Status: {placement.status}</p>
                  <p>{placement.progressPercent}% progress</p>
                  <p>{placement.daysRemaining ?? "-"} days remaining</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
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
