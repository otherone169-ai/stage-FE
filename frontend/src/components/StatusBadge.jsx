const StatusBadge = ({ status, size = "medium" }) => {
  const statusMap = {
    pending: { label: "En attente", class: "pending", icon: "⏳" },
    accepted: { label: "Acceptée", class: "accepted", icon: "✓" },
    rejected: { label: "Rejetée", class: "rejected", icon: "✗" },
    approved: { label: "Approuvée", class: "approved", icon: "✓" },
    draft: { label: "Brouillon", class: "draft", icon: "📝" },
    submitted: { label: "Soumise", class: "submitted", icon: "📤" },
    active: { label: "Actif", class: "active", icon: "▶" },
    completed: { label: "Complété", class: "completed", icon: "✓" },
    in_progress: { label: "En cours", class: "in_progress", icon: "⚙" },
    todo: { label: "À faire", class: "todo", icon: "□" }
  };

  const statusInfo = statusMap[status] || { label: status, class: "default", icon: "•" };
  
  return (
    <span className={`table-status-badge ${statusInfo.class} ${size}`}>
      <span>{statusInfo.icon}</span> {statusInfo.label}
    </span>
  );
};

export default StatusBadge;
