import { useEffect, useState } from "react";
import apiClient from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../hooks/useAuth";

const DashboardPage = () => {
  const { user } = useAuth();
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
  if (error) return <p className="form-error">{error}</p>;

  const role = user?.role;
  const summary = stats?.summary || {};
  const tasks = stats?.tasks || {};
  const applications = stats?.applications || {};
  const reports = stats?.reports || {};

  if (role === "company") {
    return (
      <div className="dashboard-grid">
        <article className="metric-card">
          <h3>Offres publiees</h3>
          <p>{summary.internships ?? 0}</p>
        </article>

        <article className="metric-card">
          <h3>Offres actives</h3>
          <p>{summary.activeInternships ?? 0}</p>
        </article>

        <article className="metric-card">
          <h3>Candidatures a traiter</h3>
          <p>{applications.pending ?? 0}</p>
        </article>

        <article className="metric-card">
          <h3>Stagiaires suivis</h3>
          <p>{summary.interns ?? 0}</p>
        </article>
      </div>
    );
  }

  if (role === "supervisor") {
    return (
      <div className="dashboard-grid">
        <article className="metric-card">
          <h3>Mes stagiaires</h3>
          <p>{summary.interns ?? 0}</p>
        </article>

        <article className="metric-card">
          <h3>Rapports a valider</h3>
          <p>{summary.pendingReports ?? 0}</p>
        </article>

        <article className="metric-card">
          <h3>Taches en cours</h3>
          <p>{tasks.inProgress ?? 0}</p>
        </article>

        <article className="metric-card">
          <h3>Taches terminees</h3>
          <p>{tasks.done ?? 0}</p>
        </article>
      </div>
    );
  }

  if (role === "student") {
    return (
      <div className="dashboard-grid">
        <article className="metric-card">
          <h3>Candidatures</h3>
          <p>{summary.applications ?? 0}</p>
        </article>

        <article className="metric-card">
          <h3>Stage actif</h3>
          <p>{summary.activeInternships ? "Oui" : "Non"}</p>
        </article>

        <article className="metric-card">
          <h3>Taches en cours</h3>
          <p>{tasks.inProgress ?? 0}</p>
        </article>

        <article className="metric-card">
          <h3>Rapports soumis</h3>
          <p>{reports.submitted ?? 0}</p>
        </article>
      </div>
    );
  }

  return (
    <div className="dashboard-grid">
      <article className="metric-card">
        <h3>Etudiants</h3>
        <p>{summary.students ?? 0}</p>
      </article>

      <article className="metric-card">
        <h3>Entreprises</h3>
        <p>{summary.companies ?? 0}</p>
      </article>

      <article className="metric-card">
        <h3>Superviseurs</h3>
        <p>{summary.supervisors ?? 0}</p>
      </article>

      <article className="metric-card">
        <h3>Stages actifs</h3>
        <p>{summary.internships ?? 0}</p>
      </article>
    </div>
  );
};

export default DashboardPage;
