import DonutChart from "../charts/DonutChart";
import { Alert, Card } from "../ui";

const USER_COLORS = {
  students: "#3b82f6",
  supervisors: "#10b981",
  admins: "#f59e0b"
};

const ASSIGNMENT_COLORS = {
  active: "#3b82f6",
  paused: "#f59e0b",
  completed: "#10b981",
  terminated: "#ef4444"
};

const USER_LABELS = {
  students: "Stagiaires",
  supervisors: "Superviseurs",
  admins: "Administrateurs"
};

const ASSIGNMENT_LABELS = {
  active: "Actifs",
  paused: "En pause",
  completed: "Terminés",
  terminated: "Résiliés"
};

const AdminDashboardAnalytics = ({ analytics, error, loading }) => {
  if (loading) {
    return (
      <Card title="Analytique" subtitle="Répartition des utilisateurs et des affectations de stage.">
        <div className="ds-chart-grid ds-chart-grid--loading" aria-busy="true">
          <div className="ds-chart-skeleton" />
          <div className="ds-chart-skeleton" />
        </div>
      </Card>
    );
  }

  return (
    <Card title="Analytique" subtitle="Répartition des utilisateurs actifs et des statuts d'affectation.">
      {error && <Alert variant="error">{error}</Alert>}
      <div className="ds-chart-grid">
        <DonutChart
          title="Répartition des utilisateurs"
          data={analytics.usersDistribution}
          labels={USER_LABELS}
          colors={USER_COLORS}
          emptyLabel="Aucun utilisateur actif"
        />
        <DonutChart
          title="Statut des affectations de stage"
          data={analytics.assignmentStatus}
          labels={ASSIGNMENT_LABELS}
          colors={ASSIGNMENT_COLORS}
          emptyLabel="Aucune affectation enregistrée"
        />
      </div>
    </Card>
  );
};

export default AdminDashboardAnalytics;
