import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col gap-2 max-w-sm w-full sm:bottom-6 sm:right-6 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 rounded-xl p-4 shadow-xl border transition-all duration-300 ${
            toast.type === 'success'
              ? 'bg-[#181613] border-[#2E4334] text-[#EAE5D9]'
              : toast.type === 'error'
              ? 'bg-[#181613] border-[#482D27] text-[#EAE5D9]'
              : 'bg-[#181613] border-[#3E3528] text-[#EAE5D9]'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-[#9DBFA5] shrink-0 mt-0.5" />
          ) : toast.type === 'error' ? (
            <AlertCircle className="h-4 w-4 text-[#BFA0A0] shrink-0 mt-0.5" />
          ) : (
            <Info className="h-4 w-4 text-[#C2A675] shrink-0 mt-0.5" />
          )}

          <div className="flex-1 text-xs">
            <div className="font-serif font-bold text-[#F4EFE6] text-sm leading-tight">{toast.title}</div>
            {toast.message && <p className="mt-0.5 text-[#A8A194] text-xs leading-relaxed">{toast.message}</p>}
          </div>

          <button
            onClick={() => onDismiss(toast.id)}
            className="text-[#8C8477] hover:text-[#EAE5D9] p-1 rounded transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
