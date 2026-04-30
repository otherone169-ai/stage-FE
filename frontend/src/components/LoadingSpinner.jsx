const LoadingSpinner = ({ label = "Chargement..." }) => (
  <div className="loading-box" role="status" aria-live="polite">
    <span className="spinner" />
    <span>{label}</span>
  </div>
);

export default LoadingSpinner;
