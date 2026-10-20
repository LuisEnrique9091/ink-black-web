"use client";

import Link from 'next/link';
import { useEffect } from 'react';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('[APP] Error no controlado:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-zinc-900/60 border border-zinc-800 rounded-3xl p-8 text-center">
        <div className="bg-red-600 w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg mx-auto mb-6">
          IB
        </div>
        <h1 className="text-2xl font-black italic uppercase tracking-tighter mb-2">
          Algo salió mal
        </h1>
        <p className="text-zinc-500 text-xs font-bold mb-6 break-words">
          {error?.message || 'Ocurrió un error inesperado.'}
        </p>
        <button
          type="button"
          onClick={reset}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-xl uppercase text-[10px] tracking-widest transition-all"
        >
          Reintentar
        </button>
        <Link
          href="/"
          className="block mt-4 text-zinc-500 hover:text-white text-[10px] uppercase tracking-widest transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
