import { useEffect, type ReactNode } from 'react';

const BLUE = '#1A5FA8';

type Size = 'sm' | 'md' | 'lg';

const SIZE_CLASS: Record<Size, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

// Generic modal primitive: backdrop click to close, Escape to close,
// body scroll lock while open. Single z-index layer (z-50). No portal —
// the app shell doesn't have any overflow/z-index that would require it.
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: Size;
}) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 font-sans"
      onMouseDown={(e) => {
        // Backdrop click closes; clicks on the dialog itself don't
        // bubble back to currentTarget so they're safe.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`w-full ${SIZE_CLASS[size]} bg-white rounded-2xl shadow-2xl`}
      >
        <div className="px-6 pt-5 pb-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-serif text-xl font-bold" style={{ color: BLUE }}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-50 transition-colors"
          >
            ×
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
