import { useEffect, useState } from "react";
import apiClient from "../api/client";
import AdminDashboardAnalytics from "../components/admin/AdminDashboardAnalytics";
import LoadingSpinner from "../components/LoadingSpinner";
import PageLayout from "../components/PageLayout";
import { Alert } from "../components/ui";

const defaultAnalytics = {
  usersDistribution: { students: 0, supervisors: 0, admins: 0 },
  assignmentStatus: { active: 0, paused: 0, completed: 0, terminated: 0 }
};

const DashboardPage = () => {
  const [analytics, setAnalytics] = useState(defaultAnalytics);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        setError("");
        const [usersRes, assignmentRes] = await Promise.all([
          apiClient.get("/admin/analytics/users-distribution"),
          apiClient.get("/admin/analytics/assignment-status")
        ]);

        setAnalytics({
          usersDistribution: usersRes.data || defaultAnalytics.usersDistribution,
          assignmentStatus: assignmentRes.data || defaultAnalytics.assignmentStatus
        });
      } catch (err) {
        setError(err.response?.data?.message || "Impossible de charger les graphiques analytiques");
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  if (loading) {
    return <LoadingSpinner label="Chargement du tableau de bord…" />;
  }

  return (
    <PageLayout
      title="Tableau de bord administrateur"
      subtitle="Répartition des utilisateurs et statuts des affectations de stage."
      containerClassName="admin-dashboard admin-dashboard--analytics"
    >
      {error ? (
        <Alert variant="error">{error}</Alert>
      ) : (
        <AdminDashboardAnalytics analytics={analytics} loading={false} />
      )}
    </PageLayout>
  );
};

export default DashboardPage;
