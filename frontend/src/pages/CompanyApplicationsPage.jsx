import { useEffect, useMemo, useState } from "react";
import apiClient from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";

const CompanyApplicationsPage = () => {
  const [internships, setInternships] = useState([]);
  const [selectedInternshipId, setSelectedInternshipId] = useState("");
  const [applications, setApplications] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [supervisorByApplication, setSupervisorByApplication] = useState({});
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const selectedInternship = useMemo(
    () => internships.find((item) => item.id === selectedInternshipId) || null,
    [internships, selectedInternshipId]
  );

  const loadBaseData = async () => {
    try {
      setLoading(true);
      const [internshipsRes, supervisorsRes] = await Promise.all([
        apiClient.get("/internships/my"),
        apiClient.get("/companies/supervisors")
      ]);

      const myInternships = Array.isArray(internshipsRes.data) ? internshipsRes.data : [];
      const mySupervisors = Array.isArray(supervisorsRes.data) ? supervisorsRes.data : [];

      setInternships(myInternships);
      setSupervisors(mySupervisors);

      if (myInternships.length > 0) {
        setSelectedInternshipId((prev) => prev || myInternships[0].id);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Chargement des donnees impossible");
    } finally {
      setLoading(false);
    }
  };

  const loadApplicants = async (internshipId) => {
    if (!internshipId) {
      setApplications([]);
      return;
    }

    try {
      const { data } = await apiClient.get(`/applications/internships/${internshipId}/applicants`);
      setApplications(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Chargement des candidatures impossible");
    }
  };

  useEffect(() => {
    loadBaseData();
  }, []);

  useEffect(() => {
    loadApplicants(selectedInternshipId);
  }, [selectedInternshipId]);

  const reviewApplication = async (applicationId, status) => {
    try {
      setReviewingId(applicationId);
      setError("");
      setNotice("");

      const supervisorId = supervisorByApplication[applicationId] || null;

      const { data } = await apiClient.patch(`/applications/${applicationId}/review`, {
        status,
        supervisorId: status === "accepted" ? supervisorId : null
      });

      if (status === "accepted" && data?.assignedSupervisorId) {
        setNotice("Candidature acceptee et superviseur assigne.");
      } else if (status === "accepted") {
        setNotice("Candidature acceptee. Vous pouvez assigner un superviseur ensuite.");
      } else {
        setNotice("Candidature rejetee.");
      }

      await loadApplicants(selectedInternshipId);
    } catch (err) {
      setError(err.response?.data?.message || "Mise a jour de la candidature impossible");
    } finally {
      setReviewingId(null);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Chargement des candidatures..." />;
  }

  return (
    <div className="page-grid">
      <section className="card">
        <h3>Selectionner une offre</h3>
        <select
          value={selectedInternshipId}
          onChange={(event) => setSelectedInternshipId(event.target.value)}
          disabled={internships.length === 0}
        >
          {internships.length === 0 && <option value="">Aucune offre publiee</option>}
          {internships.map((internship) => (
            <option key={internship.id} value={internship.id}>
              {internship.title}
            </option>
          ))}
        </select>
        {selectedInternship && (
          <p>
            Offre active: <strong>{selectedInternship.title}</strong>
          </p>
        )}
      </section>

      <section className="card">
        <h3>Candidatures recues</h3>
        {error && <p className="form-error">{error}</p>}
        {notice && <p className="form-success">{notice}</p>}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Candidat</th>
                <th>Competences</th>
                <th>Experience</th>
                <th>Statut</th>
                <th>Superviseur</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((item) => (
                <tr key={item.application_id}>
                  <td>{item.full_name}</td>
                  <td>{item.skills || "-"}</td>
                  <td>{item.experience || "-"}</td>
                  <td>{item.status}</td>
                  <td>
                    <select
                      value={supervisorByApplication[item.application_id] || ""}
                      onChange={(event) =>
                        setSupervisorByApplication((prev) => ({
                          ...prev,
                          [item.application_id]: event.target.value
                        }))
                      }
                      disabled={item.status !== "pending"}
                    >
                      <option value="">Assigner plus tard</option>
                      {supervisors.map((supervisor) => (
                        <option key={supervisor.id} value={supervisor.id}>
                          {supervisor.full_name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    {item.status === "pending" ? (
                      <div className="inline-actions">
                        <button
                          type="button"
                          className="primary-btn small"
                          disabled={reviewingId === item.application_id}
                          onClick={() => reviewApplication(item.application_id, "accepted")}
                        >
                          Accepter
                        </button>
                        <button
                          type="button"
                          className="danger-btn small"
                          disabled={reviewingId === item.application_id}
                          onClick={() => reviewApplication(item.application_id, "rejected")}
                        >
                          Rejeter
                        </button>
                      </div>
                    ) : (
                      <span>-</span>
                    )}
                  </td>
                </tr>
              ))}
              {applications.length === 0 && (
                <tr>
                  <td colSpan={6}>Aucune candidature pour cette offre.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default CompanyApplicationsPage;
