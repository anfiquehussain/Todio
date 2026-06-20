import type { Collection, Subcollection } from './collections.types';

export type { Collection, Subcollection };

export interface Task {
  id: string;
  subcollectionId: string | null;
  collectionId: string | null;
  title: string;
  overview: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  completed: boolean;
  userId: string;
  createdAt: string;
  position?: number;
  imported?: boolean;
  manuallyUnchecked?: boolean;
  deleted?: boolean;
  deletedAt?: string;
}

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  userId: string;
  createdAt: string;
  priority?: 'low' | 'medium' | 'high';
  position?: number;
  deleted?: boolean;
  deletedAt?: string;
}
