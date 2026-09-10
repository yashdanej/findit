import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
type Toast = { id: number; message: string; type: "success" | "error" };
const ToastContext = createContext<{ show: (message: string, type?: Toast["type"]) => void }>({ show: () => undefined });
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const show = useCallback((message: string, type: Toast["type"] = "success") => { const id = Date.now(); setToasts((items) => [...items, { id, message, type }]); setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 4200); }, []);
  return <ToastContext.Provider value={{ show }}>{children}<div className="toast-stack" aria-live="polite">{toasts.map((toast) => <div className={`toast ${toast.type}`} key={toast.id}><span>{toast.message}</span></div>)}</div></ToastContext.Provider>;
}
export const useToast = () => useContext(ToastContext);
