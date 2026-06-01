import { useState, useEffect } from 'react';
import { Download, Copy, Check, FileText, Code, Settings2 } from 'lucide-react';
import { Modal } from '../../../patterns/Modal';
import { Button } from '../../../ui/Button';
import { useToast } from '../../../../hooks/useToast';
import type { Task, Subtask } from '../../../../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTask: Task | null;
  subtasks: Subtask[];
  mode: 'task' | 'subtask';
}

export const ExportModal = ({
  isOpen,
  onClose,
  activeTask,
  subtasks,
  mode,
}: ExportModalProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  // Configuration states for Task export mode
  const [includeDueDate, setIncludeDueDate] = useState(true);
  const [includePriority, setIncludePriority] = useState(true);
  const [includeSubtasks, setIncludeSubtasks] = useState(true);
  const [includeSubtaskStatus, setIncludeSubtaskStatus] = useState(true);
  const [includeSubtaskPriority, setIncludeSubtaskPriority] = useState(true);
  
  // Format selection: markdown, txt, json
  const [format, setFormat] = useState<'markdown' | 'txt' | 'json'>('markdown');

  // Trigger temporary visual checkmark on copy
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  if (!activeTask) return null;

  // Filter subtasks related to current active task
  const currentSubtasks = subtasks.filter((s) => s.taskId === activeTask.id);

  // Generate output text dynamically based on config and format
  const generateExportContent = (): string => {
    if (mode === 'subtask') {
      // Export only subtask titles, one per line (bulk-import ready)
      return currentSubtasks.map((s) => s.title).join('\n');
    }

    const priorityLabel =
      activeTask.priority === 5
        ? 'High'
        : activeTask.priority === 3
        ? 'Medium'
        : 'Low';

    if (format === 'json') {
      const jsonExport: Record<string, unknown> = {
        title: activeTask.title,
      };

      if (activeTask.overview) {
        jsonExport.overview = activeTask.overview;
      }
      if (includeDueDate && activeTask.dueDate) {
        jsonExport.dueDate = activeTask.dueDate;
      }
      if (includePriority) {
        jsonExport.priority = priorityLabel;
      }
      if (includeSubtasks && currentSubtasks.length > 0) {
        jsonExport.subtasks = currentSubtasks.map((s) => {
          const subObj: Record<string, unknown> = { title: s.title };
          if (includeSubtaskStatus) {
            subObj.completed = s.completed;
          }
          if (includeSubtaskPriority) {
            subObj.priority = s.priority;
          }
          return subObj;
        });
      }

      return JSON.stringify(jsonExport, null, 2);
    }

    if (format === 'markdown') {
      let content = `# ${activeTask.title}\n\n`;

      if (activeTask.overview) {
        content += `**Overview:**\n${activeTask.overview}\n\n`;
      }

      const detailsList: string[] = [];
      if (includeDueDate && activeTask.dueDate) {
        detailsList.push(`- **Due Date:** ${activeTask.dueDate}`);
      }
      if (includePriority) {
        detailsList.push(`- **Priority:** ${priorityLabel}`);
      }

      if (detailsList.length > 0) {
        content += `**Details:**\n${detailsList.join('\n')}\n\n`;
      }

      if (includeSubtasks && currentSubtasks.length > 0) {
        content += `**Subtasks:**\n`;
        const subtaskList = currentSubtasks
          .map((s) => {
            const status = includeSubtaskStatus ? (s.completed ? '[x]' : '[ ]') : '-';
            const priority = includeSubtaskPriority
              ? ` *(Priority: ${s.priority})*`
              : '';
            return `${status} ${s.title}${priority}`;
          })
          .join('\n');
        content += subtaskList;
      }

      return content.trim();
    }

    // Default TXT Format
    let content = `Task: ${activeTask.title}\n`;
    if (activeTask.overview) {
      content += `\nOverview:\n${activeTask.overview}\n`;
    }

    const detailsList: string[] = [];
    if (includeDueDate && activeTask.dueDate) {
      detailsList.push(`Due Date: ${activeTask.dueDate}`);
    }
    if (includePriority) {
      detailsList.push(`Priority: ${priorityLabel}`);
    }

    if (detailsList.length > 0) {
      content += `\nDetails:\n${detailsList.map((d) => `- ${d}`).join('\n')}\n`;
    }

    if (includeSubtasks && currentSubtasks.length > 0) {
      content += `\nSubtasks:\n`;
      const subtaskList = currentSubtasks
        .map((s) => {
          const status = includeSubtaskStatus ? (s.completed ? '[x]' : '[ ]') : '-';
          const priority = includeSubtaskPriority ? ` (Priority: ${s.priority})` : '';
          return `${status} ${s.title}${priority}`;
        })
        .join('\n');
      content += subtaskList;
    }

    return content.trim();
  };

  const exportText = generateExportContent();

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(exportText);
    setCopied(true);
    toast('Copied to clipboard successfully! 📋', 'success');
  };

  const handleDownload = () => {
    let extension = 'txt';
    let mimeType = 'text/plain';

    if (mode === 'task') {
      if (format === 'markdown') {
        extension = 'md';
        mimeType = 'text/markdown';
      } else if (format === 'json') {
        extension = 'json';
        mimeType = 'application/json';
      }
    }

    const blob = new Blob([exportText], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // Clean task title for filename
    const cleanTitle = activeTask.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const prefix = mode === 'subtask' ? 'subtasks' : 'task';
    link.href = url;
    link.download = `${prefix}-${cleanTitle || 'todo'}.${extension}`;
    link.click();
    
    URL.revokeObjectURL(url);
    toast('File downloaded successfully! 📦', 'success');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'subtask' ? 'Export Subtasks (Import Ready)' : 'Export Task & Details'}
      size={mode === 'task' ? 'xl' : 'lg'}
    >
      <div className="flex flex-col gap-6 font-sans text-xs text-text-primary">
        {mode === 'task' ? (
          /* Multi-column Layout for Task Export Mode */
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            
            {/* Options Panel (Left) */}
            <div className="lg:col-span-2 flex flex-col gap-5 border-r border-gray-border/30 pr-0 lg:pr-5">
              
              {/* Format selection segment */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-text-secondary/60 flex items-center gap-1">
                  <Code className="w-3.5 h-3.5 text-brand-primary" />
                  <span>Choose Export Format</span>
                </label>
                <div className="grid grid-cols-3 gap-1 bg-[#1a1a1a] p-1.5 rounded-2xl border border-gray-border/50 select-none">
                  {(['markdown', 'txt', 'json'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFormat(f)}
                      className={`py-2 text-[10px] font-bold rounded-xl capitalize transition-all cursor-pointer ${
                        format === f
                          ? 'bg-brand-primary/15 text-brand-primary border border-brand-primary/20 shadow-sm'
                          : 'text-text-secondary border border-transparent hover:text-text-primary hover:bg-[#202020]'
                      }`}
                    >
                      {f === 'markdown' ? 'Markdown' : f.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Checkboxes parameters */}
              <div className="flex flex-col gap-3">
                <label className="text-[10px] font-black uppercase tracking-wider text-text-secondary/60 flex items-center gap-1">
                  <Settings2 className="w-3.5 h-3.5 text-brand-primary" />
                  <span>Select Fields to Include</span>
                </label>

                <div className="flex flex-col gap-2.5 bg-[#161616]/40 p-4 border border-gray-border/30 rounded-2xl">
                  {/* Due Date */}
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={includeDueDate}
                      onChange={(e) => setIncludeDueDate(e.target.checked)}
                      className="w-4.5 h-4.5 accent-brand-primary cursor-pointer border-gray-border rounded bg-bg-secondary"
                    />
                    <span className="font-bold text-text-secondary hover:text-text-primary transition-colors">Due Date</span>
                  </label>

                  {/* Priority */}
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={includePriority}
                      onChange={(e) => setIncludePriority(e.target.checked)}
                      className="w-4.5 h-4.5 accent-brand-primary cursor-pointer border-gray-border rounded bg-bg-secondary"
                    />
                    <span className="font-bold text-text-secondary hover:text-text-primary transition-colors">Priority</span>
                  </label>

                  {/* Subtasks Block */}
                  <div className="border-t border-gray-border/30 pt-2.5 mt-1 flex flex-col gap-2.5">
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={includeSubtasks}
                        onChange={(e) => setIncludeSubtasks(e.target.checked)}
                        className="w-4.5 h-4.5 accent-brand-primary cursor-pointer border-gray-border rounded bg-bg-secondary"
                      />
                      <span className="font-bold text-text-secondary hover:text-text-primary transition-colors">Subtasks List</span>
                    </label>

                    {includeSubtasks && currentSubtasks.length > 0 && (
                      <div className="pl-6.5 flex flex-col gap-2 border-l border-brand-primary/20 animate-slide-in">
                        {/* Subtask Status */}
                        <label className="flex items-center gap-2.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={includeSubtaskStatus}
                            onChange={(e) => setIncludeSubtaskStatus(e.target.checked)}
                            className="w-4 h-4 accent-brand-primary cursor-pointer border-gray-border rounded bg-bg-secondary"
                          />
                          <span className="text-[11px] font-semibold text-text-secondary/80 hover:text-text-primary transition-colors">Completion Boxes</span>
                        </label>

                        {/* Subtask Priority */}
                        <label className="flex items-center gap-2.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={includeSubtaskPriority}
                            onChange={(e) => setIncludeSubtaskPriority(e.target.checked)}
                            className="w-4 h-4 accent-brand-primary cursor-pointer border-gray-border rounded bg-bg-secondary"
                          />
                          <span className="text-[11px] font-semibold text-text-secondary/80 hover:text-text-primary transition-colors">Subtask Priority</span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Panel (Right) */}
            <div className="lg:col-span-3 flex flex-col gap-3">
              <label className="text-[10px] font-black uppercase tracking-wider text-text-secondary/60 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-brand-primary" />
                <span>Live Export Preview</span>
              </label>

              <div className="flex-1 min-h-[220px] max-h-[340px] bg-[#161616] border border-gray-border p-4 rounded-2xl font-mono text-[10.5px] leading-relaxed overflow-y-auto no-scrollbar whitespace-pre-wrap select-text selection:bg-brand-primary/30">
                {exportText || (
                  <span className="text-text-secondary/30 italic">No parameters selected to export.</span>
                )}
              </div>
            </div>

          </div>
        ) : (
          /* Plain Subtask Export View */
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-wider text-text-secondary/60 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-brand-primary" />
                <span>Import-Ready Subtasks List</span>
              </label>
              <span className="text-[9px] font-bold text-text-secondary/50 bg-[#161616] border border-gray-border px-2 py-0.5 rounded-md">
                {currentSubtasks.length} items
              </span>
            </div>

            <p className="text-[10px] text-text-secondary leading-relaxed bg-brand-primary/5 border border-brand-primary/10 p-3 rounded-xl mb-1">
              💡 Below is a list containing only your subtask titles, formatted one per line. You can easily copy and paste this text directly into another task's <strong>Bulk Import</strong> input box!
            </p>

            <div className="min-h-[160px] max-h-[260px] bg-[#161616] border border-gray-border p-4 rounded-2xl font-mono text-[10.5px] leading-relaxed overflow-y-auto no-scrollbar whitespace-pre select-text selection:bg-brand-primary/30">
              {exportText || (
                <span className="text-text-secondary/30 italic">No subtask list items found for this task.</span>
              )}
            </div>
          </div>
        )}

        {/* Form Actions Footer */}
        <div className="flex items-center justify-end gap-3.5 border-t border-gray-border/50 pt-4 select-none shrink-0">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-[11px] font-bold py-2.5 px-4 cursor-pointer"
          >
            Cancel
          </Button>

          <Button
            variant="ghost"
            onClick={handleCopyToClipboard}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl border border-gray-border bg-bg-primary text-text-primary text-[11px] font-bold hover:bg-[#202020] transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-success animate-scale-in" />
                <span className="text-success">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-brand-primary" />
                <span>Copy to Clipboard</span>
              </>
            )}
          </Button>

          <Button
            variant="primary"
            onClick={handleDownload}
            disabled={!exportText}
            className="flex items-center justify-center gap-2 py-2.5 px-4 cursor-pointer font-extrabold text-[11px]"
          >
            <Download className="w-3.5 h-3.5 text-white" />
            <span>Download File</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
