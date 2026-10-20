// src/components/Modal.js
"use client";

import { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Modal accesible: cierra con Esc, bloquea el scroll del fondo y en móvil
 * se muestra como hoja inferior.
 */
export default function Modal({ open, onClose, title, description, children, maxWidth = 'max-w-md' }) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);
    const scrollPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = scrollPrevio;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`w-full ${maxWidth} bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 relative max-h-[92dvh] overflow-y-auto`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-5 right-5 text-zinc-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-black italic uppercase mb-1 pr-8">{title}</h2>
        {description && (
          <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest mb-6">
            {description}
          </p>
        )}

        <div className={description ? '' : 'mt-6'}>{children}</div>
      </div>
    </div>
  );
}
