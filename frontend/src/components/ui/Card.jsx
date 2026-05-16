const Card = ({ title, subtitle, actions, children, className = "", flat = false, interactive = false }) => {
  const cardClass = [
    "card",
    "ds-card",
    flat ? "ds-card--flat" : "",
    interactive ? "ds-card--interactive" : "",
    className
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={cardClass}>
      {(title || subtitle || actions) && (
        <header className="ds-card__header">
          <div>
            {title && <h3 className="ds-card__title">{title}</h3>}
            {subtitle && <p className="ds-card__subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="page-actions">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
};

export default Card;
