interface SubtaskProgressProps {
  taskId: string;
  subtasks: Array<{ taskId: string; completed: boolean }>;
}

export const SubtaskProgress = ({ taskId, subtasks }: SubtaskProgressProps) => {
  const taskSubtasks = subtasks.filter(s => s.taskId === taskId);
  const totalSubtasks = taskSubtasks.length;
  if (totalSubtasks === 0) return null;

  const completedSubtasks = taskSubtasks.filter(s => s.completed).length;
  const percent = Math.round((completedSubtasks / totalSubtasks) * 100);

  // Precision coordinates to prevent clipping in 16x16 viewBox
  const radius = 3.25;
  const circumference = 2 * Math.PI * radius; // ~20.42
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div 
      className="shrink-0 flex items-center justify-center w-5 h-5 text-text-secondary select-none"
      title={`${completedSubtasks} of ${totalSubtasks} subtasks completed (${percent}%)`}
    >
      <svg className="w-3.5 h-3.5 transform -rotate-90" viewBox="0 0 16 16">
        {/* Background outer ring (highly visible, elegant stroke) */}
        <circle
          cx="8"
          cy="8"
          r="6.5"
          className="stroke-text-secondary/30 fill-none"
          strokeWidth="1.2"
        />
        {/* Clock-like solid pie segment fill */}
        <circle
          cx="8"
          cy="8"
          r={radius}
          className="stroke-brand-primary fill-none transition-all duration-300"
          strokeWidth="6.5"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
    </div>
  );
};
