import { useEffect, useState } from "react";
import apiClient from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";

const supervisorStatusOptions = ["active", "paused", "completed"];

const InternsPage = () => {
  const [interns, setInterns] = useState([]);
  const [selectedIntern, setSelectedIntern] = useState(null);
  const [feedbackForm, setFeedbackForm] = useState({ comment: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await apiClient.get("/supervisors/interns/list");
      setInterns(data);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors du chargement des stagiaires");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadDetails = async (internId) => {
    try {
      setError("");
      const { data } = await apiClient.get(`/supervisors/interns/${internId}`);
      setSelectedIntern(data);
    } catch (err) {
      setError(err.response?.data?.message || "Details stagiaire indisponibles");
    }
  };

  const updateStatus = async (internId, status) => {
    try {
      setError("");
      setMessage("");
      await apiClient.patch(`/supervisors/interns/${internId}/status`, { status });
      setMessage("Statut mis a jour");
      await loadData();
      await loadDetails(internId);
    } catch (err) {
      setError(err.response?.data?.message || "Mise a jour du statut impossible");
    }
  };

  const submitFeedback = async (event) => {
    event.preventDefault();
    if (!selectedIntern) return;

    try {
      setError("");
      setMessage("");
      await apiClient.post(`/supervisors/interns/${selectedIntern.id}/feedback`, {
        comment: feedbackForm.comment
      });
      setFeedbackForm({ comment: "" });
      setMessage("Feedback ajoute");
      await loadDetails(selectedIntern.id);
    } catch (err) {
      setError(err.response?.data?.message || "Feedback impossible");
    }
  };

  if (loading) return <LoadingSpinner label="Chargement des stagiaires..." />;

  return (
    <div className="page-grid">
      <section className="card">
        <h3>Liste des stagiaires</h3>
        {error && <p className="form-error">{error}</p>}
        {message && <p className="form-success">{message}</p>}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Competences</th>
                <th>Projet</th>
                <th>Statut</th>
                <th>Taches</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {interns.map((intern) => (
                <tr key={intern.id}>
                  <td>{intern.full_name}</td>
                  <td>{intern.skills || "-"}</td>
                  <td>{intern.project_title || "-"}</td>
                  <td>
                    <select value={intern.status} onChange={(event) => updateStatus(intern.id, event.target.value)}>
                      {supervisorStatusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    {intern.completed_tasks}/{intern.total_tasks}
                  </td>
                  <td>
                    <button type="button" className="secondary-btn small" onClick={() => loadDetails(intern.id)}>
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selectedIntern && (
        <section className="card">
          <h3>{selectedIntern.full_name}</h3>
          <p>{selectedIntern.student_email}</p>
          <p>
            {selectedIntern.project_title}
          </p>

          <form className="stack-form" onSubmit={submitFeedback}>
            <label>Feedback</label>
            <textarea
              value={feedbackForm.comment}
              onChange={(event) => setFeedbackForm((current) => ({ ...current, comment: event.target.value }))}
              placeholder="Feedback pour le stagiaire"
              required
            />
            <button type="submit" className="primary-btn">
              Ajouter le feedback
            </button>
          </form>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tache</th>
                  <th>Statut</th>
                  <th>Echeance</th>
                </tr>
              </thead>
              <tbody>
                {(selectedIntern.tasks || []).map((task) => (
                  <tr key={task.id}>
                    <td>{task.title}</td>
                    <td>{task.status}</td>
                    <td>{task.deadline ? new Date(task.deadline).toLocaleDateString() : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Feedback</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {(selectedIntern.feedback || []).map((item) => (
                  <tr key={item.id}>
                    <td>{item.comment || "-"}</td>
                    <td>{new Date(item.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};

export default InternsPage;
