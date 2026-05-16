import { useEffect, useState } from "react";
import apiClient from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";
import PageLayout from "../components/PageLayout";
import { Alert, StatCard } from "../components/ui";
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
        setError("");
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

  if (loading) return <LoadingSpinner label="Chargement du tableau de bord…" />;
  if (error) return <Alert variant="error">{error}</Alert>;

  const role = user?.role;
  const summary = stats?.summary || {};
  const tasks = stats?.tasks || {};

  if (role === "supervisor") {
    return (
      <PageLayout
        title="Tableau de bord superviseur"
        subtitle="Suivez les stagiaires, les projets et les validations en attente."
      >
        <div className="dashboard-grid ds-stat-grid">
          <StatCard label="Stagiaires" value={summary.interns ?? 0} icon="👥" />
          <StatCard label="Projets" value={summary.projects ?? 0} icon="▣" />
          <StatCard label="Rapports en attente" value={summary.pendingReports ?? 0} icon="▤" />
          <StatCard label="Tâches en cours" value={tasks.inProgress ?? 0} icon="☑" />
        </div>
        <section className="card ds-card ds-card--flat">
          <h3 className="ds-card__title">Activité récente</h3>
          <p className="ds-card__subtitle">Visualisation des tendances (à connecter aux métriques temps réel).</p>
          <div className="ds-chart-placeholder" style={{ marginTop: "1rem" }}>
            Graphique d&apos;activité — placeholder
          </div>
        </section>
      </PageLayout>
    );
  }

  if (role === "student") {
    return (
      <PageLayout title="Tableau de bord stagiaire" subtitle="Suivez vos projets et l'avancement de vos tâches.">
        <div className="dashboard-grid ds-stat-grid">
          <StatCard label="Projets" value={summary.projects ?? 0} icon="◇" />
          <StatCard label="Missions actives" value={summary.activePlacements ?? 0} icon="◎" />
          <StatCard label="À faire" value={tasks.todo ?? 0} icon="□" />
          <StatCard label="Terminées" value={tasks.done ?? 0} icon="✓" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Tableau de bord administrateur" subtitle="Vue globale de la plateforme.">
      <div className="dashboard-grid ds-stat-grid">
        <StatCard label="Utilisateurs" value={summary.totalUsers ?? 0} icon="◎" />
        <StatCard label="Projets" value={summary.totalProjects ?? 0} icon="▣" />
        <StatCard label="Stagiaires" value={summary.interns ?? 0} icon="👥" />
        <StatCard label="Rapports" value={summary.totalReports ?? 0} icon="▤" />
      </div>
    </PageLayout>
  );
};

export default DashboardPage;
