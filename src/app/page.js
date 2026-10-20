"use client";

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  AlertCircle,
  Zap,
  PlusCircle,
  Clock,
  ChevronRight,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { apiFetch } from '@/lib/apiClient';
import { estadoPorFechaHora, fechaLocalISO, formatearFechaCorta } from '@/lib/fechas';

const ETIQUETAS_ALERTA = {
  caducado: '¡PRODUCTO CADUCADO!',
  agotado: '¡PRODUCTO AGOTADO!',
  caduca: '¡PRÓXIMO A CADUCAR!',
  bajo: '¡STOCK CRÍTICO!',
};

export default function Dashboard() {
  const [alertas, setAlertas] = useState([]);
  const [citasHoy, setCitasHoy] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [alertasData, citasData] = await Promise.all([
        apiFetch('/api/alertas'),
        apiFetch(`/api/citas?fecha=${fechaLocalISO()}`),
      ]);
      setAlertas(alertasData);
      setCitasHoy(citasData);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(cargar, 0);
    return () => clearTimeout(id);
  }, [cargar]);

  const citasActivas = citasHoy.filter((c) => c.estado !== 'cancelada');

  return (
    <div className="min-h-screen bg-black text-white flex font-sans">
      <Sidebar />

      <main className="flex-1 lg:ml-64 pt-20 lg:pt-0 p-4 sm:p-6 lg:p-10 bg-black min-w-0">
        <header className="mb-8 flex flex-wrap gap-4 justify-between items-center">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black italic tracking-tighter uppercase leading-none text-white">
              Dashboard
            </h1>
            <p className="text-zinc-600 font-black uppercase text-[9px] tracking-[0.3em] mt-1 italic">
              Estudio InkBlack
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cargar}
              aria-label="Actualizar datos"
              className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              <RefreshCw size={14} className={cargando ? 'animate-spin' : ''} />
            </button>
            <div className="flex items-center gap-2 bg-zinc-900/50 px-3 py-1.5 rounded-full border border-zinc-800">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-[9px] font-black text-zinc-500 uppercase italic">Online</span>
            </div>
          </div>
        </header>

        {error && (
          <div className="mb-6 flex items-center justify-between gap-4 bg-red-950/30 border border-red-600/40 rounded-2xl p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-red-400">
              No se pudieron cargar los datos: {error}
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

        {/* ACCESOS RÁPIDOS */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          <Link
            href="/nueva-sesion"
            className="group bg-red-600 hover:bg-red-700 p-6 rounded-3xl flex items-center justify-between transition-all shadow-xl shadow-red-900/10"
          >
            <div>
              <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">
                Nueva Sesión
              </h3>
              <p className="text-red-200 text-[8px] font-black uppercase tracking-widest">
                Descontar material ahora
              </p>
            </div>
            <Zap size={24} className="text-white fill-white group-hover:scale-110 transition-transform" />
          </Link>

          <Link
            href="/inventario?comprar=1"
            className="group bg-zinc-100 hover:bg-white p-6 rounded-3xl flex items-center justify-between transition-all shadow-xl"
          >
            <div>
              <h3 className="text-xl font-black italic text-black uppercase tracking-tighter">
                Registrar Compra
              </h3>
              <p className="text-zinc-500 text-[8px] font-black uppercase tracking-widest">
                Sumar insumos al stock
              </p>
            </div>
            <PlusCircle size={24} className="text-black group-hover:rotate-90 transition-transform" />
          </Link>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ALERTAS */}
          <section className="min-w-0">
            <h2 className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.4em] flex items-center gap-2 mb-4">
              <AlertCircle size={12} className="text-red-600" /> Alertas de Pánico
              {alertas.length > 0 && (
                <span className="ml-auto bg-red-600 text-white px-2 py-0.5 rounded text-[8px] italic font-black">
                  {alertas.length}
                </span>
              )}
            </h2>

            <div className="space-y-2">
              {cargando ? (
                <p className="text-zinc-700 animate-pulse font-bold text-[10px] uppercase">
                  Sincronizando...
                </p>
              ) : alertas.length > 0 ? (
                alertas.map((item) => {
                  const esCaducidad = item.tipo === 'caduca' || item.tipo === 'caducado';
                  return (
                    <div
                      key={item.id}
                      className={`border p-4 rounded-2xl flex items-center justify-between gap-3 transition-all ${
                        esCaducidad || item.tipo === 'agotado'
                          ? 'bg-red-950/20 border-red-600/60'
                          : 'bg-zinc-900/40 border-zinc-800'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-red-600 font-black uppercase text-[8px] tracking-widest mb-0.5 italic flex items-center gap-2">
                          {esCaducidad && <Clock size={10} />}
                          {ETIQUETAS_ALERTA[item.tipo] || 'REVISAR STOCK'}
                        </p>
                        <p className="text-zinc-200 font-bold text-sm tracking-tight break-words">
                          {esCaducidad ? (
                            <>
                              <span className="text-white uppercase font-black">{item.nombre}</span> vence el{' '}
                              {formatearFechaCorta(item.fecha_caducidad)}
                            </>
                          ) : (
                            <>
                              Quedan <span className="text-white font-black">{item.stock_actual}</span> en{' '}
                              <span className="text-white uppercase text-xs font-black">{item.nombre}</span>
                            </>
                          )}
                        </p>
                      </div>
                      <AlertCircle size={16} className="text-red-600 shrink-0" />
                    </div>
                  );
                })
              ) : (
                <div className="p-8 border border-dashed border-zinc-900 rounded-3xl text-center">
                  <p className="text-zinc-700 font-black text-[9px] uppercase tracking-widest">
                    Todo bajo control
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* AGENDA HOY */}
          <section className="min-w-0">
            <h2 className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.4em] flex justify-between items-center mb-4">
              <span className="flex items-center gap-2">
                <Calendar size={12} /> Agenda Hoy
              </span>
              <span className="bg-zinc-900 px-2 py-0.5 rounded text-[8px] text-white italic font-black">
                {citasActivas.length} ACTIVAS
              </span>
            </h2>

            <div className="bg-zinc-900/30 border border-zinc-800 rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden backdrop-blur-sm min-h-[300px] flex flex-col">
              {cargando ? (
                <div className="flex-1 flex items-center justify-center p-8">
                  <p className="text-zinc-700 animate-pulse font-bold text-[10px] uppercase">Cargando...</p>
                </div>
              ) : citasHoy.length > 0 ? (
                <div className="flex-1">
                  {citasHoy.map((cita) => {
                    const estadoTiempo = estadoPorFechaHora(cita.fecha, cita.hora);
                    const esCancelada = cita.estado === 'cancelada';

                    return (
                      <div
                        key={cita.id}
                        className={`p-4 sm:p-5 flex items-center justify-between gap-3 hover:bg-zinc-800/40 transition-all border-b border-zinc-800/50 last:border-0 group ${
                          esCancelada
                            ? 'opacity-40'
                            : estadoTiempo === 'pasada'
                              ? 'opacity-60'
                              : ''
                        }`}
                      >
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                          <div
                            className={`shrink-0 w-12 h-12 rounded-2xl flex flex-col items-center justify-center shadow-lg ${
                              esCancelada
                                ? 'bg-zinc-800'
                                : estadoTiempo === 'proxima'
                                  ? 'bg-red-600 text-white'
                                  : 'bg-zinc-800 group-hover:bg-zinc-700'
                            }`}
                          >
                            <span className="text-[10px] font-black leading-none">
                              {cita.hora?.slice(0, 5) || '--:--'}
                            </span>
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-black text-sm uppercase tracking-tighter group-hover:text-red-500 transition-colors text-white truncate">
                                {cita.cliente}
                              </h4>

                              {esCancelada ? (
                                <span className="bg-red-600/10 text-red-500 text-[7px] font-black px-1.5 py-0.5 rounded border border-red-600/20 flex items-center gap-1">
                                  <XCircle size={8} /> CANCELADA
                                </span>
                              ) : estadoTiempo === 'proxima' ? (
                                <span className="bg-red-600 text-white text-[7px] font-black px-1.5 py-0.5 rounded flex items-center gap-1">
                                  <Clock size={8} /> ¡YA LLEGA!
                                </span>
                              ) : (
                                <span className="bg-green-600/10 text-green-500 text-[7px] font-black px-1.5 py-0.5 rounded border border-green-600/20 flex items-center gap-1">
                                  <CheckCircle2 size={8} /> CONFIRMADA
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-[8px] font-black uppercase tracking-widest">
                              <p className="text-zinc-500 truncate">{cita.estilo || 'Estilo Libre'}</p>
                              <span className="text-zinc-800">•</span>
                              <p className="text-red-600 italic truncate">{cita.kit_nombre || 'Sin kit'}</p>
                            </div>
                          </div>
                        </div>

                        <ChevronRight size={16} className="text-zinc-800 group-hover:text-white transition-all shrink-0" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-zinc-700 font-black text-[9px] uppercase tracking-widest italic">
                  <Clock size={32} className="text-zinc-900 mb-4" />
                  Sin sesiones hoy
                </div>
              )}

              <Link
                href="/agenda"
                className="block w-full p-4 text-[8px] font-black text-zinc-500 hover:text-white text-center uppercase tracking-[0.4em] transition-all bg-black/40 border-t border-zinc-800 group"
              >
                Ver Agenda Completa{' '}
                <ArrowUpRight
                  size={10}
                  className="inline ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                />
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
