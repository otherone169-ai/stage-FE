import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../hooks/useAuth";

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const { data } = await apiClient.get("/dashboard");
        setStats(data);
      } catch (err) {
        setError(err.response?.data?.message || "Impossible de charger le tableau de bord");
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) return <LoadingSpinner label="Chargement du tableau de bord..." />;
  if (error) return <div className="form-error">{error}</div>;

  const role = user?.role;
  const summary = stats?.summary || {};
  const tasks = stats?.tasks || {};
  const applications = stats?.applications || {};
  const reports = stats?.reports || {};

  const renderMetricCard = (label, value, icon = "📊", status = "default") => (
    <article className={`metric-card status-${status}`}>
      <div style={{ fontSize: "1.5rem" }}>{icon}</div>
      <h3>{label}</h3>
      <p>{value}</p>
    </article>
  );

  if (role === "company") {
    return (
      <div className="page-wrapper">
        <div style={{ marginBottom: "24px" }}>
          <h2>Tableau de Bord</h2>
          <p className="section-subtitle">Suivi de vos offres de stage et stagiaires</p>
        </div>
        <div className="dashboard-grid">
          {renderMetricCard("Offres publiées", summary.internships ?? 0, "📋", "default")}
          {renderMetricCard("Offres actives", summary.activeInternships ?? 0, "✅", "active")}
          {renderMetricCard("Candidatures à traiter", applications.pending ?? 0, "📧", applications.pending > 0 ? "pending" : "default")}
          {renderMetricCard("Stagiaires suivis", summary.interns ?? 0, "👥", "default")}
        </div>
      </div>
    );
  }

  if (role === "supervisor") {
    return (
      <div className="page-wrapper">
        <div style={{ marginBottom: "24px" }}>
          <h2>Tableau de Bord</h2>
          <p className="section-subtitle">Suivi de vos stagiaires et tâches</p>
        </div>
        <div className="dashboard-grid">
          {renderMetricCard("Mes stagiaires", summary.interns ?? 0, "👤", "default")}
          {renderMetricCard("Rapports à valider", summary.pendingReports ?? 0, "📄", summary.pendingReports > 0 ? "pending" : "default")}
          {renderMetricCard("Tâches en cours", tasks.inProgress ?? 0, "⚙️", "active")}
          {renderMetricCard("Tâches terminées", tasks.done ?? 0, "✔️", "default")}
        </div>
      </div>
    );
  }

  if (role === "student") {
    return (
      <div className="page-wrapper">
        <div style={{ marginBottom: "24px" }}>
          <h2>Tableau de Bord</h2>
          <p className="section-subtitle">Suivi de votre progression</p>
        </div>
        <div className="dashboard-grid">
          {renderMetricCard("Candidatures", summary.applications ?? 0, "📨", "default")}
          {renderMetricCard("Stage actif", summary.activeInternships ? "Oui" : "Non", summary.activeInternships ? "✅" : "❌", summary.activeInternships ? "active" : "default")}
          {renderMetricCard("Tâches à faire", tasks.todo ?? 0, "📝", tasks.todo > 0 ? "pending" : "default")}
          {renderMetricCard("Tâches complétées", tasks.done ?? 0, "✔️", "default")}
        </div>
      </div>
    );
  }

  // Admin dashboard
  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: "24px" }}>
        <h2>Tableau de Bord Administrateur</h2>
        <p className="section-subtitle">Vue d'ensemble du système</p>
      </div>
      
      <div className="dashboard-grid">
        {renderMetricCard("Utilisateurs totaux", summary.totalUsers ?? 0, "👥", "default")}
        {renderMetricCard("Offres de stage", summary.totalInternships ?? 0, "📋", "default")}
        {renderMetricCard("Candidatures", summary.totalApplications ?? 0, "📧", "default")}
        {renderMetricCard("Rapports", summary.totalReports ?? 0, "📊", "default")}
      </div>
    </div>
  );
};

export default DashboardPage;
