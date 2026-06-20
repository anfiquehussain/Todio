import React, { useState, useMemo } from 'react';
import { Upload, Info, FileText } from 'lucide-react';
import { useAppDispatch } from '../../../../hooks/useRedux';
import { createTasksBulkAsync } from '../../../../store/slices/todoSlice';
import { Modal } from '../../../patterns/Modal';
import { Button } from '../../../ui/Button';
import { useToast } from '../../../../hooks/useToast';
import type { Task, Subtask, UserProfile } from '../../../../types';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCollectionId: string | null;
  activeSubcollectionId: string | null;
  user: UserProfile | null;
}

type TabType = 'simple' | 'attributes' | 'checkboxes';

const examples: Record<TabType, { label: string; text: string; desc: string }> = {
  simple: {
    label: 'Super Simple',
    desc: 'Just type your tasks and indent subtasks using spaces or tabs. They will default to unchecked/active.',
    text: `Buy groceries\n  Milk\n  Eggs\n  Bread\nComplete project proposal\n  Draft outline\n  Write summary\nPlan weekend trip`
  },
  attributes: {
    label: 'With Priorities & Dates',
    desc: 'Optionally add (Priority: High/Medium/Low) or (Due: YYYY-MM-DD) to assign attributes to tasks and subtasks.',
    text: `Buy groceries (Due: 2026-06-12)\n  Milk (Priority: High)\n  Eggs\nComplete project proposal (Priority: High)\n  Draft outline\n  Write summary`
  },
  checkboxes: {
    label: 'With Status Checkboxes',
    desc: 'Optionally prefix with [ ] (active) or [x] (completed) to preserve completed states.',
    text: `[ ] Buy groceries\n  [ ] Milk\n  [x] Eggs\n[x] Complete project proposal\n  [x] Research competitors`
  }
};

