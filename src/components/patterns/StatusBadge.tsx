interface StatusBadgeProps {
  type: 'active' | 'completed' | 'overdue' | 'priority-low' | 'priority-med' | 'priority-high' | 'priority-critical';
  label?: string;
}

export const StatusBadge = ({
  type,
  label,
}: StatusBadgeProps) => {
  const baseStyle = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest select-none';

  const styles = {
    active: 'bg-info/10 text-info border border-info/20',
    completed: 'bg-success/10 text-success border border-success/20',
    overdue: 'bg-error/10 text-error border border-error/20',
    'priority-low': 'bg-text-secondary/15 text-text-secondary border border-text-secondary/20',
    'priority-med': 'bg-warning/10 text-warning border border-warning/20',
    'priority-high': 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20',
    'priority-critical': 'bg-error/15 text-error border border-error/30 animate-pulse',
  };

  const defaultLabels = {
    active: 'Active',
    completed: 'Completed',
    overdue: 'Overdue',
    'priority-low': 'Low',
    'priority-med': 'Medium',
    'priority-high': 'High',
    'priority-critical': 'Critical 🚨',
  };

  return (
    <span className={`${baseStyle} ${styles[type]}`}>
      {label || defaultLabels[type]}
    </span>
  );
};
