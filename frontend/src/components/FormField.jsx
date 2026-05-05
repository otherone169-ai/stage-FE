const FormField = ({ 
  label, 
  id, 
  type = "text", 
  value, 
  onChange, 
  placeholder, 
  error, 
  hint,
  required = false,
  disabled = false,
  icon = null,
  showPasswordStrength = false,
  passwordStrength = null,
  children,
  className = "",
  ...props 
}) => {
  const isTextarea = type === "textarea";
  const isSelect = type === "select";
  const isPassword = type === "password";
  const hasError = !!error;
  const hasSuccess = !hasError && value && required;

  const getStrengthBars = () => {
    if (!showPasswordStrength || !passwordStrength) return null;
    
    const strength = passwordStrength.strength || 0;
    const strengthLevel = passwordStrength.level || 'weak';
    
    return (
      <div className="password-strength">
        {[1, 2, 3, 4].map((bar) => (
          <div 
            key={bar}
            className={`password-strength-bar ${
              bar <= strength ? 'active' : ''
            } ${
              bar <= strength ? strengthLevel : ''
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className={`form-group ${hasError ? 'error' : ''} ${hasSuccess ? 'success' : ''} ${className}`}>
      {label && (
        <label htmlFor={id}>
          {label}
          {required && <span style={{ color: "var(--danger)", marginLeft: "4px" }}>*</span>}
        </label>
      )}

      <div className={`input-with-icon ${icon ? 'has-icon' : ''}`}>
        {isTextarea ? (
          <textarea
            id={id}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className={`form-input ${hasError ? 'error' : ''}`}
            {...props}
          />
        ) : isSelect ? (
          <select
            id={id}
            value={value}
            onChange={onChange}
            disabled={disabled}
            required={required}
            className={`form-input ${hasError ? 'error' : ''}`}
            {...props}
          >
            {children}
          </select>
        ) : (
          <input
            id={id}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className={`form-input ${hasError ? 'error' : ''}`}
            {...props}
          />
        )}

        {icon && <span className="input-icon" aria-hidden>{icon}</span>}
      </div>

      {isPassword && showPasswordStrength && getStrengthBars()}
      {hint && <p className="form-hint">{hint}</p>}
      {error && <p className="form-error" style={{ margin: "6px 0 0" }}>{error}</p>}
    </div>
  );
};

export default FormField;
