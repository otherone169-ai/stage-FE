import React from 'react';

const PageLayout = ({ 
  children, 
  title, 
  subtitle, 
  actions, 
  className = "",
  containerClassName = ""
}) => {
  return (
    <div className={`page-layout ${className}`}>
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
          {actions && <div className="page-actions">{actions}</div>}
        </div>
      </div>
      <div className={`page-content ${containerClassName}`}>
        {children}
      </div>
    </div>
  );
};

export default PageLayout;
