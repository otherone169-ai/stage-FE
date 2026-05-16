const PageLayout = ({
  children,
  title,
  subtitle,
  actions,
  className = "",
  containerClassName = ""
}) => (
  <div className={`page-layout ${className}`.trim()}>
    <header className="page-header ds-page-header">
      <div className="page-header-content">
        <h1 className="page-title ds-page-title">{title}</h1>
        {subtitle && <p className="page-subtitle ds-page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
    <div className={`page-content ${containerClassName}`.trim()}>{children}</div>
  </div>
);

export default PageLayout;
