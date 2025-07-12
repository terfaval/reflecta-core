import React, { createContext, useCallback, useState, ReactNode } from 'react';
import Toast from '../components/Toast';

const ERROR_MESSAGES: Record<string, string> = {
  network_error: 'Nem sikerült csatlakozni a szerverhez. Kérlek, ellenőrizd az internetkapcsolatodat.',
  system_error: 'Hiba történt a rendszerben. Kérlek, próbáld újra később.',
  ai_error: 'Az AI válasza nem érhető el jelenleg. Kérlek, próbáld újra.',
  auth_error: 'Nincs megfelelő jogosultság.',
};

interface ToastState {
  msg: string;
  duration: number;
  type: 'info' | 'error';
  errorType?: 'network' | 'system' | 'ai' | 'auth';
  retryCallback?: () => Promise<void> | void;
}

interface ErrorToastOptions {
  message: string;
  type?: 'network' | 'system' | 'ai' | 'auth';
  retry?: () => Promise<void> | void;
  duration?: number;
  error?: unknown;
}

interface ToastContextValue {
  showToast: (msg: string, duration?: number) => void;
  showError: (options: string | ErrorToastOptions, retryCallback?: () => void) => void;
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
    (options: string | ErrorToastOptions, retryCb?: () => void) => {
      if (typeof options === 'string') {
        setToast({ msg: options, duration: 5000, type: 'error', retryCallback: retryCb });
        return;
      }

      const {
        message,
        type: errorType,
        retry,
        duration = 5000,
        error,
      } = options;

      const msg = ERROR_MESSAGES[message] || message;
      if (process.env.NODE_ENV === 'development' && error) {
        // eslint-disable-next-line no-console
        console.error(error);
      }
      setToast({ msg, duration, type: 'error', errorType, retryCallback: retry });
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
          errorType={toast.errorType}
          type={toast.type}
          retryCallback={toast.retryCallback}
          onClose={handleClose}
        />
      )}
    </ToastContext.Provider>
  );
}