import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import { useAuth } from "../hooks/useAuth";
import FormField from "../components/FormField";

const SupervisorAssignInternPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignmentForm, setAssignmentForm] = useState({
    projectId: "",
    studentId: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!user || user.role !== "supervisor") {
      navigate("/app/login");
      return;
    }

    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [projectsResponse, studentsResponse] = await Promise.all([
        client.get("/api/projects"),
        client.get("/api/students")
      ]);
      setProjects(projectsResponse.data || []);
      setStudents(studentsResponse.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setAssignmentForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAssign = async (event) => {
    event.preventDefault();

    if (!assignmentForm.projectId || !assignmentForm.studentId) {
      setError("Veuillez sélectionner un projet et un stagiaire");
      return;
    }

    try {
      setError("");
      setSuccess("");

      await client.post("/api/projects/assign-intern", {
        projectId: assignmentForm.projectId,
        studentId: assignmentForm.studentId
      });

      setSuccess("Stagiaire assigné au projet avec succès !");
      setAssignmentForm({ projectId: "", studentId: "" });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to assign intern");
    }
  };

  if (loading) {
    return <div className="loading-spinner">Chargement...</div>;
  }

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1>👥 Assigner des stagiaires</h1>
        <p className="page-subtitle">
          Assignez des stagiaires à vos projets existants
        </p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card">
        <h2>Nouvelle assignation</h2>
        <form onSubmit={handleAssign} className="stack-form">
          <div className="form-grid">
            <FormField
              id="projectId"
              label="Projet *"
              name="projectId"
              value={assignmentForm.projectId}
              onChange={handleInputChange}
              required
            >
              <select 
                name="projectId" 
                value={assignmentForm.projectId} 
                onChange={handleInputChange}
                required
              >
                <option value="">Choisir un projet</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              id="studentId"
              label="Stagiaire *"
              name="studentId"
              value={assignmentForm.studentId}
              onChange={handleInputChange}
              required
            >
              <select 
                name="studentId" 
                value={assignmentForm.studentId} 
                onChange={handleInputChange}
                required
              >
                <option value="">Choisir un stagiaire</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.full_name} ({student.email})
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              ✅ Assigner le stagiaire
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => navigate("/app/supervisor/projects")}
            >
              Annuler
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <h2>📊 Aperçu</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{projects.length}</div>
            <div className="stat-label">Projets disponibles</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{students.length}</div>
            <div className="stat-label">Stagiaires disponibles</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupervisorAssignInternPage;
