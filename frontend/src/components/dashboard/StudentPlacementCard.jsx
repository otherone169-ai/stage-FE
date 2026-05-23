import StatusBadge from "../StatusBadge";

const SupervisorIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" />
  </svg>
);

const formatDaysRemaining = (days) => {
  if (days == null) return null;
  if (days > 1) return `${days} jours restants`;
  if (days === 1) return "1 jour restant";
  if (days === 0) return "Dernier jour";
  return `Terminé depuis ${Math.abs(days)} j.`;
};

const StudentPlacementCard = ({ placement }) => {
  const progress = Math.min(100, Math.max(0, placement.progressPercent ?? 0));
  const daysLabel = formatDaysRemaining(placement.daysRemaining);

  return (
    <article className="student-placement-card">
      <header className="student-placement-card__header">
        <h4 className="student-placement-card__title">{placement.project_title}</h4>
        <StatusBadge status={placement.status} size="small" />
      </header>

      <div className="student-placement-card__supervisor">
        <span className="student-placement-card__supervisor-icon">
          <SupervisorIcon />
        </span>
        <div className="student-placement-card__supervisor-text">
          <span className="student-placement-card__supervisor-label">Superviseur</span>
          <span className="student-placement-card__supervisor-name">
            {placement.supervisor_name || "—"}
          </span>
          {placement.company_name && (
            <span className="student-placement-card__supervisor-company">{placement.company_name}</span>
          )}
        </div>
      </div>

      <div className="student-placement-card__progress">
        <div className="student-placement-card__progress-header">
          <span className="student-placement-card__progress-label">Avancement du stage</span>
          <span className="student-placement-card__progress-value">{progress}%</span>
        </div>
        <div
          className="progress-track student-placement-card__progress-track"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Avancement : ${progress}%`}
        >
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {daysLabel && (
        <footer className="student-placement-card__footer">
          <span className="student-placement-card__days">{daysLabel}</span>
        </footer>
      )}
    </article>
  );
};

export default StudentPlacementCard;
