import React, { createContext, useCallback, useState, ReactNode } from 'react';
import Toast from '../components/Toast';

interface ToastState {
  msg: string;
  duration: number;
}

interface ToastContextValue {
  showToast: (msg: string, duration?: number) => void;
}

export const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((msg: string, duration = 3000) => {
    setToast({ msg, duration });
  }, []);

  const handleClose = () => setToast(null);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Toast message={toast.msg} duration={toast.duration} onClose={handleClose} />
      )}
    </ToastContext.Provider>
  );
}