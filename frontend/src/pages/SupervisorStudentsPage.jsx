import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import client from "../api/client";
import { useAuth } from "../hooks/useAuth";

const initialAddForm = {
  email: "",
  startDate: "",
  endDate: "",
  cv: null
};

const initialAcceptForm = {
  projectId: "",
  message: ""
};

const statusStyle = (status) => {
  const normalized = (status || "").toLowerCase();
  if (normalized === "confirmed") {
    return { backgroundColor: "#d1fae5", color: "#065f46" };
  }
  if (normalized === "accepted") {
    return { backgroundColor: "#e0f2fe", color: "#075985" };
  }
  return { backgroundColor: "#fff3cd", color: "#856404" };
};

const prettyDate = (value) => (value ? new Date(value).toLocaleDateString("fr-FR") : "Non défini");

const SupervisorStudentsPage = () => {
  const { user } = useAuth();
  const { internshipId } = useParams();
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showManageModal, setShowManageModal] = useState(false);
  const [acceptingId, setAcceptingId] = useState(null);

  const [addForm, setAddForm] = useState(initialAddForm);
  const [acceptForm, setAcceptForm] = useState(initialAcceptForm);

  useEffect(() => {
    if (user?.role !== "supervisor") {
      navigate("/login");
      return;
    }
    refreshData();
  }, [internshipId, user, navigate]);

  const refreshData = async () => {
    try {
      setLoading(true);
      setError("");
      const [studentsResponse, projectsResponse] = await Promise.all([
        client.get(`/workflow/supervisors/internships/${internshipId}/students`),
        client.get(`/projects?internshipId=${internshipId}`)
      ]);
      setStudents(studentsResponse.data);
      setProjects(projectsResponse.data);
    } catch (err) {
      setError(err.response?.data?.error || "Impossible de charger les stagiaires");
    } finally {
      setLoading(false);
    }
  };

  const handleAddInputChange = (event) => {
    const { name, value } = event.target;
    setAddForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddCvChange = (event) => {
    const file = event.target.files && event.target.files[0] ? event.target.files[0] : null;
    setAddForm((prev) => ({ ...prev, cv: file }));
  };

  const handleAddStudent = async (event) => {
    event.preventDefault();

    if (!addForm.email) {
      setError("L'email du stagiaire est obligatoire");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const payload = new FormData();
      payload.append("email", addForm.email.trim().toLowerCase());
      if (addForm.startDate) payload.append("startDate", addForm.startDate);
      if (addForm.endDate) payload.append("endDate", addForm.endDate);
      if (addForm.cv) payload.append("cv", addForm.cv);

      await client.post(`/workflow/supervisors/internships/${internshipId}/students`, payload, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setSuccess("Stagiaire ajouté avec succès");
      setAddForm(initialAddForm);
      setShowAddForm(false);
      await refreshData();
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'ajout du stagiaire");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptStudent = async (internId) => {
    if (!acceptForm.projectId) {
      setError("Veuillez choisir un projet existant");
      return;
    }

    try {
      setError("");
      await client.post("/workflow/supervisors/students/accept", {
        internId,
        projectId: acceptForm.projectId,
        message: acceptForm.message
      });
      setAcceptingId(null);
      setAcceptForm(initialAcceptForm);
      setSuccess("Stagiaire accepté avec succès");
      await refreshData();
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'acceptation");
    }
  };

  const handleDeleteStudent = async (internId) => {
    if (!window.confirm("Supprimer ce stagiaire du stage ?")) {
      return;
    }

    try {
      setError("");
      await client.delete(`/workflow/supervisors/internships/${internshipId}/students/${internId}`);
      setStudents((prev) => prev.filter((item) => item.id !== internId));
      setSuccess("Stagiaire supprimé");
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de la suppression");
    }
  };

  if (!user || user.role !== "supervisor") {
    return (
      <div className="page-wrapper">
        <p>Unauthorized</p>
      </div>
    );
  }

  const pendingCount = students.filter((student) => (student.acceptance_status || "pending") === "pending").length;
  const activeCount = students.length - pendingCount;

  return (
    <div className="page-wrapper supervisor-students-page">
      <div className="card supervisor-students-hero">
        <div className="supervisor-students-header">
          <div>
            <p className="section-kicker">🎯 Stagiaires</p>
            <h2>Gestion des stagiaires</h2>
            <p className="section-subtitle">
              Ajoutez un stagiaire, envoyez son lien de création de mot de passe et suivez son parcours dans un espace unique.
            </p>
          </div>
          <div className="supervisor-stats">
            <div>
              <strong>{students.length}</strong>
              <span>stagiaires</span>
            </div>
            <div>
              <strong>{pendingCount}</strong>
              <span>en attente</span>
            </div>
            <div>
              <strong>{activeCount}</strong>
              <span>actifs</span>
            </div>
          </div>
        </div>

        {error && <div className="form-error">{error}</div>}
        {success && <div className="form-success">{success}</div>}

        <div className="supervisor-students-actions">
          <button className="primary-btn add-intern-btn" onClick={() => setShowAddForm((prev) => !prev)}>
            {showAddForm ? "Fermer" : "Add Intern"}
          </button>
          <span className="helper-text">Le stagiaire reçoit un email pour définir son mot de passe.</span>
        </div>

        {showAddForm && (
          <form onSubmit={handleAddStudent} className="supervisor-add-form">
            <div className="field-grid">
              <label className="field-card">
                <span>Email du stagiaire</span>
                <input
                  type="email"
                  name="email"
                  placeholder="stagiaire@ecole.com"
                  value={addForm.email}
                  onChange={handleAddInputChange}
                  required
                />
              </label>

              <label className="field-card">
                <span>Date de début du stage</span>
                <input type="date" name="startDate" value={addForm.startDate} onChange={handleAddInputChange} />
              </label>

              <label className="field-card">
                <span>Date de fin du stage</span>
                <input type="date" name="endDate" value={addForm.endDate} onChange={handleAddInputChange} />
              </label>

              <label className="field-card field-card-upload">
                <span>Upload du CV</span>
                <input type="file" accept=".pdf,.doc,.docx" onChange={handleAddCvChange} />
                <small>PDF, DOC ou DOCX. Le fichier est stocké localement de manière sécurisée.</small>
              </label>
            </div>

            <div className="form-actions">
              <button type="submit" className="primary-btn" disabled={submitting}>
                {submitting ? "Ajout..." : "Créer le compte stagiaire"}
              </button>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => {
                  setShowAddForm(false);
                  setAddForm(initialAddForm);
                }}
              >
                Annuler
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <p>Chargement...</p>
        ) : students.length === 0 ? (
          <div className="empty-state">
            <h3>Aucun stagiaire pour le moment</h3>
            <p>Commencez par ajouter un stagiaire avec son CV pour ouvrir le flux de création de compte.</p>
          </div>
        ) : (
          <div className="table-wrap supervisor-students-table">
            <table>
              <thead>
                <tr>
                  <th>Stagiaire</th>
                  <th>Email</th>
                  <th>Statut</th>
                  <th>Dates</th>
                  <th>CV</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <strong>{student.full_name || student.email?.split("@")[0] || "Stagiaire"}</strong>
                      <div className="muted-cell">Ajouté le {prettyDate(student.created_at)}</div>
                    </td>
                    <td>{student.email || "-"}</td>
                    <td>
                      <span className="status-chip" style={statusStyle(student.acceptance_status)}>
                        {student.acceptance_status || "pending"}
                      </span>
                    </td>
                    <td>
                      <div className="date-stack">
                        <span>Début: {prettyDate(student.start_date)}</span>
                        <span>Fin: {prettyDate(student.end_date)}</span>
                      </div>
                    </td>
                    <td>
                      <span className="cv-badge">{student.cv_url ? "Disponible" : "Non fourni"}</span>
                    </td>
                    <td>
                      <div className="inline-actions">
                        {student.acceptance_status === "pending" && (
                          <button
                            type="button"
                            className="primary-btn small"
                            onClick={() => {
                              setAcceptingId(student.id);
                              setAcceptForm({
                                projectId: projects[0]?.id || "",
                                message: ""
                              });
                            }}
                          >
                            Accepter
                          </button>
                        )}
                        <button
                          type="button"
                          className="secondary-btn small"
                          onClick={() => {
                            setSelectedStudent(student);
                            setShowManageModal(true);
                          }}
                        >
                          Gérer
                        </button>
                        <button type="button" className="danger-btn small" onClick={() => handleDeleteStudent(student.id)}>
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {acceptingId && (
        <div className="overlay-shell">
          <div className="overlay-card">
            <h3>Accepter le stagiaire</h3>
            <div className="stack-form">
              <label className="field-card">
                <span>Projet existant</span>
                <select
                  value={acceptForm.projectId}
                  onChange={(event) =>
                    setAcceptForm((prev) => ({
                      ...prev,
                      projectId: event.target.value
                    }))
                  }
                >
                  <option value="">Choisir un projet</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </select>
              </label>
              {projects.length > 0 && acceptForm.projectId && (
                <div className="parsed-data-box">
                  {(() => {
                    const selectedProject = projects.find((project) => project.id === acceptForm.projectId);
                    if (!selectedProject) return null;
                    return (
                      <>
                        <strong>{selectedProject.title}</strong>
                        <p>{selectedProject.description || "Aucune description disponible."}</p>
                        <small>
                          {selectedProject.task_count || 0} tache(s) associee(s)
                        </small>
                      </>
                    );
                  })()}
                </div>
              )}
              {projects.length === 0 && (
                <div className="form-error" style={{ margin: 0 }}>
                  Aucun projet n'est disponible. Creez un projet avant d'affecter le stagiaire.
                </div>
              )}
              <textarea
                placeholder="Message (optionnel)"
                value={acceptForm.message}
                onChange={(event) =>
                  setAcceptForm((prev) => ({
                    ...prev,
                    message: event.target.value
                  }))
                }
              />
              <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    className="primary-btn"
                    onClick={() => handleAcceptStudent(acceptingId)}
                    disabled={projects.length === 0}
                  >
                  Accepter
                </button>
                <button
                    type="button"
                  className="secondary-btn"
                  onClick={() => {
                    setAcceptingId(null);
                    setAcceptForm(initialAcceptForm);
                  }}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showManageModal && selectedStudent && (
        <div className="overlay-shell">
          <div className="overlay-card overlay-card-wide">
            <h3>Gérer {selectedStudent.full_name || "stagiaire"}</h3>
            <div className="detail-grid">
              <div>
                <span className="detail-label">Email</span>
                <p>{selectedStudent.email || "-"}</p>
              </div>
              <div>
                <span className="detail-label">Statut</span>
                <p>
                  <span className="status-chip" style={statusStyle(selectedStudent.acceptance_status)}>
                    {selectedStudent.acceptance_status || "pending"}
                  </span>
                </p>
              </div>
              <div>
                <span className="detail-label">Début</span>
                <p>{prettyDate(selectedStudent.start_date)}</p>
              </div>
              <div>
                <span className="detail-label">Fin</span>
                <p>{prettyDate(selectedStudent.end_date)}</p>
              </div>
            </div>

            {selectedStudent.cv_url && (
              <p className="detail-link">
                <strong>CV:</strong> {selectedStudent.cv_url}
              </p>
            )}

            {selectedStudent.cv_file_url && (
              <p className="detail-link">
                <strong>CV (n8n):</strong> {selectedStudent.cv_file_url}
              </p>
            )}

            {selectedStudent.cv_parsed_data && (
              <div className="parsed-data-box">
                <strong>Informations CV analysées par IA:</strong>
                <pre style={{ fontSize: "12px", overflow: "auto", maxHeight: "220px" }}>
                  {JSON.stringify(selectedStudent.cv_parsed_data, null, 2)}
                </pre>
              </div>
            )}

            <button type="button" className="secondary-btn" onClick={() => setShowManageModal(false)}>
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupervisorStudentsPage;
