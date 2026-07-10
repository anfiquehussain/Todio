export type TrackerFieldType = 'number' | 'text' | 'date' | 'time' | 'boolean' | 'select';

export type TrackerCategory = 'finance' | 'health' | 'productivity' | 'work' | 'lifestyle' | 'custom';

export type TrackerFieldValue = string | number | boolean | null;

export interface TrackerField {
  id: string;
  name: string;                           // e.g., "Amount", "Weight", "Duration"
  type: TrackerFieldType;
  unit?: string;                          // e.g., "₹", "kg", "minutes"
  options?: string[];                     // For 'select' type only
  required: boolean;
  order: number;                          // Display order
}

export interface TrackerReminder {
  id: string;
  time: string;                           // HH:MM format
  days: number[];                         // [0-6] Sun-Sat
  enabled: boolean;
}

export interface Tracker {
  id: string;
  userId: string;
  name: string;                           // e.g., "Expense Tracker", "Gym Progress"
  description: string;                    // Optional description
  icon: string;                           // Lucide icon name
  color: string;                          // Hex color for visual identity
  category: TrackerCategory;
  fields: TrackerField[];                 // User-defined custom fields
  reminders: TrackerReminder[];           // Scheduled reminders
  archived: boolean;
  deleted?: boolean;
  deletedAt?: string;
  createdAt: string;                      // ISO string
}

export interface TrackerEntry {
  id: string;
  trackerId: string;
  userId: string;
  values: Record<string, TrackerFieldValue>; // field.id → value
  note?: string;                             // Optional note
  date: string;                              // YYYY-MM-DD
  createdAt: string;                         // ISO timestamp
}
