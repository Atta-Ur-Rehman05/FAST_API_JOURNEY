import { useState, useRef } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  variant?: 'danger' | 'default';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'default',
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-message">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-md bg-zinc-900 rounded-xl border border-zinc-800 shadow-2xl p-6 space-y-4">
        <h3 id="confirm-title" className="text-base font-black text-zinc-100">{title}</h3>
        <p id="confirm-message" className="text-xs text-zinc-400 leading-relaxed">{message}</p>
        <div className="flex justify-end gap-2 pt-2">
          <button ref={cancelRef} onClick={onCancel} disabled={isLoading} className="px-3 py-2 border border-zinc-700 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 rounded-md disabled:opacity-50">
            {cancelLabel}
          </button>
          <button onClick={handleConfirm} disabled={isLoading} className={`px-3 py-2 text-xs font-bold rounded-md disabled:opacity-50 ${variant === 'danger' ? 'bg-rose-600 text-white hover:bg-rose-500' : 'btn-primary'}`}>
            {isLoading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
