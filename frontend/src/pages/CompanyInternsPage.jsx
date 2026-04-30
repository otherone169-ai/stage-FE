import { useEffect, useState } from "react";
import apiClient from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";

const statusOptions = ["active", "paused", "completed", "terminated"];

const CompanyInternsPage = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await apiClient.get("/companies/interns/monitor");
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load interns");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (internId, status) => {
    try {
      await apiClient.patch(`/companies/interns/${internId}/status`, { status });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update intern status");
    }
  };

  if (loading) return <LoadingSpinner label="Loading interns..." />;

  return (
    <section className="card">
      <h3>Intern Monitoring</h3>
      {error && <p className="form-error">{error}</p>}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Project</th>
              <th>Tasks</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.intern_id}>
                <td>{row.student_name}</td>
                <td>{row.project_title || "-"}</td>
                <td>
                  {row.tasks_done}/{row.tasks_count}
                </td>
                <td>
                  <select
                    value={row.internship_status}
                    onChange={(event) => updateStatus(row.intern_id, event.target.value)}
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default CompanyInternsPage;
