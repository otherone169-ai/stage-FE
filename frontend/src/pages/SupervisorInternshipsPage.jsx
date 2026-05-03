import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import client from "../api/client";

const SupervisorInternshipsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    internshipId: "",
    title: "",
    description: "",
    objectives: "",
    tasks: [{ title: "", description: "" }]
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (user?.role !== "supervisor") {
      navigate("/login");
      return;
    }
    loadInternships();
  }, [user, navigate]);

  const loadInternships = async () => {
    try {
      setLoading(true);
      const response = await client.get("/workflow/supervisors/internships");
      setInternships(response.data);
      setFormData((current) => ({
        ...current,
        internshipId: current.internshipId || response.data[0]?.id || ""
      }));
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load internships");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError("");
      setSuccess("");
      const tasks = formData.tasks
        .map((task) => ({
          title: task.title.trim(),
          description: task.description.trim()
        }))
        .filter((task) => task.title.length > 0);

      if (!formData.internshipId) {
        setError("Veuillez choisir un stage existant");
        return;
      }

      if (tasks.length === 0) {
        setError("Ajoutez au moins une tache pour ce projet");
        return;
      }

      const response = await client.post("/projects", {
        internshipId: formData.internshipId,
        title: formData.title,
        description: formData.description,
        objectives: formData.objectives,
        tasks
      });

      setFormData({
        internshipId: formData.internshipId,
        title: "",
        description: "",
        objectives: "",
        tasks: [{ title: "", description: "" }]
      });
      setShowForm(false);
      setSuccess(`Projet "${response.data.title}" créé avec ses tâches.`);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || "Failed to create project");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const updateTask = (index, field, value) => {
    setFormData((current) => ({
      ...current,
      tasks: current.tasks.map((task, taskIndex) =>
        taskIndex === index ? { ...task, [field]: value } : task
      )
    }));
  };

  const addTask = () => {
    setFormData((current) => ({
      ...current,
      tasks: [...current.tasks, { title: "", description: "" }]
    }));
  };

  const removeTask = (index) => {
    setFormData((current) => ({
      ...current,
      tasks: current.tasks.length === 1 ? current.tasks : current.tasks.filter((_, taskIndex) => taskIndex !== index)
    }));
  };

  const goToStudents = (internshipId) => {
    navigate(`/app/supervisor/internships/${internshipId}/students`);
  };

  if (!user || user.role !== "supervisor") {
    return <div className="page-wrapper"><p>Unauthorized</p></div>;
  }

  return (
    <div className="page-wrapper">
      <div className="card">
        <h2>Gestion des stages et projets</h2>
        
        {error && <div className="form-error">{error}</div>}
        {success && <div className="form-success">{success}</div>}

        {!showForm ? (
          <button className="primary-btn" onClick={() => setShowForm(true)}>
            + Créer un projet de stage
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="stack-form">
            <label className="field-card">
              <span>Stage existant</span>
              <select name="internshipId" value={formData.internshipId} onChange={handleInputChange} required>
                <option value="">Choisir un stage</option>
                {internships.map((internship) => (
                  <option key={internship.id} value={internship.id}>
                    {internship.title}
                  </option>
                ))}
              </select>
            </label>
            <input
              type="text"
              name="title"
              placeholder="Titre du projet"
              value={formData.title}
              onChange={handleInputChange}
              required
            />
            <textarea
              name="description"
              placeholder="Description détaillée du projet"
              value={formData.description}
              onChange={handleInputChange}
              required
            />
            <textarea
              name="objectives"
              placeholder="Objectifs pédagogiques ou livrables"
              value={formData.objectives}
              onChange={handleInputChange}
            />
            <div className="stack-form" style={{ gap: "12px" }}>
              <div className="inline-actions" style={{ justifyContent: "space-between" }}>
                <strong>Taches associées</strong>
                <button type="button" className="secondary-btn small" onClick={addTask}>
                  + Ajouter une tache
                </button>
              </div>
              {formData.tasks.map((task, index) => (
                <div key={`${index}-${task.title}`} className="field-card">
                  <span>Tache {index + 1}</span>
                  <input
                    type="text"
                    placeholder="Titre de la tache"
                    value={task.title}
                    onChange={(event) => updateTask(index, "title", event.target.value)}
                    required
                  />
                  <textarea
                    placeholder="Description courte (optionnelle)"
                    value={task.description}
                    onChange={(event) => updateTask(index, "description", event.target.value)}
                  />
                  <div className="inline-actions">
                    <button
                      type="button"
                      className="danger-btn small"
                      onClick={() => removeTask(index)}
                      disabled={formData.tasks.length === 1}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button type="submit" className="primary-btn">
                Créer le projet
              </button>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => {
                  setShowForm(false);
                  setFormData((current) => ({
                    internshipId: current.internshipId,
                    title: "",
                    description: "",
                    objectives: "",
                    tasks: [{ title: "", description: "" }]
                  }));
                }}
              >
                Annuler
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <p>Chargement...</p>
        ) : internships.length === 0 ? (
          <p>Aucun stage disponible</p>
        ) : (
          <table style={{ width: "100%", marginTop: "20px" }}>
            <thead>
              <tr>
                <th>Titre</th>
                <th>Domaine</th>
                <th>Localisation</th>
                <th>Durée</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {internships.map(internship => (
                <tr key={internship.id}>
                  <td>{internship.title}</td>
                  <td>{internship.domain || "-"}</td>
                  <td>{internship.location || "-"}</td>
                  <td>{internship.duration_weeks ? `${internship.duration_weeks} semaines` : "-"}</td>
                  <td>{internship.is_active ? "Active" : "Inactive"}</td>
                  <td>
                    <button
                      className="secondary-btn"
                      onClick={() => goToStudents(internship.id)}
                    >
                      Voir stagiaires
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default SupervisorInternshipsPage;
