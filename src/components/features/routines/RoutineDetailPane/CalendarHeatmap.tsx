import type { Routine, RoutineLog } from '../../../../types';
import { useRoutineSchedule } from '../../../../hooks/useRoutineSchedule';

interface CalendarHeatmapProps {
  routine: Routine;
  logs: RoutineLog[];
}

interface HeatmapCell {
  dateStr: string;
  isDue: boolean;
  isCompleted: boolean;
  isMissed: boolean;
  isToday: boolean;
}

export const CalendarHeatmap = ({ routine, logs }: CalendarHeatmapProps) => {
  const { isDueOnDate, formatDate } = useRoutineSchedule();

  const today = new Date();
  const todayStr = formatDate(today);

  // Filter logs for this routine
  const routineLogs = logs.filter(log => log.routineId === routine.id);
  const completedDates = new Set(routineLogs.map(log => log.scheduledDate));

  // Determine starting point (90 days ago, aligned to the previous Sunday)
  const startDate = new Date();
  startDate.setDate(today.getDate() - 90);
  
  const startSunday = new Date(startDate);
  startSunday.setDate(startDate.getDate() - startDate.getDay());

  const cells: HeatmapCell[] = [];
  const current = new Date(startSunday);

  // Generate exactly 91 cells (13 weeks * 7 days)
  for (let i = 0; i < 91; i++) {
    const dateStr = formatDate(current);
    const isDue = isDueOnDate(routine, dateStr);
    const isCompleted = completedDates.has(dateStr);
    const isMissed = isDue && !isCompleted && dateStr < todayStr;

    cells.push({
      dateStr,
      isDue,
      isCompleted,
      isMissed,
      isToday: dateStr === todayStr
    });

    current.setDate(current.getDate() + 1);
  }

  // Format date for tooltip display (e.g. "Jun 11, 2026")
  const formatTooltipDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getCellClasses = (cell: HeatmapCell) => {
    const classes = 'w-2.5 h-2.5 rounded-xs transition-all duration-150 ';

    if (cell.isCompleted) {
      // Handled via inline style for dynamic theme colors
      return classes + 'scale-105 shadow-xs';
    }

    if (cell.isMissed) {
      return classes + 'bg-error/10 border border-error/25';
    }

    if (cell.isDue) {
      return classes + 'bg-[#282828] border border-gray-border/50';
    }

    return classes + 'bg-[#181818]/45 border border-transparent';
  };

  const getCellTooltip = (cell: HeatmapCell) => {
    const formatted = formatTooltipDate(cell.dateStr);
    if (cell.isCompleted) return `${formatted} • Completed ✓`;
    if (cell.isMissed) return `${formatted} • Missed ✗`;
    if (cell.isDue) return `${formatted} • Scheduled (Pending)`;
    return `${formatted} • Not scheduled`;
  };

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="flex flex-col gap-2 font-sans bg-card/25 border border-gray-border/20 rounded-3xl p-4.5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold uppercase tracking-widest text-text-secondary/60 select-none">
          Habit Activity (Last 90 Days)
        </span>
        <div className="flex items-center gap-2.5 text-[10px] font-bold text-text-secondary/50">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-[#181818] border border-gray-border/30 rounded-xs" />
            <span>Off</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-[#282828] border border-gray-border/50 rounded-xs" />
            <span>Scheduled</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-error/15 border border-error/30 rounded-xs" />
            <span>Missed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-xs" style={{ backgroundColor: routine.color }} />
            <span>Done</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2.5 items-center justify-center pt-2">
        {/* Day label column */}
        <div className="flex flex-col justify-between h-[82px] text-[8px] font-bold text-text-secondary/40 select-none pr-1">
          {dayLabels.map((label, idx) => (
            <span key={idx} className="h-2.5 flex items-center leading-none">
              {idx % 2 === 0 ? label : ''}
            </span>
          ))}
        </div>

        {/* Heatmap Grid */}
        <div className="grid grid-flow-col grid-rows-7 gap-1 h-[82px] overflow-x-auto no-scrollbar">
          {cells.map((cell, idx) => (
            <div
              key={idx}
              className={getCellClasses(cell)}
              style={cell.isCompleted ? { backgroundColor: routine.color, boxShadow: `0 0 4px ${routine.color}33` } : undefined}
              title={getCellTooltip(cell)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
