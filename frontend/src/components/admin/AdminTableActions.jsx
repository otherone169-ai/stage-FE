import Button from "../ui/Button";

const AdminTableActions = ({ onView, onToggleStatus, isActive, viewLabel = "Consulter" }) => (
  <div className="ds-table-actions">
    <Button variant="ghost" size="sm" onClick={onView}>
      {viewLabel}
    </Button>
    <Button variant={isActive ? "danger" : "primary"} size="sm" onClick={onToggleStatus}>
      {isActive ? "Désactiver" : "Réactiver"}
    </Button>
  </div>
);

export default AdminTableActions;
