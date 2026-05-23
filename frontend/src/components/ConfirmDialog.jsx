import { useEffect, useRef } from "react";
import Button from "./ui/Button";

const ConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel
}) => {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const previousFocus = document.activeElement;
    dialogRef.current?.querySelector("button")?.focus();

    const onKeyDown = (event) => {
      if (event.key === "Escape") onCancel();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (previousFocus instanceof HTMLElement) {
        previousFocus.focus();
      }
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="ds-dialog-overlay" role="presentation" onClick={onCancel}>
      <div
        ref={dialogRef}
        className="ds-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="ds-dialog__header">
          <h3 id="confirm-dialog-title">{title}</h3>
        </header>
        <p id="confirm-dialog-desc" className="ds-dialog__body">
          {message}
        </p>
        <footer className="ds-dialog__footer">
          <Button variant="secondary" size="sm" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={variant} size="sm" onClick={onConfirm} disabled={loading}>
            {loading ? "Traitement…" : confirmLabel}
          </Button>
        </footer>
      </div>
    </div>
  );
};

export default ConfirmDialog;
