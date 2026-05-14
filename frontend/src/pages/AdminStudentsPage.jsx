import { useEffect, useMemo, useState } from "react";
import apiClient from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";

const AdminStudentsPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({
    email: "",
    status: "all"
  });

  const filteredRows = useMemo(() => {
    const emailQuery = filters.email.trim().toLowerCase();

    return rows.filter((row) => {
      const rowEmail = (row.email || "").toLowerCase();
      const rowStatus = row.is_active ? "active" : "inactive";

      const matchesEmail = !emailQuery || rowEmail.includes(emailQuery);
      const matchesStatus = filters.status === "all" || rowStatus === filters.status;

      return matchesEmail && matchesStatus;
    });
  }, [rows, filters]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await apiClient.get("/admin/students");
        setRows(data || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load students");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const updateStatus = async (row) => {
    try {
      setError("");
      const nextStatus = !row.is_active;
      await apiClient.patch(`/admin/users/${row.user_id}/status`, { isActive: nextStatus });
      setRows((current) =>
        current.map((item) => (item.user_id === row.user_id ? { ...item, is_active: nextStatus } : item))
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update user status");
    }
  };

  const deleteUser = async (row) => {
    if (!window.confirm("Delete this student account?")) return;

    try {
      setError("");
      await apiClient.delete(`/admin/users/${row.user_id}`);
      setRows((current) => current.filter((item) => item.user_id !== row.user_id));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete user");
    }
  };

  const viewStudentDetails = (row) => {
    setSelectedStudent(row);
    setShowStudentModal(true);
  };

  const closeStudentModal = () => {
    setShowStudentModal(false);
    setSelectedStudent(null);
  };

  if (loading) {
    return <LoadingSpinner label="Loading students..." />;
  }

  return (
    <div className="page-grid page-grid-stack">
      {/* Student Details Modal */}
      {showStudentModal && selectedStudent && (
        <div className="modal-overlay" onClick={closeStudentModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Détails du Stagiaire</h3>
              <button type="button" className="modal-close-btn" onClick={closeStudentModal}>
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="student-details-form">
                <div className="detail-row">
                  <label>Nom complet</label>
                  <input 
                    type="text" 
                    value={selectedStudent.full_name || "-"} 
                    readOnly 
                    className="detail-input"
                  />
                </div>
                
                <div className="detail-row">
                  <label>Email</label>
                  <input 
                    type="email" 
                    value={selectedStudent.email} 
                    readOnly 
                    className="detail-input"
                  />
                </div>
                
                <div className="detail-row">
                  <label>Téléphone</label>
                  <input 
                    type="tel" 
                    value={selectedStudent.phone || "-"} 
                    readOnly 
                    className="detail-input"
                  />
                </div>
                
                <div className="detail-row">
                  <label>Éducation</label>
                  <textarea 
                    value={selectedStudent.education || "-"} 
                    readOnly 
                    className="detail-textarea"
                    rows={2}
                  />
                </div>
                
                <div className="detail-row">
                  <label>Compétences</label>
                  <textarea 
                    value={selectedStudent.skills || "-"} 
                    readOnly 
                    className="detail-textarea"
                    rows={2}
                  />
                </div>
                
                <div className="detail-row">
                  <label>Statut du compte</label>
                  <div className="status-display">
                    <span className={`status-badge ${selectedStudent.is_active ? 'active' : 'inactive'}`}>
                      {selectedStudent.is_active ? '✅ Actif' : '⏸️ Inactif'}
                    </span>
                  </div>
                </div>
                
                <div className="detail-row">
                  <label>Statut du profil</label>
                  <div className="status-display">
                    <span className={`profile-badge ${selectedStudent.profile_completed ? 'completed' : 'incomplete'}`}>
                      {selectedStudent.profile_completed ? '✅ Complet' : '⚠️ Incomplet'}
                    </span>
                  </div>
                </div>
                
                <div className="detail-row">
                  <label>Statistiques</label>
                  <div className="stats-grid">
                    <div className="stat-item">
                      <span className="stat-number">{selectedStudent.assignments_count ?? 0}</span>
                      <span className="stat-label">Affectations (total)</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-number">{selectedStudent.active_assignments_count ?? 0}</span>
                      <span className="stat-label">Actives / en pause</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button type="button" className="secondary-btn" onClick={closeStudentModal}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
      <section className="card">
        <h3>Students Filters</h3>
        <form className="stack-form" onSubmit={(e) => e.preventDefault()}>
          <input
            placeholder="Search by student email"
            value={filters.email}
            onChange={(e) => setFilters((prev) => ({ ...prev, email: e.target.value }))}
          />
          <select
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </form>
      </section>

      <section className="card">
        <h3>Registered Students</h3>
        {error && <p className="form-error">{error}</p>}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Education</th>
                <th>Skills</th>
                <th>Assignments</th>
                <th>Active</th>
                <th>Profile</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.user_id}>
                  <td>{row.full_name || "-"}</td>
                  <td>{row.email}</td>
                  <td>{row.phone || "-"}</td>
                  <td>{row.education || "-"}</td>
                  <td>{row.skills || "-"}</td>
                  <td>{row.assignments_count ?? 0}</td>
                  <td>{row.active_assignments_count ?? 0}</td>
                  <td>{row.profile_completed ? "completed" : "incomplete"}</td>
                  <td>{row.is_active ? "active" : "inactive"}</td>
                  <td>
                    <div className="inline-actions">
                      <button 
                        type="button" 
                        className="consult-btn" 
                        onClick={() => viewStudentDetails(row)}
                        title="Consulter les détails"
                      >
                        👁️ Consulter
                      </button>
                      <button 
                        type="button" 
                        className="suspend-btn" 
                        onClick={() => updateStatus(row)}
                        title={row.is_active ? "Suspendre le compte" : "Activer le compte"}
                      >
                        {row.is_active ? "⏸️ Suspendre" : "▶️ Activer"}
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

export default AdminStudentsPage;
