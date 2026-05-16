import { useEffect, useMemo, useState } from "react";
import apiClient from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";
import PageLayout from "../components/PageLayout";
import { Alert, Card, PageToolbar } from "../components/ui";

const AdminRhCompaniesPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({ company: "" });

  const filteredRows = useMemo(() => {
    const companyQuery = filters.company.trim().toLowerCase();
    return rows.filter((row) => {
      const rowCompany = (row.company_name || "").toLowerCase();
      return !companyQuery || rowCompany.includes(companyQuery);
    });
  }, [rows, filters]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await apiClient.get("/admin/companies-rh");
        setRows(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.response?.data?.message || "Impossible de charger les entreprises");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return <LoadingSpinner label="Chargement des entreprises…" />;
  }

  return (
    <PageLayout
      title="Entreprises"
      subtitle="Vue consolidée des entreprises, superviseurs et projets associés."
    >
      {error && <Alert variant="error">{error}</Alert>}

      <Card title="Filtres" flat>
        <PageToolbar
          searchValue={filters.company}
          onSearchChange={(value) => setFilters((prev) => ({ ...prev, company: value }))}
          searchPlaceholder="Filtrer par nom d'entreprise…"
          meta={`${filteredRows.length} résultat${filteredRows.length !== 1 ? "s" : ""}`}
        />
      </Card>

      <Card title="Vue d'ensemble">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Entreprise</th>
                <th>Localisation</th>
                <th>Site web</th>
                <th>Superviseurs</th>
                <th>Projets</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.company_name}>
                  <td>{row.company_name || "—"}</td>
                  <td>{row.company_location || "—"}</td>
                  <td>{row.company_website || "—"}</td>
                  <td>{row.supervisors_count ?? 0}</td>
                  <td>{row.projects_count ?? 0}</td>
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={5} className="muted-cell">
                    Aucune entreprise ne correspond au filtre.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </PageLayout>
  );
};

export default AdminRhCompaniesPage;
