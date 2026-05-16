const EmptyState = ({ icon = "📭", title, description, action, className = "" }) => (
  <div className={`empty-state ds-empty ${className}`.trim()}>
    <div className="empty-state-icon ds-empty__icon" aria-hidden="true">
      {icon}
    </div>
    <h3 className="empty-state-title ds-empty__title">{title}</h3>
    <p className="empty-state-description ds-empty__desc">{description}</p>
    {action && <div className="empty-state-action">{action}</div>}
  </div>
);

export default EmptyState;
