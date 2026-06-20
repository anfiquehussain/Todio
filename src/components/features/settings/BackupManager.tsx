import React, { useRef } from 'react';
import { Download, Upload } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../../hooks/useRedux';
import { createTaskAsync } from '../../../store/slices/todoSlice';
import { useToast } from '../../../hooks/useToast';

export const BackupManager = () => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { tasks } = useAppSelector((state) => state.todo);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (!Array.isArray(json)) {
          toast('Invalid backup format: root element must be a JSON array.', 'error');
          return;
        }

        let importCount = 0;
        for (const rawTask of json) {
          if (rawTask && typeof rawTask === 'object' && 'title' in rawTask) {
            const rawPriority = rawTask.priority;
            let finalPriority: 'low' | 'medium' | 'high' = 'low';
            if (typeof rawPriority === 'string') {
              if (rawPriority === 'medium' || rawPriority === 'high') {
                finalPriority = rawPriority;
              }
            } else if (typeof rawPriority === 'number') {
              if (rawPriority >= 4) {
                finalPriority = 'high';
              } else if (rawPriority >= 2) {
                finalPriority = 'medium';
              }
            }

            const task = {
              id: rawTask.id || `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              title: String(rawTask.title),
              overview: String(rawTask.overview || ''),
              priority: finalPriority,
              dueDate: String(rawTask.dueDate || ''),
              completed: Boolean(rawTask.completed || false),
              collectionId: rawTask.collectionId || null,
              subcollectionId: rawTask.subcollectionId || null,
              userId: rawTask.userId || 'mock-user-id',
              createdAt: rawTask.createdAt || new Date().toISOString(),
              imported: true,
            };

            await dispatch(createTaskAsync(task)).unwrap();
            importCount++;
          }
        }

        if (importCount > 0) {
          toast(`Successfully imported ${importCount} tasks into database! 🚀`, 'success');
        } else {
          toast('No valid tasks found in JSON file to import.', 'info');
        }
      } catch {
        toast('Failed to parse backup JSON file.', 'error');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleTriggerImport = () => {
    fileInputRef.current?.click();
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(tasks, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `todo-cockpit-backup-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast('Task database backup exported successfully! 📦', 'success');
  };

  return (
    <div className="bg-card border border-gray-border rounded-3xl p-6 flex flex-col gap-4 select-none relative overflow-hidden">
      <div className="flex items-center gap-3 border-b border-gray-border/50 pb-3">
        <div className="w-10 h-10 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary flex items-center justify-center shrink-0">
          <Download className="w-5.5 h-5.5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-text-primary tracking-wide">Local Backup Importer & Exporter</h3>
          <p className="text-xs text-text-secondary">Save localized backups of all current tasks and categories.</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleExport}
          className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl border border-gray-border bg-bg-secondary text-text-primary text-xs font-bold hover:bg-card/85 transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export DB Backup</span>
        </button>
        <button
          onClick={handleTriggerImport}
          className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl border border-gray-border bg-bg-secondary text-text-primary text-xs font-bold hover:bg-card/85 transition-colors cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          <span>Import Database</span>
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImportFile}
          accept=".json"
          className="hidden"
        />
      </div>
    </div>
  );
};
