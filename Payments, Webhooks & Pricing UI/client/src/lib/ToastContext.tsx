import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { Icon } from '../components/Icons';

type ToastType = 'success' | 'error' | 'info';
type Toast = { id: number; message: string; type: ToastType };
type ToastContextValue = { toast: (message: string, type?: ToastType) => void };
const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now();
    setToasts((items) => [...items, { id, message, type }]);
    window.setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 4200);
  }, []);
  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed right-4 top-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2" aria-live="polite">
        {toasts.map((item) => (
          <div key={item.id} className="toast-in flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xl">
            <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full ${item.type === 'success' ? 'bg-emerald-100 text-emerald-700' : item.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-brand-100 text-brand-700'}`}>
              <Icon name={item.type === 'error' ? 'warning' : 'check'} size={14} />
            </span>
            <p className="flex-1 text-sm font-medium leading-6 text-ink-800">{item.message}</p>
            <button onClick={() => setToasts((items) => items.filter((toastItem) => toastItem.id !== item.id))} className="p-1 text-slate-400 hover:text-slate-700" aria-label="Dismiss notification"><Icon name="close" size={15} /></button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}
