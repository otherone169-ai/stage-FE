import { useEffect, useMemo, useState } from "react";
import apiClient from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";

const AdminRhCompaniesPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({
    company: ""
  });

  const filteredRows = useMemo(() => {
    const companyQuery = filters.company.trim().toLowerCase();

    return rows.filter((row) => {
      const rowCompany = (row.company_name || "").toLowerCase();
      return !companyQuery || rowCompany.includes(companyQuery);
    });
  }, [rows, filters]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await apiClient.get("/admin/companies-rh");
        setRows(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load companies");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return <LoadingSpinner label="Loading companies..." />;
  }

  return (
    <div className="page-grid page-grid-stack">
      <section className="card">
        <h3>Company filters</h3>
        <form className="stack-form" onSubmit={(event) => event.preventDefault()}>
          <input
            placeholder="Filter by company"
            value={filters.company}
            onChange={(event) => setFilters((prev) => ({ ...prev, company: event.target.value }))}
          />
        </form>
      </section>

      <section className="card">
        <h3>Companies overview</h3>
        {error && <p className="form-error">{error}</p>}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Company</th>
                <th>Location</th>
                <th>Website</th>
                <th>Supervisors</th>
                <th>Projects</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.company_name}>
                  <td>{row.company_name || "-"}</td>
                  <td>{row.company_location || "-"}</td>
                  <td>{row.company_website || "-"}</td>
                  <td>{row.supervisors_count ?? 0}</td>
                  <td>{row.projects_count ?? 0}</td>
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={5}>No companies match the current filter.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AdminRhCompaniesPage;
