import { useEffect, useState } from "react";
import apiClient from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../hooks/useAuth";
import "../styles/reports-form.css";

const ReportsPage = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ internId: "", title: "", content: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [charCount, setCharCount] = useState(0);

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

  const handleInputChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'content') {
      setCharCount(value.length);
    }
  };

  const submitReport = async (event) => {
    event.preventDefault();
    
    // Validation simple
    if (!form.title.trim() || !form.internId || !form.content.trim()) {
      setError("Veuillez remplir tous les champs obligatoires");
      return;
    }
    
    if (form.content.length < 50) {
      setError("Le contenu doit contenir au moins 50 caractères");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      const { data } = await apiClient.post("/reports", {
        internId: form.internId,
        title: form.title.trim(),
        content: form.content.trim()
      });

      await apiClient.patch(`/reports/${data.id}/submit`);
      setForm({ internId: "", title: "", content: "" });
      setCharCount(0);
      setMessage("✅ Rapport soumis avec succès pour validation");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "❌ Envoi du rapport impossible");
    } finally {
      setIsSubmitting(false);
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
        <section className="reports-form-container">
          <div className="reports-form-header">
            <h2>Soumettre un rapport</h2>
            <p className="reports-form-subtitle">
              Partagez vos progrès et réalisations avec votre superviseur
            </p>
          </div>
          
          <form className="reports-form" onSubmit={submitReport}>
            <div className="reports-form-group">
              <label className="reports-form-label required">
                Titre du rapport
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="reports-form-input"
                  placeholder="Ex: Rapport hebdomadaire - Semaine 3"
                  value={form.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  required
                  disabled={isSubmitting}
                  maxLength={100}
                />
                <span className="reports-form-icon">📝</span>
              </div>
            </div>

            <div className="reports-form-group">
              <label className="reports-form-label required">
                Stage concerné
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  className="reports-form-select"
                  value={form.internId}
                  onChange={(e) => handleInputChange('internId', e.target.value)}
                  required
                  disabled={isSubmitting}
                >
                  <option value="">Sélectionner un stage</option>
                  {interns.map((intern) => (
                    <option key={intern.intern_id} value={intern.intern_id}>
                      {intern.project_title 
                        ? `${intern.project_title} (${intern.intern_status})` 
                        : `Stage ${intern.intern_id}`
                      }
                    </option>
                  ))}
                </select>
                <span className="reports-form-icon">💼</span>
              </div>
            </div>

            <div className="reports-form-group">
              <label className="reports-form-label required">
                Contenu du rapport
              </label>
              <textarea
                className="reports-form-textarea"
                placeholder="Décrivez en détail vos activités, réalisations, difficultés rencontrées et objectifs atteints cette semaine..."
                value={form.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                required
                disabled={isSubmitting}
                minLength={50}
                maxLength={2000}
              />
              <div className={`reports-form-char-counter ${charCount > 1800 ? 'error' : charCount > 1500 ? 'warning' : ''}`}>
                {charCount}/2000 caractères
              </div>
            </div>

            <button 
              type="submit" 
              className={`reports-form-submit ${isSubmitting ? 'reports-form-loading' : ''}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Soumission en cours...' : '📤 Soumettre le rapport'}
            </button>
          </form>

          {error && (
            <div className="reports-form-error">
              <span>⚠️</span>
              {error}
            </div>
          )}
          
          {message && (
            <div className="reports-form-success">
              <span>✅</span>
              {message}
            </div>
          )}
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
                  <td>{report.project_title || "-"}</td>
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
