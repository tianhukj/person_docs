import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'md' | 'lg' | 'xl';
}

export default function Modal({ open, onClose, title, children, size = 'lg' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const widths = { md: 'max-w-md', lg: 'max-w-2xl', xl: 'max-w-4xl' } as const;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-emerald-950/30 p-4 backdrop-blur-sm sm:p-6">
      <div
        className={`relative my-8 w-full ${widths[size]} animate-[modalIn_0.2s_ease-out] rounded-2xl border border-emerald-100 bg-white shadow-2xl shadow-emerald-300/30`}
      >
        <div className="flex items-center justify-between border-b border-emerald-100 px-6 py-4">
          <h3 className="text-lg font-semibold text-emerald-900">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-emerald-400 transition hover:bg-emerald-50 hover:text-emerald-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
      <style>{`@keyframes modalIn{from{opacity:0;transform:translateY(12px) scale(.98)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}
