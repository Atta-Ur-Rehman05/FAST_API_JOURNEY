import { useEffect, useRef, useCallback } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({ open, onClose, title, children, maxWidth = 'max-w-lg' }) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  useEffect(() => {
    if (open) {
      previousActiveElement.current = document.activeElement;
      closeButtonRef.current?.focus();
    } else {
      previousActiveElement.current?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }
  }, [open]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    }
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby={title ? 'modal-title' : undefined}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${maxWidth} max-h-[90vh] overflow-y-auto bg-zinc-900 rounded-xl border border-zinc-800 shadow-2xl`}>
        {title && (
          <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
            <h2 id="modal-title" className="text-base font-black text-zinc-100">{title}</h2>
            <button ref={closeButtonRef} onClick={onClose} className="ui-icon-button text-zinc-400 hover:text-zinc-100" aria-label="Close dialog">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};
