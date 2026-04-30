import { useEffect, useMemo, useState } from "react";
import apiClient from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";

const StudentProgressPage = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await apiClient.get("/students/progress");
        setRows(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load your progress");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const internships = useMemo(() => {
    const map = new Map();

    rows.forEach((row) => {
      if (!map.has(row.intern_id)) {
        map.set(row.intern_id, {
          id: row.intern_id,
          status: row.intern_status,
          startDate: row.start_date,
          endDate: row.end_date,
          projectTitle: row.project_title,
          projectDescription: row.project_description,
          feedback: []
        });
      }

      const item = map.get(row.intern_id);
      if (row.feedback_comment && !item.feedback.some((f) => f.comment === row.feedback_comment)) {
        item.feedback.push({
          comment: row.feedback_comment
        });
      }
    });

    return Array.from(map.values());
  }, [rows]);

  if (loading) return <LoadingSpinner label="Loading your progress..." />;

  return (
    <div className="page-grid">
      <section className="card">
        <h3>My Internship Progress</h3>
        {error && <p className="form-error">{error}</p>}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Stage</th>
                <th>Status</th>
                <th>Start</th>
                <th>End</th>
                <th>Feedback</th>
              </tr>
            </thead>
            <tbody>
              {internships.map((internship) => (
                <tr key={internship.id}>
                  <td>{internship.projectTitle || "-"}</td>
                  <td>{internship.status || "-"}</td>
                  <td>{internship.startDate ? new Date(internship.startDate).toLocaleDateString() : "-"}</td>
                  <td>{internship.endDate ? new Date(internship.endDate).toLocaleDateString() : "-"}</td>
                  <td>
                    {internship.feedback.length > 0
                      ? internship.feedback.map((item) => item.comment || "-").join(" | ")
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h3>My Tasks</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Task</th>
                <th>Stage</th>
                <th>Status</th>
                <th>Deadline</th>
              </tr>
            </thead>
            <tbody>
              {rows
                .filter((row) => row.task_id)
                .map((row, index) => (
                  <tr key={`${row.intern_id}-${row.task_id}-${index}`}>
                    <td>{row.task_title}</td>
                    <td>{row.project_title || "-"}</td>
                    <td>{row.task_status}</td>
                    <td>{row.deadline ? new Date(row.deadline).toLocaleDateString() : "-"}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default StudentProgressPage;
