import type { Routine, RoutineLog } from '../types';

export const useRoutineSchedule = () => {
  const parseLocalDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const isDueOnDate = (routine: Routine, dateStr: string): boolean => {
    if (dateStr < routine.startDate) return false;
    if (routine.endDate && dateStr > routine.endDate) return false;

    const date = parseLocalDate(dateStr);

    switch (routine.recurrenceType) {
      case 'daily':
        return true;
      case 'weekly':
        return routine.recurrenceDays.includes(date.getDay());
      case 'monthly':
        return routine.recurrenceDays.includes(date.getDate());
      case 'custom': {
        if (!routine.customIntervalDays) return true;
        const start = parseLocalDate(routine.startDate);
        const diffTime = Math.abs(date.getTime() - start.getTime());
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        return diffDays % routine.customIntervalDays === 0;
      }
      default:
        return false;
    }
  };

  const isDueToday = (routine: Routine): boolean => {
    if (routine.archived || routine.deleted) return false;
    const todayStr = formatDate(new Date());
    return isDueOnDate(routine, todayStr);
  };

  const getLogForDate = (routine: Routine, logs: RoutineLog[], dateStr: string): RoutineLog | undefined => {
    return logs.find(log => log.routineId === routine.id && log.scheduledDate === dateStr);
  };

  const isCompletedToday = (routine: Routine, logs: RoutineLog[]): boolean => {
    const todayStr = formatDate(new Date());
    return !!getLogForDate(routine, logs, todayStr);
  };

  const getPendingRoutinesCount = (routines: Routine[], logs: RoutineLog[]): number => {
    const todayStr = formatDate(new Date());
    return routines.filter(routine => {
      if (routine.archived || routine.deleted) return false;
      const isDue = isDueOnDate(routine, todayStr);
      const isCompleted = logs.some(log => log.routineId === routine.id && log.scheduledDate === todayStr);
      return isDue && !isCompleted;
    }).length;
  };

  const getRecurrenceLabel = (routine: Routine): string => {
    switch (routine.recurrenceType) {
      case 'daily':
        return 'Daily';
      case 'weekly': {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        if (routine.recurrenceDays.length === 5 && !routine.recurrenceDays.includes(0) && !routine.recurrenceDays.includes(6)) {
          return 'Every weekday';
        }
        if (routine.recurrenceDays.length === 7) {
          return 'Every day';
        }
        const sortedDays = [...routine.recurrenceDays].sort((a, b) => a - b);
        return sortedDays.map(d => days[d]).join(', ');
      }
      case 'monthly': {
        const sortedDays = [...routine.recurrenceDays].sort((a, b) => a - b);
        return `Monthly on the ${sortedDays.map(d => {
          if (d === 1) return '1st';
          if (d === 2) return '2nd';
          if (d === 3) return '3rd';
          return `${d}th`;
        }).join(', ')}`;
      }
      case 'custom':
        return `Every ${routine.customIntervalDays} days`;
      default:
        return '';
    }
  };

  return {
    isDueOnDate,
    isDueToday,
    isCompletedToday,
    getLogForDate,
    getPendingRoutinesCount,
    getRecurrenceLabel,
    formatDate,
    parseLocalDate,
  };
};
