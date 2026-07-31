import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";

export type ToastVariant =
  | "success"
  | "error"
  | "info"
  | "warning";

export interface Toast {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toasts: Toast[];
  showToast: (
    toast: Omit<Toast, "id">
  ) => void;
  removeToast: (id: number) => void;
}

const ToastContext =
  createContext<ToastContextValue | null>(null);

export function ToastProvider({
  children,
}: PropsWithChildren) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const nextId = useRef(1);

  const removeToast = useCallback((id: number) => {
    setToasts((current) =>
      current.filter((toast) => toast.id !== id)
    );
  }, []);

  const showToast = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = nextId.current++;

      setToasts((current) => [
        ...current,
        {
          id,
          ...toast,
        },
      ]);

      window.setTimeout(() => {
        removeToast(id);
      }, 4000);
    },
    [removeToast]
  );

  const value = useMemo(
    () => ({
      toasts,
      showToast,
      removeToast,
    }),
    [toasts, showToast, removeToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error(
      "useToast must be used within ToastProvider."
    );
  }

  return context;
}