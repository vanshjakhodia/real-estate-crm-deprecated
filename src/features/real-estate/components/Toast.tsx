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
              ? 'bg-card border-border text-foreground'
              : toast.type === 'error'
              ? 'bg-card border-border text-foreground'
              : 'bg-card border-border text-foreground'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-forest shrink-0 mt-0.5" />
          ) : toast.type === 'error' ? (
            <AlertCircle className="h-4 w-4 text-destructive-foreground shrink-0 mt-0.5" />
          ) : (
            <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          )}

          <div className="flex-1 text-xs">
            <div className="font-serif font-bold text-foreground text-sm leading-tight">{toast.title}</div>
            {toast.message && <p className="mt-0.5 text-muted-foreground text-xs leading-relaxed">{toast.message}</p>}
          </div>

          <button
            onClick={() => onDismiss(toast.id)}
            className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
