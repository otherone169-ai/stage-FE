const VARIANT_CLASS = {
  primary: "ds-btn ds-btn--primary primary-btn",
  secondary: "ds-btn ds-btn--secondary secondary-btn",
  ghost: "ds-btn ds-btn--ghost ghost-btn",
  danger: "ds-btn ds-btn--danger danger-btn"
};

const Button = ({
  children,
  variant = "primary",
  size,
  className = "",
  type = "button",
  ...props
}) => {
  const sizeClass = size === "sm" ? "ds-btn--sm small" : "";
  const classes = [VARIANT_CLASS[variant] || VARIANT_CLASS.primary, sizeClass, className]
    .filter(Boolean)
    .join(" ");

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  );
};

export default Button;
