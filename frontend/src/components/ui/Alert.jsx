const VARIANT_CLASS = {
  error: "alert alert-error ds-alert ds-alert--error",
  success: "alert alert-success ds-alert ds-alert--success",
  warning: "alert alert-warning ds-alert ds-alert--warning",
  info: "alert alert-info ds-alert ds-alert--info"
};

const Alert = ({ variant = "info", children, className = "" }) => (
  <div className={`${VARIANT_CLASS[variant] || VARIANT_CLASS.info} ${className}`.trim()} role="alert">
    {children}
  </div>
);

export default Alert;
