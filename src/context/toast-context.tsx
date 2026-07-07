import React, { createContext, useContext, useState, useCallback } from 'react';
import { Toast, ToastContextType, ToastType } from '@/types/toast';

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const DEFAULT_DURATION = 3000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (message: string, type: ToastType = 'info', duration: number = DEFAULT_DURATION) => {
      const id = `${Date.now()}-${Math.random()}`;
      const toast: Toast = { id, message, type, duration };

      setToasts((prevToasts) => [...prevToasts, toast]);

      if (duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, duration);
      }

      return id;
    },
    [dismiss]
  );

  const success = useCallback(
    (message: string, duration?: number) => show(message, 'success', duration),
    [show]
  );

  const error = useCallback(
    (message: string, duration?: number) => show(message, 'error', duration),
    [show]
  );

  const info = useCallback(
    (message: string, duration?: number) => show(message, 'info', duration),
    [show]
  );

  const warning = useCallback(
    (message: string, duration?: number) => show(message, 'warning', duration),
    [show]
  );

  const clear = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        show,
        success,
        error,
        info,
        warning,
        dismiss,
        clear,
      }}
    >
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe ser usado dentro de ToastProvider');
  }
  return context;
}
