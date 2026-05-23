const AccountStatusBadge = ({ isActive }) => (
  <span className={`ds-badge ${isActive ? "ds-badge--success" : "ds-badge--warning"}`}>
    {isActive ? "Actif" : "Inactif"}
  </span>
);

export default AccountStatusBadge;
