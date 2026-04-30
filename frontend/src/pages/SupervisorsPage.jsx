import { useEffect, useState } from "react";
import apiClient from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";

const SupervisorsPage = () => {
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const supervisorsRes = await apiClient.get("/supervisors");

      setSupervisors(Array.isArray(supervisorsRes.data) ? supervisorsRes.data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur de chargement des superviseurs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce superviseur ?")) return;

    try {
      await apiClient.delete(`/supervisors/${id}`);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Suppression impossible");
    }
  };

  if (loading) return <LoadingSpinner label="Chargement des superviseurs..." />;

  return (
    <div className="page-grid page-grid-stack">
      <section className="card">
        <h3>Liste des superviseurs</h3>
        {error && <p className="form-error">{error}</p>}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Entreprise</th>
                <th>Poste</th>
                <th>Nb stagiaires</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {supervisors.map((sup) => (
                <tr key={sup.id}>
                  <td>{sup.full_name}</td>
                  <td>{sup.email}</td>
                  <td>{sup.company_name || "-"}</td>
                  <td>{sup.position || "-"}</td>
                  <td>{sup.interns_count}</td>
                  <td>
                    <button className="danger-btn" type="button" onClick={() => handleDelete(sup.id)}>
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default SupervisorsPage;
