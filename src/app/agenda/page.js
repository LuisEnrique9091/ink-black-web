"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Clock, Package, XCircle, CheckCircle2, Trash2, CalendarPlus, RefreshCw } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Modal from '@/components/Modal';
import { useToast } from '@/components/Toast';
import { apiFetch } from '@/lib/apiClient';
import { estadoPorFechaHora, formatearFecha } from '@/lib/fechas';

const FILTROS = [
  { id: 'proximas', label: 'Próximas' },
  { id: 'todas', label: 'Todas' },
  { id: 'canceladas', label: 'Canceladas' },
];

export default function Agenda() {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtro, setFiltro] = useState('proximas');
  const [citaACancelar, setCitaACancelar] = useState(null);
  const [cancelando, setCancelando] = useState(false);
  const { showToast } = useToast();

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/api/citas');
      setCitas(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(cargar, 0);
    return () => clearTimeout(id);
  }, [cargar]);

  const cancelarCita = async () => {
    if (!citaACancelar) return;
    setCancelando(true);
    try {
      await apiFetch(`/api/citas/${citaACancelar.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ estado: 'cancelada' }),
      });
      showToast('Sesión cancelada', 'success');
      setCitaACancelar(null);
      await cargar();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setCancelando(false);
    }
  };

  const citasFiltradas = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    return citas.filter((cita) => {
      if (filtro === 'canceladas') return cita.estado === 'cancelada';
      if (filtro === 'todas') return true;

      if (cita.estado === 'cancelada') return false;
      if (!cita.fecha) return false;
      return new Date(`${cita.fecha}T00:00:00`) >= hoy;
    });
  }, [citas, filtro]);

  return (
    <div className="min-h-screen bg-black text-white">
      <Sidebar />

      <main className="lg:ml-64 pt-20 lg:pt-0 p-4 sm:p-6 lg:p-10 min-w-0">
        <header className="mb-8 flex flex-wrap gap-4 justify-between items-end">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black italic uppercase tracking-tighter leading-none">
              Próximas Sesiones
            </h1>
            <p className="text-red-600 text-[10px] font-black uppercase tracking-[0.4em] mt-3">
              Control de Citas y Estados
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cargar}
              aria-label="Actualizar agenda"
              className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <Link
              href="/nueva-sesion"
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
            >
              <CalendarPlus size={16} /> Nueva Sesión
            </Link>
          </div>
        </header>

        <div className="flex flex-wrap gap-2 mb-6">
          {FILTROS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setFiltro(id)}
              className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border transition-all ${
                filtro === id
                  ? 'bg-zinc-900 border-zinc-700 text-white'
                  : 'bg-transparent border-zinc-900 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-6 flex items-center justify-between gap-4 bg-red-950/30 border border-red-600/40 rounded-2xl p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-red-400">
              No se pudo cargar la agenda: {error}
            </p>
            <button
              type="button"
              onClick={cargar}
              className="text-[10px] font-black uppercase tracking-widest text-white bg-red-600 px-4 py-2 rounded-xl"
            >
              Reintentar
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            <p className="text-zinc-500 animate-pulse font-black uppercase text-xs tracking-widest">
              Cargando agenda...
            </p>
          ) : citasFiltradas.length > 0 ? (
            citasFiltradas.map((cita) => {
              const estadoTiempo = estadoPorFechaHora(cita.fecha, cita.hora);
              const cancelada = cita.estado === 'cancelada';

              return (
                <div
                  key={cita.id}
                  className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 sm:p-6 rounded-[1.75rem] sm:rounded-[2.5rem] border transition-all ${
                    cancelada
                      ? 'bg-zinc-950 border-zinc-900 opacity-50'
                      : 'bg-zinc-900/40 border-zinc-800 hover:border-red-600/20'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-4 sm:gap-6 min-w-0">
                    <div className="text-center min-w-[80px] sm:min-w-[100px]">
                      <div className="flex items-center justify-center gap-2 text-red-600 mb-1">
                        <Clock size={14} />
                        <span className="text-xl sm:text-2xl font-black italic tracking-tighter">
                          {cita.hora?.slice(0, 5) || '--:--'}
                        </span>
                      </div>
                      <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                        {formatearFecha(cita.fecha)}
                      </p>
                      {estadoTiempo === 'proxima' && !cancelada && (
                        <span className="inline-block mt-1 text-[7px] font-black bg-red-600 text-white px-1.5 py-0.5 rounded">
                          ¡YA LLEGA!
                        </span>
                      )}
                    </div>

                    <div className="hidden sm:block h-12 w-px bg-zinc-800"></div>

                    <div className="min-w-0">
                      <h3 className="text-lg sm:text-2xl font-black uppercase tracking-tighter leading-none mb-2 truncate">
                        {cita.cliente}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <span className="text-[9px] font-black uppercase tracking-widest text-red-600 italic">
                          {cita.estilo || 'Estilo libre'}
                        </span>
                        <span className="text-zinc-800 text-xs hidden sm:inline">|</span>
                        <div className="flex items-center gap-1 text-zinc-400">
                          <Package size={12} />
                          <span className="text-[9px] font-black uppercase tracking-widest">
                            {cita.kit_nombre || 'Sin Kit'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                    <div
                      className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 ${
                        cancelada
                          ? 'bg-zinc-800 text-zinc-500'
                          : 'bg-green-600/10 text-green-500 border border-green-600/20'
                      }`}
                    >
                      {cancelada ? <XCircle size={12} /> : <CheckCircle2 size={12} />}
                      {cita.estado}
                    </div>

                    {!cancelada && (
                      <button
                        type="button"
                        onClick={() => setCitaACancelar(cita)}
                        aria-label={`Cancelar sesión de ${cita.cliente}`}
                        className="p-3 rounded-2xl bg-zinc-800/50 text-zinc-500 hover:bg-red-600/10 hover:text-red-600 transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-16 sm:py-20 border-2 border-dashed border-zinc-900 rounded-[2rem] sm:rounded-[3rem] px-6">
              <p className="text-zinc-700 font-black uppercase tracking-[0.3em] text-xs">
                No hay citas {filtro === 'canceladas' ? 'canceladas' : 'registradas'}
              </p>
            </div>
          )}
        </div>
      </main>

      <Modal
        open={Boolean(citaACancelar)}
        onClose={() => setCitaACancelar(null)}
        title="Cancelar sesión"
        description={citaACancelar ? `${citaACancelar.cliente} · ${citaACancelar.fecha} ${citaACancelar.hora}` : ''}
      >
        <p className="text-sm text-zinc-400 mb-6">
          La cita quedará marcada como cancelada. El material descontado no se devuelve automáticamente.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => setCitaACancelar(null)}
            className="flex-1 py-3 rounded-xl bg-zinc-800 text-zinc-300 font-black text-[10px] uppercase tracking-widest hover:bg-zinc-700 transition-all"
          >
            Volver
          </button>
          <button
            type="button"
            onClick={cancelarCita}
            disabled={cancelando}
            className="flex-1 py-3 rounded-xl bg-red-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all disabled:opacity-50"
          >
            {cancelando ? 'Cancelando...' : 'Sí, cancelar'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
