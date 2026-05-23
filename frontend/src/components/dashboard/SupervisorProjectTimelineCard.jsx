const formatDaysRemaining = (days) => {
  if (days == null) return null;
  if (days > 1) return `${days} jours restants`;
  if (days === 1) return "1 jour restant";
  if (days === 0) return "Dernier jour";
  return `Échéance dépassée de ${Math.abs(days)} j.`;
};

const getProjectStatus = (project) => {
  const total = project.total_students ?? 0;
  const active = project.active_students ?? 0;

  if (total === 0) {
    return { label: "Sans stagiaire", className: "ds-badge--warning" };
  }
  if (active > 0) {
    return { label: "Actif", className: "ds-badge--success" };
  }
  return { label: "Inactif", className: "ds-badge--todo" };
};

const UsersIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="9" cy="8" r="3" />
    <circle cx="17" cy="9" r="2.5" />
    <path d="M3 19c0-3.3 2.7-5 6-5M14 19c0-2.2 1.8-4 4-4" />
  </svg>
);

const SupervisorProjectTimelineCard = ({ project }) => {
  const progress = Math.min(100, Math.max(0, project.progressPercent ?? 0));
  const status = getProjectStatus(project);
  const daysLabel = formatDaysRemaining(project.daysRemaining);
  const totalStudents = project.total_students ?? 0;
  const activeStudents = project.active_students ?? 0;

  return (
    <article className="supervisor-timeline-card">
      <header className="supervisor-timeline-card__header">
        <h4 className="supervisor-timeline-card__title">{project.title}</h4>
        <span className={`ds-badge ${status.className}`}>{status.label}</span>
      </header>

      <div className="supervisor-timeline-card__meta">
        <span className="supervisor-timeline-card__meta-icon">
          <UsersIcon />
        </span>
        <div className="supervisor-timeline-card__meta-text">
          <span className="supervisor-timeline-card__meta-label">Stagiaires</span>
          <span className="supervisor-timeline-card__meta-value">
            {totalStudents} au total · {activeStudents} actif{activeStudents !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className="supervisor-timeline-card__progress">
        <div className="supervisor-timeline-card__progress-header">
          <span className="supervisor-timeline-card__progress-label">Avancement</span>
          <span className="supervisor-timeline-card__progress-value">{progress}%</span>
        </div>
        <div
          className="progress-track supervisor-timeline-card__progress-track"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Avancement du projet ${project.title} : ${progress}%`}
        >
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {daysLabel && (
        <footer className="supervisor-timeline-card__footer">
          <span className="supervisor-timeline-card__days">{daysLabel}</span>
        </footer>
      )}
    </article>
  );
};

export default SupervisorProjectTimelineCard;
