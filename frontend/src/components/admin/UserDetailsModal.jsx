import Button from "../ui/Button";

const UserDetailsModal = ({ open, title, fields = [], onClose }) => {
  if (!open) return null;

  return (
    <div className="ds-dialog-overlay" role="presentation" onClick={onClose}>
      <div
        className="ds-dialog ds-dialog--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-details-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="ds-dialog__header ds-dialog__header--row">
          <h3 id="user-details-title">{title}</h3>
          <button type="button" className="ds-dialog__icon-close" onClick={onClose} aria-label="Fermer">
            ×
          </button>
        </header>

        <div className="ds-dialog__body ds-details-grid">
          {fields.map((field) => (
            <div key={field.label} className={`ds-detail ${field.fullWidth ? "ds-detail--full" : ""}`}>
              <dt>{field.label}</dt>
              <dd>
                {field.type === "badge" && field.badge}
                {field.type === "stats" && (
                  <div className="ds-detail-stats">
                    {(field.stats || []).map((stat) => (
                      <div key={stat.label} className="ds-detail-stat">
                        <strong>{stat.value}</strong>
                        <span>{stat.label}</span>
                      </div>
                    ))}
                  </div>
                )}
                {(!field.type || field.type === "text") && (field.value ?? "—")}
              </dd>
            </div>
          ))}
        </div>

        <footer className="ds-dialog__footer">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Fermer
          </Button>
        </footer>
      </div>
    </div>
  );
};

export default UserDetailsModal;
