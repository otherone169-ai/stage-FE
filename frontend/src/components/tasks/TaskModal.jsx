import { useEffect, useRef } from "react";
import StatusBadge from "../StatusBadge";

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("fr-FR");
};

const TaskModal = ({ open, task, onClose, children, footer }) => {
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    closeRef.current?.focus();
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || !task) return null;

  return (
    <div className="tasks-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="tasks-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="tasks-modal__header">
          <div>
            <h2 id="task-modal-title" className="tasks-modal__title">
              {task.title}
            </h2>
            <div className="tasks-modal__meta">
              <span>{task.project_title || "Projet"}</span>
              <span>·</span>
              <span>Échéance : {formatDate(task.deadline)}</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <StatusBadge status={task.status} />
            <button
              ref={closeRef}
              type="button"
              className="ds-dialog__icon-close"
              onClick={onClose}
              aria-label="Fermer"
            >
              ×
            </button>
          </div>
        </header>

        {task.description && (
          <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "var(--text-sm)" }}>
            {task.description}
          </p>
        )}

        {children}

        {footer && <footer className="tasks-modal__footer">{footer}</footer>}
      </div>
    </div>
  );
};

export default TaskModal;
