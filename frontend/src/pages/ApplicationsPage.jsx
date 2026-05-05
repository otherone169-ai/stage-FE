import { useEffect, useState } from "react";
import apiClient from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";

const ApplicationsPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { data } = await apiClient.get("/students/applications");
        setItems(data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load applications");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) return <LoadingSpinner label="Chargement des candidatures..." />;

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: "En attente", class: "pending" },
      accepted: { label: "Acceptée", class: "accepted" },
      rejected: { label: "Rejetée", class: "rejected" }
    };
    const statusInfo = statusMap[status] || { label: status, class: "default" };
    return (
      <span className={`table-status-badge ${statusInfo.class}`}>
        {statusInfo.label}
      </span>
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <section className="card">
      <div>
        <h2>Mes Candidatures</h2>
        <p className="section-subtitle">Suivi de vos candidatures aux offres de stage</p>
      </div>
      {error && <div className="form-error">{error}</div>}
      {items.length === 0 ? (
        <div className="empty-state">
          <p>Aucune candidature pour le moment.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Offre de Stage</th>
                <th>Entreprise</th>
                <th>Statut</th>
                <th>Date de candidature</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id}>
                  <td>
                    <strong>{it.title}</strong>
                    <p className="muted-cell">{it.description?.substring(0, 50)}...</p>
                  </td>
                  <td>{it.company_name}</td>
                  <td>{getStatusBadge(it.status)}</td>
                  <td>{formatDate(it.applied_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default ApplicationsPage;
