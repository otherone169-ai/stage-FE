const StatCard = ({ label, value, hint, icon }) => (
  <article className="metric-card ds-stat-card">
    {icon && (
      <div className="ds-stat-card__icon" aria-hidden="true">
        {icon}
      </div>
    )}
    <p className="ds-stat-card__label">{label}</p>
    <p className="ds-stat-card__value">{value}</p>
    {hint && <p className="ds-stat-card__hint">{hint}</p>}
  </article>
);

export default StatCard;
