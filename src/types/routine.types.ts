export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'custom';

export interface Routine {
  id: string;
  userId: string;
  title: string;
  description: string;
  icon: string;                      // Lucide icon name for visual representation
  color: string;                     // Hex or preset class for custom routine styling
  recurrenceType: RecurrenceType;
  recurrenceDays: number[];          // For weekly: [0-6] (Sun-Sat). For monthly: [1-31]
  customIntervalDays: number | null; // For 'custom' type: every N days
  startDate: string;                 // YYYY-MM-DD
  endDate: string | null;            // YYYY-MM-DD or null
  currentStreak: number;             // Cached streak count
  bestStreak: number;                // Cached best streak
  archived: boolean;                 // Soft-archived flag
  createdAt: string;                 // ISO string
  deleted?: boolean;                 // Soft-deleted flag
  deletedAt?: string;                // ISO string when deleted
}

export interface RoutineLog {
  id: string;
  routineId: string;
  userId: string;
  completedAt: string;               // ISO timestamp of the action
  scheduledDate: string;             // YYYY-MM-DD target date of completion
  note?: string;                     // Optional completion notes
}
