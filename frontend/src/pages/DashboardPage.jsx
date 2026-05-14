import { useEffect, useState } from "react";
import apiClient from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../hooks/useAuth";

const renderMetricCard = (label, value, icon = "Stats") => (
  <article className="metric-card">
    <div style={{ fontSize: "1.5rem" }}>{icon}</div>
    <h3>{label}</h3>
    <p>{value}</p>
  </article>
);

const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await apiClient.get("/dashboard");
        setStats(data);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) return <LoadingSpinner label="Loading dashboard..." />;
  if (error) return <div className="form-error">{error}</div>;

  const role = user?.role;
  const summary = stats?.summary || {};
  const tasks = stats?.tasks || {};

  if (role === "supervisor") {
    return (
      <div className="page-wrapper">
        <div style={{ marginBottom: "24px" }}>
          <h2>Supervisor dashboard</h2>
          <p className="section-subtitle">Track interns, projects and pending reviews.</p>
        </div>
        <div className="dashboard-grid">
          {renderMetricCard("Interns", summary.interns ?? 0, "Users")}
          {renderMetricCard("Projects", summary.projects ?? 0, "Projects")}
          {renderMetricCard("Pending reports", summary.pendingReports ?? 0, "Reports")}
          {renderMetricCard("Tasks in progress", tasks.inProgress ?? 0, "Tasks")}
        </div>
      </div>
    );
  }

  if (role === "student") {
    return (
      <div className="page-wrapper">
        <div style={{ marginBottom: "24px" }}>
          <h2>Student dashboard</h2>
          <p className="section-subtitle">Suivez vos projets et vos tâches.</p>
        </div>
        <div className="dashboard-grid">
          {renderMetricCard("Projets", summary.projects ?? 0, "Projects")}
          {renderMetricCard("Missions actives", summary.activePlacements ?? 0, "Stage")}
          {renderMetricCard("Todo tasks", tasks.todo ?? 0, "Todo")}
          {renderMetricCard("Completed tasks", tasks.done ?? 0, "Done")}
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: "24px" }}>
        <h2>Admin dashboard</h2>
        <p className="section-subtitle">High-level platform visibility.</p>
      </div>
      <div className="dashboard-grid">
        {renderMetricCard("Users", summary.totalUsers ?? 0, "Users")}
        {renderMetricCard("Projects", summary.totalProjects ?? 0, "Projects")}
        {renderMetricCard("Stagiaires (interns)", summary.interns ?? 0, "Users")}
        {renderMetricCard("Reports", summary.totalReports ?? 0, "Reports")}
      </div>
    </div>
  );
};

export default DashboardPage;
