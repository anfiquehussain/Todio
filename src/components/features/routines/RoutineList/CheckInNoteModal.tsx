import React, { useState } from 'react';
import { Check, ClipboardList } from 'lucide-react';
import { Modal } from '../../../patterns/Modal';
import { Button } from '../../../ui/Button';

interface CheckInNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (note: string) => void;
  routineTitle: string;
}

export const CheckInNoteModal = ({
  isOpen,
  onClose,
  onConfirm,
  routineTitle,
}: CheckInNoteModalProps) => {
  const [note, setNote] = useState('');

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setNote('');
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(note.trim());
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Log Routine Milestone"
      size="sm"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 font-sans text-xs text-text-primary">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="check-in-note" className="text-[10px] font-black uppercase tracking-wider text-text-secondary/60 flex items-center gap-1.5">
            <ClipboardList className="w-3.5 h-3.5 text-brand-primary" />
            <span>Milestone Note for {routineTitle}</span>
          </label>
          <input
            id="check-in-note"
            type="text"
            placeholder="What did you achieve? (e.g., Completed 5km run…)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-gray-border bg-[#181818] text-text-primary text-xs font-semibold placeholder:text-text-secondary/30 focus:outline-hidden focus:border-brand-primary/50 focus:bg-[#1a1a1a] transition-all focus-visible:ring-2 focus-visible:ring-brand-primary/20"
            autoFocus
            maxLength={100}
          />
          <div className="flex justify-between text-[10px] text-text-secondary/50 font-bold px-1 mt-0.5">
            <span>Optional check-in comment</span>
            <span>{note.length}/100</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3.5 border-t border-gray-border/30 pt-4 select-none shrink-0">
          <Button
            variant="ghost"
            type="button"
            onClick={onClose}
            className="text-[11px] font-bold py-2.5 px-4 cursor-pointer text-text-secondary hover:text-text-primary"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            className="flex items-center justify-center gap-2 py-2.5 px-4 cursor-pointer font-extrabold text-[11px]"
          >
            <Check className="w-3.5 h-3.5 text-white" />
            <span>Complete</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
};
