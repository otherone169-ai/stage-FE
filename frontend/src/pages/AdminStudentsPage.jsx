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

const buildStudentFields = (student) => [
  { label: "Nom complet", value: student.full_name || "—" },
  { label: "Email", value: student.email },
  { label: "Téléphone", value: student.phone || "—" },
  { label: "Éducation", value: student.education || "—", fullWidth: true },
  { label: "Compétences", value: student.skills || "—", fullWidth: true },
  {
    label: "Statut du compte",
    type: "badge",
    badge: <AccountStatusBadge isActive={student.is_active} />
  },
  {
    label: "Profil",
    type: "badge",
    badge: (
      <span className={`ds-badge ${student.profile_completed ? "ds-badge--success" : "ds-badge--warning"}`}>
        {student.profile_completed ? "Complet" : "Incomplet"}
      </span>
    )
  },
  {
    label: "Affectations",
    type: "stats",
    fullWidth: true,
    stats: [
      { value: student.assignments_count ?? 0, label: "Total" },
      { value: student.active_assignments_count ?? 0, label: "Actives / en pause" }
    ]
  }
];

const AdminStudentsPage = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [filters, setFilters] = useState({ search: "", status: "all" });

  const filteredRows = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    return rows.filter((row) => {
      const email = (row.email || "").toLowerCase();
      const name = (row.full_name || "").toLowerCase();
      const status = row.is_active ? "active" : "inactive";
      const matchesSearch = !query || email.includes(query) || name.includes(query);
      const matchesStatus = filters.status === "all" || status === filters.status;
      return matchesSearch && matchesStatus;
    });
  }, [rows, filters]);

  const { page, setPage, totalPages, paginatedItems, rangeStart, rangeEnd, totalItems } =
    usePagination(filteredRows, PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [filters.search, filters.status, setPage]);

  const loadStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await apiClient.get("/admin/students");
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Impossible de charger les stagiaires");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const applyStatusChange = async (row, nextStatus) => {
    try {
      setActionLoading(true);
      setError("");
      await apiClient.patch(`/admin/users/${row.user_id}/status`, { isActive: nextStatus });
      setRows((current) =>
        current.map((item) => (item.user_id === row.user_id ? { ...item, is_active: nextStatus } : item))
      );
      showToast(nextStatus ? "Compte stagiaire réactivé." : "Compte stagiaire désactivé.", "success");
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
        ? `Le stagiaire ${row.full_name || row.email} ne pourra plus se connecter.`
        : `Le stagiaire ${row.full_name || row.email} pourra à nouveau accéder à la plateforme.`
    });
  };

  if (loading) {
    return <LoadingSpinner label="Chargement des stagiaires…" />;
  }

  return (
    <PageLayout title="Stagiaires" subtitle="Gérez les comptes stagiaires, consultez les profils et contrôlez l'accès.">
      {error && <Alert variant="error">{error}</Alert>}

      <Card title="Filtres" flat>
        <PageToolbar
          searchValue={filters.search}
          onSearchChange={(value) => setFilters((prev) => ({ ...prev, search: value }))}
          searchPlaceholder="Rechercher par nom ou email…"
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

      <Card title="Liste des stagiaires">
        {filteredRows.length === 0 ? (
          <EmptyState
            icon="◎"
            title="Aucun stagiaire trouvé"
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
                    <th>Téléphone</th>
                    <th>Affectations</th>
                    <th>Actives</th>
                    <th>Profil</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((row) => (
                    <tr key={row.user_id}>
                      <td>{row.full_name || "—"}</td>
                      <td>{row.email}</td>
                      <td>{row.phone || "—"}</td>
                      <td>{row.assignments_count ?? 0}</td>
                      <td>{row.active_assignments_count ?? 0}</td>
                      <td>
                        <span className={`ds-badge ${row.profile_completed ? "ds-badge--success" : "ds-badge--warning"}`}>
                          {row.profile_completed ? "Complet" : "Incomplet"}
                        </span>
                      </td>
                      <td>
                        <AccountStatusBadge isActive={row.is_active} />
                      </td>
                      <td>
                        <AdminTableActions
                          isActive={row.is_active}
                          onView={() => setSelectedStudent(row)}
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
        open={Boolean(selectedStudent)}
        title="Détails du stagiaire"
        fields={selectedStudent ? buildStudentFields(selectedStudent) : []}
        onClose={() => setSelectedStudent(null)}
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

export default AdminStudentsPage;
