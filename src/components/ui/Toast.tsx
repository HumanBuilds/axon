"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { X } from "react-feather";

type ToastType = "success" | "error" | "warning";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  addToast: ((message: string, type?: ToastType) => void) & {
    success: (message: string) => void;
    error: (message: string) => void;
    warning: (message: string) => void;
  };
}

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS: Record<ToastType, number> = {
  success: 3000,
  warning: 5000,
  error: 7000,
};

const BORDER_COLORS: Record<ToastType, string> = {
  success: "border-l-green-500",
  error: "border-l-red-500",
  warning: "border-l-amber-500",
};

const ICON_COLORS: Record<ToastType, string> = {
  success: "text-green-600",
  error: "text-red-600",
  warning: "text-amber-600",
};

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onDismiss(toast.id), 200);
    }, AUTO_DISMISS_MS[toast.type]);
    return () => clearTimeout(timer);
  }, [toast.id, toast.type, onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-start gap-2 rounded-md border border-gray-200 border-l-4 ${BORDER_COLORS[toast.type]} bg-white px-3 py-3 shadow-lg text-sm max-w-[360px] transition-all duration-200 ${exiting ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}
    >
      <span className={`flex-1 ${ICON_COLORS[toast.type]}`}>
        {toast.message}
      </span>
      <button
        onClick={() => {
          setExiting(true);
          setTimeout(() => onDismiss(toast.id), 200);
        }}
        className="text-gray-400 hover:text-gray-600 shrink-0"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToastBase = useCallback(
    (message: string, type: ToastType = "success") => {
      const id = crypto.randomUUID();
      setToasts((prev) => [{ id, message, type }, ...prev]);
    },
    []
  );

  const addToast = Object.assign(addToastBase, {
    success: (message: string) => addToastBase(message, "success"),
    error: (message: string) => addToastBase(message, "error"),
    warning: (message: string) => addToastBase(message, "warning"),
  });

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {mounted &&
        createPortal(
          <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 sm:bottom-4 sm:right-4 max-sm:left-4 max-sm:right-4 max-sm:items-center">
            {toasts.map((toast) => (
              <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
