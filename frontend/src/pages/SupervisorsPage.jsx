import { useEffect, useState } from "react";
import apiClient from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";

const SupervisorsPage = () => {
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showSupervisorModal, setShowSupervisorModal] = useState(false);
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const supervisorsRes = await apiClient.get("/supervisors");

      setSupervisors(Array.isArray(supervisorsRes.data) ? supervisorsRes.data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur de chargement des superviseurs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce superviseur ?")) return;

    try {
      await apiClient.delete(`/supervisors/${id}`);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Suppression impossible");
    }
  };

  const viewSupervisorDetails = (sup) => {
    setSelectedSupervisor(sup);
    setShowSupervisorModal(true);
  };

  const closeSupervisorModal = () => {
    setShowSupervisorModal(false);
    setSelectedSupervisor(null);
  };

  const banSupervisor = async (sup) => {
    if (!window.confirm(`Bannir définitivement le superviseur ${sup.full_name} ?\n\nCette action est irréversible.`)) return;

    try {
      setError("");
      await apiClient.delete(`/supervisors/${sup.id}`);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Bannissement impossible");
    }
  };

  if (loading) return <LoadingSpinner label="Chargement des superviseurs..." />;

  return (
    <div className="page-grid page-grid-stack">
      {/* Supervisor Details Modal */}
      {showSupervisorModal && selectedSupervisor && (
        <div className="modal-overlay" onClick={closeSupervisorModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Détails du Superviseur</h3>
              <button type="button" className="modal-close-btn" onClick={closeSupervisorModal}>
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="student-details-form">
                <div className="detail-row">
                  <label>Nom complet</label>
                  <input 
                    type="text" 
                    value={selectedSupervisor.full_name} 
                    readOnly 
                    className="detail-input"
                  />
                </div>
                
                <div className="detail-row">
                  <label>Email</label>
                  <input 
                    type="email" 
                    value={selectedSupervisor.email} 
                    readOnly 
                    className="detail-input"
                  />
                </div>
                
                <div className="detail-row">
                  <label>Entreprise</label>
                  <input 
                    type="text" 
                    value={selectedSupervisor.company_name || "-"} 
                    readOnly 
                    className="detail-input"
                  />
                </div>
                
                <div className="detail-row">
                  <label>Poste</label>
                  <input 
                    type="text" 
                    value={selectedSupervisor.position || "-"} 
                    readOnly 
                    className="detail-input"
                  />
                </div>
                
                <div className="detail-row">
                  <label>Statistiques</label>
                  <div className="stats-grid">
                    <div className="stat-item">
                      <span className="stat-number">{selectedSupervisor.interns_count || 0}</span>
                      <span className="stat-label">Stagiaires</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-number">{selectedSupervisor.projects_count || 0}</span>
                      <span className="stat-label">Projets</span>
                    </div>
                  </div>
                </div>
                
                <div className="detail-row">
                  <label>Statut du compte</label>
                  <div className="status-display">
                    <span className="status-badge active">
                      ✅ Actif
                    </span>
                  </div>
                </div>
                
                <div className="detail-row">
                  <label>Rôle</label>
                  <div className="status-display">
                    <span className="profile-badge completed">
                      👨‍🏫 Superviseur
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button type="button" className="secondary-btn" onClick={closeSupervisorModal}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
      <section className="card">
        <h3>Liste des superviseurs</h3>
        {error && <p className="form-error">{error}</p>}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Entreprise</th>
                <th>Poste</th>
                <th>Nb stagiaires</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {supervisors.map((sup) => (
                <tr key={sup.id}>
                  <td>{sup.full_name}</td>
                  <td>{sup.email}</td>
                  <td>{sup.company_name || "-"}</td>
                  <td>{sup.position || "-"}</td>
                  <td>{sup.interns_count}</td>
                  <td>
                    <div className="inline-actions">
                      <button 
                        type="button" 
                        className="consult-btn" 
                        onClick={() => viewSupervisorDetails(sup)}
                        title="Consulter les détails"
                      >
                        👁️ Consulter
                      </button>
                      <button 
                        type="button" 
                        className="ban-btn" 
                        onClick={() => banSupervisor(sup)}
                        title="Bannir définitivement"
                      >
                        🔒 Bannir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default SupervisorsPage;
