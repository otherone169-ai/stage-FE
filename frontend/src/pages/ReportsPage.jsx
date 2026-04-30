import { useEffect, useState } from "react";
import apiClient from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../hooks/useAuth";

const ReportsPage = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ internId: "", title: "", content: "" });

  const canValidate = user?.role === "supervisor";
  const isStudent = user?.role === "student";

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [reportsRes, progressRes] = await Promise.all([
        isStudent ? apiClient.get("/reports/my") : apiClient.get("/reports/validation/list"),
        isStudent ? apiClient.get("/students/progress") : Promise.resolve({ data: [] })
      ]);

      const uniqueInterns = new Map();
      (Array.isArray(progressRes.data) ? progressRes.data : []).forEach((item) => {
        if (item.intern_id && !uniqueInterns.has(item.intern_id)) {
          uniqueInterns.set(item.intern_id, item);
        }
      });

      setReports(Array.isArray(reportsRes.data) ? reportsRes.data : []);
      setInterns(Array.from(uniqueInterns.values()));
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors du chargement des rapports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const submitReport = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const { data } = await apiClient.post("/reports", {
        internId: form.internId,
        title: form.title,
        content: form.content
      });

      await apiClient.patch(`/reports/${data.id}/submit`);
      setForm({ internId: "", title: "", content: "" });
      setMessage("Rapport soumis pour validation");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Envoi du rapport impossible");
    }
  };

  const submitDraft = async (reportId) => {
    try {
      setError("");
      setMessage("");
      await apiClient.patch(`/reports/${reportId}/submit`);
      setMessage("Rapport soumis pour validation");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Soumission du rapport impossible");
    }
  };

  const validateReport = async (reportId, status) => {
    const fallback = status === "validated" ? "Rapport valide" : "Rapport a revoir";
    const feedback = window.prompt("Feedback", fallback);
    if (feedback === null) return;

    try {
      setError("");
      setMessage("");
      await apiClient.patch(`/reports/${reportId}/validate`, {
        status,
        feedback
      });
      setMessage(status === "validated" ? "Rapport valide" : "Rapport rejete");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Validation impossible");
    }
  };

  if (loading) return <LoadingSpinner label="Chargement des rapports..." />;

  return (
    <div className="page-grid">
      {isStudent && (
        <section className="card">
          <h3>Soumettre un rapport</h3>
          <form className="stack-form" onSubmit={submitReport}>
            <input
              placeholder="Titre"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              required
            />
            <select
              value={form.internId}
              onChange={(e) => setForm((prev) => ({ ...prev, internId: e.target.value }))}
              required
            >
              <option value="">Selectionner un stage</option>
              {interns.map((intern) => (
                <option key={intern.intern_id} value={intern.intern_id}>
                  {intern.project_title ? `${intern.project_title} (${intern.intern_status})` : intern.intern_id}
                </option>
              ))}
            </select>
            <textarea
              placeholder="Detaillez vos activites"
              value={form.content}
              onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
              required
            />
            <button type="submit" className="primary-btn">
              Soumettre le rapport
            </button>
          </form>
        </section>
      )}

      <section className="card">
        <h3>{canValidate ? "Rapports a valider" : "Historique des rapports"}</h3>
        {error && <p className="form-error">{error}</p>}
        {message && <p className="form-success">{message}</p>}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Titre</th>
                <th>Stage</th>
                <th>Statut</th>
                <th>Feedback</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <td>{report.title}</td>
                  <td>{report.internship_title || "-"}</td>
                  <td>{report.status}</td>
                  <td>{report.feedback || "-"}</td>
                  <td>
                    {canValidate && report.status === "submitted" && (
                      <div className="inline-actions">
                        <button
                          type="button"
                          className="primary-btn small"
                          onClick={() => validateReport(report.id, "validated")}
                        >
                          Valider
                        </button>
                        <button
                          type="button"
                          className="danger-btn small"
                          onClick={() => validateReport(report.id, "rejected")}
                        >
                          Rejeter
                        </button>
                      </div>
                    )}
                    {isStudent && report.status === "draft" && (
                      <button type="button" className="primary-btn small" onClick={() => submitDraft(report.id)}>
                        Soumettre
                      </button>
                    )}
                    {!((canValidate && report.status === "submitted") || (isStudent && report.status === "draft")) && (
                      <span>-</span>
                    )}
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr>
                  <td colSpan={5}>Aucun rapport.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default ReportsPage;
