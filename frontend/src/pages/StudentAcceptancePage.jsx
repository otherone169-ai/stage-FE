import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import client from "../api/client";

const StudentAcceptancePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (user?.role !== "student") {
      navigate("/login");
      return;
    }
    loadWorkflows();
  }, [user, navigate]);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      const response = await client.get("/workflow/students/acceptance-workflows");
      setWorkflows(response.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load workflows");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (workflowId) => {
    try {
      setError("");
      await client.post("/workflow/students/acceptance/confirm", { workflowId });
      setWorkflows(workflows.map(w => 
        w.id === workflowId ? { ...w, status: "confirmed", student_confirmed_at: new Date().toISOString() } : w
      ));
      setSuccess("Acceptation confirmée!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to confirm");
    }
  };

  if (!user || user.role !== "student") {
    return <div className="page-wrapper"><p>Unauthorized</p></div>;
  }

  return (
    <div className="page-wrapper">
      <div className="card">
        <h2>Mes propositions de stage</h2>

        {error && <div className="form-error">{error}</div>}
        {success && <div className="form-success">{success}</div>}

        {loading ? (
          <p>Chargement...</p>
        ) : workflows.length === 0 ? (
          <p>Aucune proposition reçue</p>
        ) : (
          <div style={{ display: "grid", gap: "16px" }}>
            {workflows.map(workflow => (
              <div key={workflow.id} style={{
                padding: "16px",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                backgroundColor: "var(--bg-secondary)"
              }}>
                <h3>{workflow.project_title}</h3>
                <p><strong>Superviseur:</strong> {workflow.supervisor_name} ({workflow.position})</p>
                {workflow.supervisor_message && (
                  <p><strong>Message:</strong> {workflow.supervisor_message}</p>
                )}
                
                <div style={{ 
                  marginTop: "12px", 
                  padding: "12px", 
                  backgroundColor: "var(--bg-main)", 
                  borderRadius: "8px"
                }}>
                  <strong>Statut:</strong> {workflow.status}
                  {workflow.status === "confirmed" && (
                    <p style={{ color: "green", margin: "4px 0 0 0" }}>
                      ✓ Confirmée le {new Date(workflow.student_confirmed_at).toLocaleDateString("fr-FR")}
                    </p>
                  )}
                </div>

                {workflow.status === "accepted" && (
                  <button
                    className="primary-btn"
                    onClick={() => handleConfirm(workflow.id)}
                    style={{ marginTop: "12px" }}
                  >
                    Confirmer l'acceptation
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAcceptancePage;
