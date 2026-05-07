import { useEffect, useMemo, useState } from "react";
import apiClient from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";

const AdminSupervisorsPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [supervisors, setSupervisors] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    status: "all"
  });

  const filteredSupervisors = useMemo(() => {
    const searchQuery = filters.search.trim().toLowerCase();

    return supervisors.filter((supervisor) => {
      const name = (supervisor.full_name || "").toLowerCase();
      const email = (supervisor.email || "").toLowerCase();
      const status = supervisor.is_active ? "active" : "inactive";

      const matchesSearch = !searchQuery || 
        name.includes(searchQuery) || 
        email.includes(searchQuery);
      const matchesStatus = filters.status === "all" || status === filters.status;

      return matchesSearch && matchesStatus;
    });
  }, [supervisors, filters]);

  useEffect(() => {
    const loadSupervisors = async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await apiClient.get("/admin/supervisors");
        setSupervisors(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load supervisors");
      } finally {
        setLoading(false);
      }
    };

    loadSupervisors();
  }, []);

  if (loading) {
    return <LoadingSpinner label="Loading supervisors..." />;
  }

  return (
    <div className="page-grid page-grid-stack">
      <section className="card">
        <h3>Supervisors Filters</h3>
        <form className="stack-form" onSubmit={(e) => e.preventDefault()}>
          <input
            placeholder="Search by name or email"
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
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
        <h3>Supervisors List</h3>
        {error && <p className="form-error">{error}</p>}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredSupervisors.map((supervisor) => (
                <tr key={supervisor.id}>
                  <td>{supervisor.full_name || "-"}</td>
                  <td>{supervisor.email}</td>
                  <td>
                    <span className={`status-badge ${supervisor.is_active ? 'active' : 'inactive'}`}>
                      {supervisor.is_active ? '✅ Active' : '⏸️ Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredSupervisors.length === 0 && !error && (
            <div className="empty-state">
              <p>No supervisors found matching your criteria.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminSupervisorsPage;
