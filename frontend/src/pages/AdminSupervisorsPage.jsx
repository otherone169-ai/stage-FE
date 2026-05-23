import { useCallback, useEffect, useMemo, useState } from "react";
import apiClient from "../api/client";
import AccountStatusBadge from "../components/admin/AccountStatusBadge";
import AdminTableActions from "../components/admin/AdminTableActions";
import UserDetailsModal from "../components/admin/UserDetailsModal";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";
import LoadingSpinner from "../components/LoadingSpinner";
import PageLayout from "../components/PageLayout";
import Pagination from "../components/Pagination";
import { Alert, Card, PageToolbar } from "../components/ui";
import { useToast } from "../context/ToastContext";
import { usePagination } from "../hooks/usePagination";

const PAGE_SIZE = 10;

const buildSupervisorFields = (supervisor) => [
  { label: "Nom complet", value: supervisor.full_name || "—" },
  { label: "Email", value: supervisor.email },
  { label: "Poste", value: supervisor.position || "—" },
  { label: "Entreprise", value: supervisor.company_name || "—" },
  { label: "Localisation", value: supervisor.company_location || "—" },
  { label: "Site web", value: supervisor.company_website || "—" },
  {
    label: "Statut du compte",
    type: "badge",
    badge: <AccountStatusBadge isActive={supervisor.is_active} />
  },
  {
    label: "Activité",
    type: "stats",
    fullWidth: true,
    stats: [
      { value: supervisor.interns_count ?? 0, label: "Stagiaires" },
      { value: supervisor.projects_count ?? 0, label: "Projets" }
    ]
  }
];

const AdminSupervisorsPage = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [filters, setFilters] = useState({ search: "", status: "all" });

  const filteredRows = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    return rows.filter((row) => {
      const name = (row.full_name || "").toLowerCase();
      const email = (row.email || "").toLowerCase();
      const company = (row.company_name || "").toLowerCase();
      const status = row.is_active ? "active" : "inactive";
      const matchesSearch =
        !query || name.includes(query) || email.includes(query) || company.includes(query);
      const matchesStatus = filters.status === "all" || status === filters.status;
      return matchesSearch && matchesStatus;
    });
  }, [rows, filters]);

  const { page, setPage, totalPages, paginatedItems, rangeStart, rangeEnd, totalItems } =
    usePagination(filteredRows, PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [filters.search, filters.status, setPage]);

  const loadSupervisors = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await apiClient.get("/admin/supervisors");
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Impossible de charger les superviseurs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSupervisors();
  }, [loadSupervisors]);

  const applyStatusChange = async (row, nextStatus) => {
    try {
      setActionLoading(true);
      setError("");
      await apiClient.patch(`/admin/users/${row.user_id}/status`, { isActive: nextStatus });
      setRows((current) =>
        current.map((item) => (item.user_id === row.user_id ? { ...item, is_active: nextStatus } : item))
      );
      showToast(nextStatus ? "Compte superviseur réactivé." : "Compte superviseur désactivé.", "success");
    } catch (err) {
      const message = err.response?.data?.message || "Impossible de mettre à jour le statut";
      setError(message);
      showToast(message, "error");
    } finally {
      setActionLoading(false);
      setPendingAction(null);
    }
  };

  const requestStatusChange = (row) => {
    setPendingAction({
      row,
      nextStatus: !row.is_active,
      title: row.is_active ? "Désactiver le compte ?" : "Réactiver le compte ?",
      message: row.is_active
        ? `Le superviseur ${row.full_name || row.email} ne pourra plus se connecter.`
        : `Le superviseur ${row.full_name || row.email} pourra à nouveau accéder à la plateforme.`
    });
  };

  if (loading) {
    return <LoadingSpinner label="Chargement des superviseurs…" />;
  }

  return (
    <PageLayout
      title="Superviseurs"
      subtitle="Consultez les profils, gérez l'accès et suivez l'activité des superviseurs."
    >
      {error && <Alert variant="error">{error}</Alert>}

      <Card title="Filtres" flat>
        <PageToolbar
          searchValue={filters.search}
          onSearchChange={(value) => setFilters((prev) => ({ ...prev, search: value }))}
          searchPlaceholder="Rechercher par nom, email ou entreprise…"
          meta={`${filteredRows.length} résultat${filteredRows.length !== 1 ? "s" : ""}`}
        >
          <select
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
            aria-label="Filtrer par statut du compte"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
          </select>
        </PageToolbar>
      </Card>

      <Card title="Liste des superviseurs">
        {filteredRows.length === 0 ? (
          <EmptyState
            icon="◈"
            title="Aucun superviseur trouvé"
            description="Modifiez vos filtres ou attendez de nouvelles inscriptions."
          />
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Entreprise</th>
                    <th>Poste</th>
                    <th>Stagiaires</th>
                    <th>Projets</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((row) => (
                    <tr key={row.supervisor_id || row.user_id}>
                      <td>{row.full_name || "—"}</td>
                      <td>{row.email}</td>
                      <td>{row.company_name || "—"}</td>
                      <td>{row.position || "—"}</td>
                      <td>{row.interns_count ?? 0}</td>
                      <td>{row.projects_count ?? 0}</td>
                      <td>
                        <AccountStatusBadge isActive={row.is_active} />
                      </td>
                      <td>
                        <AdminTableActions
                          isActive={row.is_active}
                          onView={() => setSelectedSupervisor(row)}
                          onToggleStatus={() => requestStatusChange(row)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              totalItems={totalItems}
            />
          </>
        )}
      </Card>

      <UserDetailsModal
        open={Boolean(selectedSupervisor)}
        title="Détails du superviseur"
        fields={selectedSupervisor ? buildSupervisorFields(selectedSupervisor) : []}
        onClose={() => setSelectedSupervisor(null)}
      />

      <ConfirmDialog
        open={Boolean(pendingAction)}
        title={pendingAction?.title}
        message={pendingAction?.message}
        confirmLabel={pendingAction?.nextStatus ? "Réactiver" : "Désactiver"}
        variant={pendingAction?.nextStatus ? "primary" : "danger"}
        loading={actionLoading}
        onCancel={() => setPendingAction(null)}
        onConfirm={() => pendingAction && applyStatusChange(pendingAction.row, pendingAction.nextStatus)}
      />
    </PageLayout>
  );
};

export default AdminSupervisorsPage;
