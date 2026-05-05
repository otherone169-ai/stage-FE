const InfoCard = ({ icon, title, value, subtitle, highlight = false, onClick }) => {
  return (
    <article 
      className={`info-card ${highlight ? "highlight" : ""}`}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <div className="info-card-icon">{icon}</div>
      <div className="info-card-content">
        <h3>{title}</h3>
        <p className="info-card-value">{value}</p>
        {subtitle && <p className="info-card-subtitle">{subtitle}</p>}
      </div>
    </article>
  );
};

export default InfoCard;
