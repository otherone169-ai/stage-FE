import { useEffect, useMemo, useState } from "react";
import apiClient from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";

const AdminRhCompaniesPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({
    email: "",
    company: "",
    status: "all"
  });

  const filteredRows = useMemo(() => {
    const emailQuery = filters.email.trim().toLowerCase();
    const companyQuery = filters.company.trim().toLowerCase();

    return rows.filter((row) => {
      const rowEmail = (row.email || "").toLowerCase();
      const rowCompany = (row.company_name || "").toLowerCase();
      const rowStatus = row.is_active ? "active" : "inactive";

      const matchesEmail = !emailQuery || rowEmail.includes(emailQuery);
      const matchesCompany = !companyQuery || rowCompany.includes(companyQuery);
      const matchesStatus = filters.status === "all" || rowStatus === filters.status;

      return matchesEmail && matchesCompany && matchesStatus;
    });
  }, [rows, filters]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await apiClient.get("/admin/companies-rh");
        setRows(data || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load RH and companies");
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
    if (!window.confirm("Delete this company/RH account?")) return;

    try {
      setError("");
      await apiClient.delete(`/admin/users/${row.user_id}`);
      setRows((current) => current.filter((item) => item.user_id !== row.user_id));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete user");
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading RH & companies..." />;
  }

  return (
    <div className="page-grid page-grid-stack">
      <section className="card">
        <h3>RH & Companies Filters</h3>
        <form className="stack-form" onSubmit={(e) => e.preventDefault()}>
          <input
            placeholder="Search by RH email"
            value={filters.email}
            onChange={(e) => setFilters((prev) => ({ ...prev, email: e.target.value }))}
          />
          <input
            placeholder="Filter by company"
            value={filters.company}
            onChange={(e) => setFilters((prev) => ({ ...prev, company: e.target.value }))}
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
        <h3>RH & Companies</h3>
        {error && <p className="form-error">{error}</p>}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>RH Email</th>
                <th>Company</th>
                <th>Location</th>
                <th>Website</th>
                <th>Internships</th>
                <th>Supervisors</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.user_id}>
                  <td>{row.email}</td>
                  <td>{row.company_name || "-"}</td>
                  <td>{row.company_location || "-"}</td>
                  <td>{row.company_website || "-"}</td>
                  <td>{row.internships_count ?? 0}</td>
                  <td>{row.supervisors_count ?? 0}</td>
                  <td>{row.is_active ? "active" : "inactive"}</td>
                  <td>
                    <div className="inline-actions">
                      <button type="button" className="secondary-btn small" onClick={() => updateStatus(row)}>
                        {row.is_active ? "Suspend" : "Activate"}
                      </button>
                      <button type="button" className="danger-btn small" onClick={() => deleteUser(row)}>
                        Delete
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

export default AdminRhCompaniesPage;
