'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const TOAST_STYLES: Record<ToastType, { bg: string; border: string; icon: string; color: string }> = {
  success: { bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.35)', icon: '✓', color: '#34d399' },
  error: { bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.35)', icon: '✕', color: '#f87171' },
  warning: { bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.35)', icon: '⚠', color: '#fbbf24' },
  info: { bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.35)', icon: 'ℹ', color: '#60a5fa' },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 4000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev, { id, type, message, duration }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Container */}
      <div style={{
        position: 'fixed', top: 20, right: 20, zIndex: 99999,
        display: 'flex', flexDirection: 'column', gap: '0.625rem',
        pointerEvents: 'none', maxWidth: 420,
      }}>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [exiting, setExiting] = useState(false);
  const style = TOAST_STYLES[toast.type];

  useEffect(() => {
    const exitTimer = setTimeout(() => setExiting(true), toast.duration - 300);
    const removeTimer = setTimeout(() => onRemove(toast.id), toast.duration);
    return () => { clearTimeout(exitTimer); clearTimeout(removeTimer); };
  }, [toast, onRemove]);

  return (
    <div
      style={{
        pointerEvents: 'auto',
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '0.875rem 1.25rem',
        background: style.bg,
        backdropFilter: 'blur(12px)',
        border: `1px solid ${style.border}`,
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
        animation: exiting ? 'toastSlideOut 0.3s ease forwards' : 'toastSlideIn 0.3s ease forwards',
        cursor: 'pointer',
        maxWidth: 420,
      }}
      onClick={() => onRemove(toast.id)}
    >
      <span style={{
        width: 24, height: 24, borderRadius: '50%',
        background: style.color, color: '#0b0f1a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.75rem', fontWeight: 800, flexShrink: 0,
      }}>
        {style.icon}
      </span>
      <span style={{ fontSize: '0.8125rem', color: '#e2e8f0', fontWeight: 500, lineHeight: 1.4 }}>
        {toast.message}
      </span>
      <style>{`
        @keyframes toastSlideIn {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes toastSlideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(120%); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
