import { Modal } from './Modal';
import { Button } from '../ui/Button';
import { Loader2 } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
  isLoading?: boolean;
}

export const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDanger = true,
  isLoading = false,
}: ConfirmationModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col gap-5">
        <p className="text-sm text-text-secondary leading-relaxed">
          {message}
        </p>
        <div className="flex items-center justify-end gap-3 mt-1">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant={isDanger ? 'danger' : 'primary'}
            size="sm"
            disabled={isLoading}
            onClick={async () => {
              const result = onConfirm();
              if (result instanceof Promise) {
                try {
                  await result;
                } catch {
                  // Handled by caller
                }
              } else {
                onClose();
              }
            }}
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
            {isLoading ? 'Processing…' : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
