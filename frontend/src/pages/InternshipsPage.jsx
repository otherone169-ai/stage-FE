import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import apiClient from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../hooks/useAuth";

const InternshipsPage = () => {
  const { user } = useAuth();
  const isCompany = user?.role === "company";
  const isStudent = user?.role === "student";
  const [filters, setFilters] = useState({ location: "", domain: "", duration: "", skills: "" });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const isSupervisor = user?.role === "supervisor";
      const endpoint = isCompany ? "/internships/my" : isSupervisor ? "/supervisors/internships/list" : "/internships";
      const requestConfig = isCompany || isSupervisor ? undefined : { params: { ...filters, page: 1, limit: 20 } };
      const internshipsRes = await apiClient.get(endpoint, requestConfig);
      const data = internshipsRes.data;
      setRows(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load internships");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const apply = async (internshipId) => {
    try {
      await apiClient.post("/applications", { internshipId });
      alert("Application submitted");
    } catch (err) {
      setError(err.response?.data?.message || "Apply failed");
    }
  };

  if (loading) return <LoadingSpinner label="Loading internships..." />;

  if (isCompany) {
    return <Navigate to="/app/company/internships" replace />;
  }

  return (
    <div className="page-grid">
      <section className="card">
        <h3>{isCompany ? "My Company Internships" : "Internship Search"}</h3>
      {!isCompany && (
        <form
          className="stack-form"
          onSubmit={(e) => {
            e.preventDefault();
            load();
          }}
        >
          <input
            placeholder="Location"
            value={filters.location}
            onChange={(e) => setFilters((p) => ({ ...p, location: e.target.value }))}
          />
          <input
            placeholder="Domain"
            value={filters.domain}
            onChange={(e) => setFilters((p) => ({ ...p, domain: e.target.value }))}
          />
          <input
            placeholder="Duration"
            value={filters.duration}
            onChange={(e) => setFilters((p) => ({ ...p, duration: e.target.value }))}
          />
          <input
            placeholder="Skills (comma separated)"
            value={filters.skills}
            onChange={(e) => setFilters((p) => ({ ...p, skills: e.target.value }))}
          />
          <button className="primary-btn" type="submit">
            Search
          </button>
        </form>
      )}

      {error && <p className="form-error">{error}</p>}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                {!isCompany && <th>Company</th>}
                {!isCompany && <th>Location</th>}
                {!isCompany && <th>Domain</th>}
                {!isCompany && <th>Duration</th>}
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.title}</td>
                  {!isCompany && <td>{row.company_name}</td>}
                  {!isCompany && <td>{row.location || "-"}</td>}
                  {!isCompany && <td>{row.domain || "-"}</td>}
                  {!isCompany && <td>{row.duration || "-"}</td>}
                  <td>
                    {isStudent ? (
                      <button className="primary-btn small" type="button" onClick={() => apply(row.id)}>
                        Apply
                      </button>
                    ) : (
                      <span>-</span>
                    )}
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

export default InternshipsPage;
