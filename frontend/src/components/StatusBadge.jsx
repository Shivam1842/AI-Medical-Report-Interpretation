const statusMap = {
  normal: 'status-badge status-badge--normal',
  high: 'status-badge status-badge--high',
  low: 'status-badge status-badge--low',
  warning: 'status-badge status-badge--warning',
  completed: 'status-badge status-badge--completed',
  pending: 'status-badge status-badge--pending',
  active: 'status-badge status-badge--active',
};

export default function StatusBadge({ label, variant = 'normal' }) {
  return <span className={statusMap[variant] || statusMap.normal}>{label}</span>;
}
