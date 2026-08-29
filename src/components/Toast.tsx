import React from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'info';
  title: string;
  message: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto p-4 rounded-xl shadow-lg border text-xs flex items-start gap-3 transition-all transform animate-in slide-in-from-bottom-2 ${
            toast.type === 'success'
              ? 'bg-slate-900 text-white border-emerald-500/40 ring-1 ring-emerald-500/30'
              : toast.type === 'warning'
              ? 'bg-slate-900 text-white border-amber-500/40 ring-1 ring-amber-500/30'
              : 'bg-slate-900 text-white border-blue-500/40 ring-1 ring-blue-500/30'
          }`}
        >
          <div className="shrink-0 mt-0.5">
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-blue-400" />}
          </div>

          <div className="flex-1">
            <h4 className="font-bold text-white text-xs">{toast.title}</h4>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">{toast.message}</p>
          </div>

          <button
            onClick={() => onDismiss(toast.id)}
            className="text-slate-400 hover:text-white p-0.5 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
