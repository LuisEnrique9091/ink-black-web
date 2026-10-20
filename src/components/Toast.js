// src/components/Toast.js
"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const ESTILOS = {
  success: { borde: 'border-green-600/40', icono: CheckCircle2, color: 'text-green-500' },
  error: { borde: 'border-red-600/40', icono: XCircle, color: 'text-red-500' },
  info: { borde: 'border-zinc-700', icono: Info, color: 'text-zinc-300' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, tipo = 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, tipo }]);
    return id;
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="fixed z-[100] bottom-4 right-4 left-4 sm:left-auto sm:w-96 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => {
          const estilo = ESTILOS[toast.tipo] || ESTILOS.info;
          const Icono = estilo.icono;
          return (
            <ToastItem
              key={toast.id}
              toast={toast}
              estilo={estilo}
              Icono={Icono}
              onClose={() => remove(toast.id)}
            />
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, estilo, Icono, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      role="status"
      className={`pointer-events-auto bg-zinc-900/95 border ${estilo.borde} rounded-2xl p-4 flex items-start gap-3 shadow-2xl backdrop-blur-md`}
    >
      <Icono size={18} className={`${estilo.color} shrink-0 mt-0.5`} />
      <p className="text-xs font-bold text-zinc-200 flex-1 leading-relaxed break-words">{toast.message}</p>
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar notificación"
        className="text-zinc-500 hover:text-white transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider');
  return ctx;
}
