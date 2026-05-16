const LoadingSpinner = ({ label = "Chargement…" }) => (
  <div className="loading-box ds-loading" role="status" aria-live="polite" aria-busy="true">
    <span className="spinner ds-spinner" />
    <span>{label}</span>
  </div>
);

export default LoadingSpinner;
