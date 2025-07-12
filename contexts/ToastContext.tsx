import React, { createContext, useCallback, useState, ReactNode } from 'react';
import Toast from '../components/Toast';

interface ToastState {
  msg: string;
  duration: number;
  type: 'info' | 'error';
  retryCallback?: () => void;
}

interface ToastContextValue {
  showToast: (msg: string, duration?: number) => void;
  showError: (msg: string, retryCallback?: () => void) => void;
}

export const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
  showError: () => {},
});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((msg: string, duration = 3000) => {
    setToast({ msg, duration, type: 'info' });
  }, []);

  const showError = useCallback(
    (msg: string, retryCallback?: () => void, duration = 5000) => {
      setToast({ msg, duration, type: 'error', retryCallback });
    },
    [],
  );

  const handleClose = () => setToast(null);

  return (
    <ToastContext.Provider value={{ showToast, showError }}>
      {children}
      {toast && (
        <Toast
          message={toast.msg}
          duration={toast.duration}
          type={toast.type}
          retryCallback={toast.retryCallback}
          onClose={handleClose}
        />
      )}
    </ToastContext.Provider>
  );
}