export const BulkImportModal = ({
  isOpen,
  onClose,
  activeCollectionId,
  activeSubcollectionId,
  user,
}: BulkImportModalProps) => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const [bulkText, setBulkText] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('simple');
  const [isImporting, setIsImporting] = useState(false);
  const [copiedExample, setCopiedExample] = useState(false);

  const handleLoadExample = () => {
    setBulkText(examples[activeTab].text);
    toast(`Loaded "${examples[activeTab].label}" example into input! 📝`, 'info');
  };

  const handleCopyExample = () => {
    navigator.clipboard.writeText(examples[activeTab].text);
    setCopiedExample(true);
    toast('Example text copied to clipboard! 📋', 'success');
    setTimeout(() => setCopiedExample(false), 2000);
  };

  const parseBulkImportText = (
    text: string,
    userId: string,
    activeColId: string | null,
    activeSubId: string | null,
    timestamp: number
  ): { tasks: Task[]; subtasks: Subtask[] } => {
    const lines = text.split('\n');
    const tasks: Task[] = [];
    const subtasks: Subtask[] = [];
    let currentTask: Task | null = null;
    const defaultDueDate = new Date(timestamp).toISOString().split('T')[0];

    lines.forEach((line, lineIndex) => {
      if (!line.trim()) return;

      // Check for indentation (spaces or tabs) to denote subtasks
      const isIndented = /^\s+/.test(line);

      // Check status: [x] or [X] is completed, defaults to false if not found
      const completed = /^\s*\[\s*[xX]\s*\]/.test(line);

      // Remove leading spaces, bullet characters (- * +), brackets ([ ], [x]), and numbers (1. 2))
      const cleaned = line.replace(/^\s*(?:\[\s*[xX]?\s*\]|[-*+\d\s.)])+\s*/, '').trim();

      if (!cleaned) return;

      // Extract Priority
      let taskPriority: 'low' | 'medium' | 'high' = 'low';
      let subtaskPriority: 'low' | 'medium' | 'high' = 'low';
      if (/(?:priority|prio):\s*high/i.test(cleaned)) {
        taskPriority = 'high';
        subtaskPriority = 'high';
      } else if (/(?:priority|prio):\s*(?:medium|med)/i.test(cleaned)) {
        taskPriority = 'medium';
        subtaskPriority = 'medium';
      } else if (/(?:priority|prio):\s*low/i.test(cleaned)) {
        taskPriority = 'low';
        subtaskPriority = 'low';
      }

      // Extract Due Date
      let dueDate = '';
      const dueMatch = /(?:due):\s*(\d{4}-\d{2}-\d{2})/i.exec(cleaned);
      if (dueMatch) {
        dueDate = dueMatch[1];
      }

      // Clean metadata elements from the title
      let title = cleaned.replace(/\s*\((?:priority|prio|due):\s*[^)]+\)/gi, '').trim();
      title = title.replace(/,\s*$/, '').trim();

      if (isIndented && currentTask) {
        const subtask: Subtask = {
          id: `subtask-${timestamp}-${lineIndex}`,
          taskId: currentTask.id,
          title,
          completed,
          userId,
          createdAt: new Date(timestamp + lineIndex).toISOString(),
          priority: subtaskPriority,
        };
        subtasks.push(subtask);
      } else {
        const newTask: Task = {
          id: `task-${timestamp}-${lineIndex}`,
          title,
          overview: '',
          completed,
          priority: taskPriority,
          dueDate: dueDate || (activeColId ? '' : defaultDueDate),
          collectionId: activeColId,
          subcollectionId: activeSubId,
          userId,
          createdAt: new Date(timestamp + lineIndex).toISOString(),
          imported: true,
        };
        currentTask = newTask;
        tasks.push(newTask);
      }
    });

    return { tasks, subtasks };
  };

  // Live real-time parsing for preview feedback
  const { parsedTasks, parsedSubtasks } = useMemo(() => {
    if (!bulkText.trim()) return { parsedTasks: [], parsedSubtasks: [] };
    // Pass a static timestamp seed to ensure the function is completely pure during render
    const previewTimestamp = 1700000000000;
    const { tasks, subtasks } = parseBulkImportText(
      bulkText,
      user?.uid || 'preview',
      activeCollectionId,
      activeSubcollectionId,
      previewTimestamp
    );
    return { parsedTasks: tasks, parsedSubtasks: subtasks };
  }, [bulkText, user, activeCollectionId, activeSubcollectionId]);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkText.trim()) {
      toast('Please enter some text to import.', 'warning');
      return;
    }
    if (!user) {
      toast('User session not found.', 'error');
      return;
    }

    setIsImporting(true);
    try {
      const { tasks, subtasks } = parseBulkImportText(
        bulkText,
        user.uid,
        activeCollectionId,
        activeSubcollectionId,
        Date.now()
      );

      if (tasks.length === 0) {
        toast('No valid tasks parsed. Make sure tasks are not indented!', 'warning');
        setIsImporting(false);
        return;
      }

      await dispatch(createTasksBulkAsync({ tasks, subtasks })).unwrap();
      toast(`Successfully imported ${tasks.length} tasks and ${subtasks.length} subtasks! 🚀`, 'success');
      setBulkText('');
      onClose();
    } catch {
      toast('Failed to bulk import tasks.', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bulk Import Tasks"
      size="5xl"
    >
      <form onSubmit={handleImport} className="flex flex-col gap-5 text-xs text-text-primary">
        
        {/* Quick Instructions Banner - Collapsible for both Desktop and Mobile, defaults to collapsed */}
        <details className="bg-[#161616]/40 border border-gray-border/30 rounded-2xl p-3.5 select-none transition-all">
          <summary className="text-[10px] font-black uppercase tracking-wider text-brand-primary cursor-pointer outline-none flex items-center gap-2">
            <Info className="w-3.5 h-3.5" />
            <span>Quick Instructions (Click to expand)</span>
          </summary>
          <ul className="list-disc pl-4.5 mt-2.5 space-y-1.5 text-text-secondary select-text text-[11px] leading-relaxed">
            <li>Write one task per line at the root level (no indentation).</li>
            <li>Indent lines (spaces or tabs) to group them as subtasks under the task above them.</li>
            <li>Bullets like <code className="bg-[#202020] px-1 rounded text-text-primary text-[10px]">-</code> or brackets <code className="bg-[#202020] px-1 rounded text-text-primary text-[10px]">[ ]</code> are automatically cleaned.</li>
            <li>Add attributes in parentheses: <code className="bg-[#202020] px-1 rounded text-text-primary text-[10px]">(Priority: High)</code> or <code className="bg-[#202020] px-1 rounded text-text-primary text-[10px]">(Due: YYYY-MM-DD)</code>.</li>
          </ul>
        </details>

        {/* Core 3-Column Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
          
          {/* Column 1: Templates/Examples */}
          <div className="lg:col-span-2 flex flex-col gap-3 bg-[#101010] border border-gray-border/50 rounded-2xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-border/20 pb-2.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-text-secondary/60 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-brand-primary" />
                Templates & Examples
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyExample}
                  className="text-[9px] font-bold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                >
                  {copiedExample ? 'Copied!' : 'Copy'}
                </button>
                <span className="text-text-secondary/30">|</span>
                <button
                  type="button"
                  onClick={handleLoadExample}
                  className="text-[9px] font-bold text-brand-primary hover:text-brand-primary/80 transition-colors cursor-pointer"
                >
                  Use Template
                </button>
              </div>
            </div>

            {/* Tabs Header */}
            <div className="grid grid-cols-3 gap-0.5 bg-[#1a1a1a] p-0.5 rounded-lg border border-gray-border/20">
              {(Object.keys(examples) as TabType[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`py-1 text-[9px] font-bold rounded transition-all cursor-pointer ${
                    activeTab === tab
                      ? 'bg-brand-primary/15 text-brand-primary border border-brand-primary/10 shadow-sm'
                      : 'text-text-secondary hover:text-text-primary hover:bg-[#202020]'
                  }`}
                >
                  {examples[tab].label}
                </button>
              ))}
            </div>

            <div className="text-[10px] text-text-secondary italic px-1 select-text">
              {examples[activeTab].desc}
            </div>

            <pre className="bg-[#181818] p-3 rounded-xl border border-gray-border/20 text-[10px] text-text-secondary/80 font-mono leading-relaxed select-all whitespace-pre-wrap">
              {examples[activeTab].text}
            </pre>
          </div>

          {/* Column 2: Input Textarea */}
          <div className="lg:col-span-2 flex flex-col gap-1.5">
            <label htmlFor="bulk-import-textarea" className="text-[10px] font-black uppercase tracking-wider text-text-secondary/60">
              Paste Tasks & Subtasks
            </label>
            <textarea
              id="bulk-import-textarea"
              placeholder={`Design homepage\n  Wireframes\n  Color palette\nImplementation\n  Codebase setup`}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              className="w-full min-h-[220px] lg:min-h-[340px] px-4 py-3 rounded-2xl border border-gray-border bg-[#181818] text-text-primary text-xs font-semibold placeholder:text-text-secondary/30 focus:outline-hidden focus:border-brand-primary/50 focus:bg-[#1a1a1a] transition-all resize-y focus-visible:ring-2 focus-visible:ring-brand-primary/20"
              spellCheck={false}
            />
          </div>

          {/* Column 3: Live Preview */}
          <div className="lg:col-span-2 flex flex-col gap-1.5 border-t lg:border-t-0 lg:border-l border-gray-border/20 pt-4 lg:pt-0 pl-0 lg:pl-6">
            <label className="text-[10px] font-black uppercase tracking-wider text-text-secondary/60">
              Live Import Preview
            </label>
            {parsedTasks.length > 0 ? (
              <div className="w-full min-h-[220px] lg:min-h-[340px] max-h-[340px] overflow-y-auto no-scrollbar bg-[#161616]/40 p-4 border border-gray-border/30 rounded-2xl">
                <div className="flex flex-col gap-2.5">
                  {parsedTasks.map((t) => (
                    <div key={t.id} className="flex flex-col gap-1 border border-gray-border/20 p-2.5 rounded-xl bg-[#1a1a1a]/30">
                      <div className="flex items-center gap-2 font-bold text-text-primary">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0" />
                        <span className={t.completed ? 'line-through opacity-60 text-text-secondary' : ''}>
                          {t.title}
                        </span>
                        {t.priority !== 'low' && (
                          <span className="text-[8px] px-1.5 py-0.5 rounded bg-error/15 text-error font-black uppercase tracking-wider scale-90">
                            Prio {t.priority === 'high' ? 'High' : 'Medium'}
                          </span>
                        )}
                        {t.dueDate && (
                          <span className="text-[8px] px-1.5 py-0.5 rounded bg-brand-secondary/15 text-brand-secondary font-black uppercase tracking-wider scale-90">
                            Due: {t.dueDate}
                          </span>
                        )}
                      </div>
                      
                      {/* Subtasks under this task */}
                      {parsedSubtasks.filter(s => s.taskId === t.id).length > 0 && (
                        <div className="pl-4 border-l border-gray-border/30 ml-0.5 mt-1 flex flex-col gap-1">
                          {parsedSubtasks.filter(s => s.taskId === t.id).map((s) => (
                            <div key={s.id} className="flex items-center gap-2 text-text-secondary text-[11px] font-semibold">
                              <span className="text-brand-secondary/60">↳</span>
                              <span className={s.completed ? 'line-through opacity-60' : ''}>
                                {s.title}
                              </span>
                              {s.priority && s.priority !== 'low' && (
                                <span className="text-[8px] px-1 py-0.2 rounded bg-warning/15 text-warning font-extrabold uppercase scale-90">
                                  {s.priority}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="w-full min-h-[220px] lg:min-h-[340px] flex flex-col items-center justify-center text-center py-6 text-text-secondary/40 gap-2 border border-dashed border-gray-border/50 rounded-2xl select-none">
                <FileText className="w-8 h-8 opacity-30" />
                <span className="text-[10px] font-bold">Live preview will appear as you type…</span>
              </div>
            )}
          </div>

        </div>

        {/* Modal Actions Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-border/50 pt-4 select-none shrink-0">
          <Button
            variant="ghost"
            type="button"
            onClick={onClose}
            disabled={isImporting}
            className="text-[11px] font-bold py-2.5 px-4 cursor-pointer text-text-secondary hover:text-text-primary"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isImporting || !bulkText.trim()}
            className="flex items-center justify-center gap-2 py-2.5 px-4 cursor-pointer font-extrabold text-[11px]"
          >
            <Upload className="w-3.5 h-3.5 text-white" />
            <span>{isImporting ? 'Importing…' : 'Import Tasks'}</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
};
