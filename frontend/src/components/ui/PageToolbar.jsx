const PageToolbar = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Rechercher…",
  meta,
  children
}) => (
  <div className="ds-toolbar">
    {onSearchChange && (
      <div className="ds-toolbar__search">
        <input
          type="search"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
        />
      </div>
    )}
    {children}
    {meta && <span className="ds-toolbar__meta">{meta}</span>}
  </div>
);

export default PageToolbar;
