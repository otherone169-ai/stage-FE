import { useEffect, useMemo, useState } from "react";
import apiClient from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short"
  });
};

const AdminApplicationsPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({
    student: "",
    company: "",
    status: "all"
  });

  const filteredRows = useMemo(() => {
    const studentQuery = filters.student.trim().toLowerCase();
    const companyQuery = filters.company.trim().toLowerCase();

    return rows.filter((row) => {
      const searchableStudent = `${row.full_name || ""} ${row.student_email || ""}`.toLowerCase();
      const searchableCompany = `${row.company_name || ""} ${row.internship_title || ""}`.toLowerCase();
      const matchesStudent = !studentQuery || searchableStudent.includes(studentQuery);
      const matchesCompany = !companyQuery || searchableCompany.includes(companyQuery);
      const matchesStatus = filters.status === "all" || row.status === filters.status;

      return matchesStudent && matchesCompany && matchesStatus;
    });
  }, [rows, filters]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await apiClient.get("/admin/applications");
        setRows(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load applications");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return <LoadingSpinner label="Loading applications..." />;
  }

  return (
    <div className="page-grid page-grid-stack">
      <section className="card">
        <h3>Applications Filters</h3>
        <form className="stack-form" onSubmit={(event) => event.preventDefault()}>
          <input
            placeholder="Search by student name or email"
            value={filters.student}
            onChange={(event) => setFilters((prev) => ({ ...prev, student: event.target.value }))}
          />
          <input
            placeholder="Filter by company or internship"
            value={filters.company}
            onChange={(event) => setFilters((prev) => ({ ...prev, company: event.target.value }))}
          />
          <select
            value={filters.status}
            onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        </form>
      </section>

      <section className="card">
        <h3>Applications Across Users</h3>
        {error && <p className="form-error">{error}</p>}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Internship</th>
                <th>Company</th>
                <th>Status</th>
                <th>Applied At</th>
                <th>Profile</th>
                <th>Supervisor</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.application_id}>
                  <td>
                    <strong>{row.full_name || "-"}</strong>
                    <div>{row.student_email}</div>
                  </td>
                  <td>
                    <strong>{row.internship_title || "-"}</strong>
                    <div>{row.internship_is_active ? "active" : "closed"}</div>
                  </td>
                  <td>
                    <strong>{row.company_name || "-"}</strong>
                    <div>{row.supervisor_email}</div>
                  </td>
                  <td>{row.status}</td>
                  <td>{formatDate(row.applied_at)}</td>
                  <td>{row.profile_completed ? "completed" : "incomplete"}</td>
                  <td>{row.supervisor_name || "-"}</td>
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={7}>No applications match the current filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AdminApplicationsPage;
