// src/components/Sidebar.js
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Zap,
  Package,
  BarChart3,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

const NAV = [
  { href: '/', label: 'Inicio', icon: LayoutDashboard },
  { href: '/agenda', label: 'Agenda', icon: Calendar },
  { href: '/nueva-sesion', label: 'Nueva Sesión', icon: Zap },
  { href: '/inventario', label: 'Inventario', icon: Package },
  { href: '/reportes', label: 'Reportes', icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [saliendo, setSaliendo] = useState(false);

  useEffect(() => {
    document.body.style.overflow = abierto ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [abierto]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setAbierto(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleLogout = async () => {
    setSaliendo(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push('/login');
      router.refresh();
    }
  };

  const esActivo = (href) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <>
      {/* Barra superior móvil */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-30 h-16 bg-zinc-950/95 border-b border-zinc-900 backdrop-blur-md flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="bg-red-600 w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm text-white">
            IB
          </div>
          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.3em] italic">
            Ink Black
          </span>
        </div>

        <button
          type="button"
          onClick={() => setAbierto(true)}
          aria-label="Abrir menú"
          aria-expanded={abierto}
          className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition-colors"
        >
          <Menu size={20} />
        </button>
      </header>

      {/* Overlay */}
      {abierto && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          onClick={() => setAbierto(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar (drawer en móvil, fijo en desktop) */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-zinc-950 border-r border-zinc-900 p-6 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          abierto ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between mb-10 px-1">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shadow-lg shadow-red-900/40 text-white">
              IB
            </div>
            <h2 className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] italic">
              Ink Black
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setAbierto(false)}
            aria-label="Cerrar menú"
            className="lg:hidden p-2 text-zinc-500 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="space-y-1 flex-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const activo = esActivo(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setAbierto(false)}
                className={`flex items-center gap-3 p-3 rounded-xl font-bold text-xs transition-all ${
                  activo
                    ? 'bg-zinc-900 text-white border border-zinc-800'
                    : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200 border border-transparent'
                }`}
              >
                <Icon size={16} className={activo ? 'text-red-600' : ''} />
                {label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          disabled={saliendo}
          className="flex items-center gap-3 p-3 text-zinc-600 hover:text-red-500 font-black uppercase text-[9px] tracking-widest transition-all border-t border-zinc-900 pt-6 disabled:opacity-50"
        >
          <LogOut size={14} /> {saliendo ? 'Saliendo...' : 'Cerrar Sesión'}
        </button>
      </aside>
    </>
  );
}
