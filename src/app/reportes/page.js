"use client";

import { useCallback, useEffect, useState } from 'react';
import { Award, RefreshCw, AlertTriangle, Layers, TrendingDown, Boxes } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { apiFetch } from '@/lib/apiClient';

const ESTADO_INICIAL = {
  totalCitas: 0,
  citasCanceladas: 0,
  usoKits: {},
  topKit: { nombre: 'Sin datos', cantidad: 0 },
  saludInventario: 0,
  insumosNuevosMes: 0,
  totalInsumos: 0,
  consumoKits: [],
};

export default function Reportes() {
  const [stats, setStats] = useState(ESTADO_INICIAL);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/api/reportes');
      setStats({ ...ESTADO_INICIAL, ...data });
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

  const kits = Object.entries(stats.usoKits || {});
  const maxUso = Math.max(1, ...kits.map(([, cantidad]) => cantidad));

  return (
    <div className="min-h-screen bg-black text-white">
      <Sidebar />

      <main className="lg:ml-64 pt-20 lg:pt-0 p-4 sm:p-6 lg:p-10 min-w-0">
        <header className="mb-8 flex flex-wrap gap-4 justify-between items-end">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black italic uppercase tracking-tighter">
              Control de Flujo
            </h1>
            <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em] mt-2 italic">
              Análisis de Desgaste y Rotación de Material
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cargar}
              aria-label="Actualizar reportes"
              className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <div className="bg-zinc-900 border border-zinc-800 px-4 py-3 rounded-2xl text-right">
              <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">
                Insumos registrados (mes)
              </p>
              <h2 className="text-xl font-black italic text-white">{stats.insumosNuevosMes}</h2>
            </div>
          </div>
        </header>

        {error && (
          <div className="mb-6 flex items-center justify-between gap-4 bg-red-950/30 border border-red-600/40 rounded-2xl p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-red-400">
              No se pudieron cargar los reportes: {error}
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

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="bg-zinc-900/40 border border-zinc-800 p-5 sm:p-6 rounded-3xl flex items-center gap-4">
            <div className="bg-red-600/20 p-3 rounded-2xl shrink-0">
              <Award className="text-red-600" size={26} />
            </div>
            <div className="min-w-0">
              <p className="text-zinc-500 text-[8px] font-black uppercase tracking-widest">
                Kit de Mayor Uso
              </p>
              <h3 className="text-lg font-black italic uppercase truncate">{stats.topKit.nombre}</h3>
              <p className="text-[9px] text-zinc-600 font-bold">{stats.topKit.cantidad} sesiones</p>
            </div>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800 p-5 sm:p-6 rounded-3xl flex items-center gap-4">
            <div className="bg-yellow-600/20 p-3 rounded-2xl shrink-0">
              <AlertTriangle className="text-yellow-500" size={26} />
            </div>
            <div>
              <p className="text-zinc-500 text-[8px] font-black uppercase tracking-widest">
                Nivel de Abastecimiento
              </p>
              <h3 className="text-2xl font-black italic">{stats.saludInventario}%</h3>
              <p className="text-[9px] text-zinc-600 font-bold">de {stats.totalInsumos} insumos</p>
            </div>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800 p-5 sm:p-6 rounded-3xl flex items-center gap-4">
            <div className="bg-green-600/20 p-3 rounded-2xl shrink-0">
              <Layers className="text-green-500" size={26} />
            </div>
            <div>
              <p className="text-zinc-500 text-[8px] font-black uppercase tracking-widest">
                Servicios Concluidos
              </p>
              <h3 className="text-2xl font-black italic">{stats.totalCitas}</h3>
              <p className="text-[9px] text-zinc-600 font-bold">{stats.citasCanceladas} canceladas</p>
            </div>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800 p-5 sm:p-6 rounded-3xl flex items-center gap-4">
            <div className="bg-zinc-700/30 p-3 rounded-2xl shrink-0">
              <Boxes className="text-zinc-300" size={26} />
            </div>
            <div>
              <p className="text-zinc-500 text-[8px] font-black uppercase tracking-widest">
                Insumos en Almacén
              </p>
              <h3 className="text-2xl font-black italic">{stats.totalInsumos}</h3>
              <p className="text-[9px] text-zinc-600 font-bold">registrados</p>
            </div>
          </div>
        </div>

        <section className="bg-zinc-900/20 border border-zinc-800 p-5 sm:p-8 rounded-3xl mb-6">
          <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-6 italic">
            Frecuencia de Uso por Kit Operativo
          </h2>

          {loading ? (
            <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest animate-pulse">
              Calculando...
            </p>
          ) : kits.length === 0 ? (
            <p className="text-zinc-700 font-black text-[9px] uppercase tracking-widest">
              Aún no hay sesiones registradas
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {kits.map(([nombre, cantidad]) => (
                <div
                  key={nombre}
                  className="bg-black border border-zinc-900 p-5 rounded-2xl hover:border-red-600/50 transition-all"
                >
                  <p className="text-zinc-500 text-[8px] font-black uppercase mb-1 tracking-widest">Kit</p>
                  <h4 className="text-base font-black italic text-white uppercase truncate">{nombre}</h4>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-red-600 italic">{cantidad}</span>
                      <span className="text-[8px] text-zinc-600 font-bold uppercase">usos</span>
                    </div>
                    <div className="w-16 bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-red-600 h-full"
                        style={{ width: `${Math.round((cantidad / maxUso) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-zinc-900/20 border border-zinc-800 p-5 sm:p-8 rounded-3xl">
          <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-6 italic flex items-center gap-2">
            <TrendingDown size={14} /> Consumo Real de Insumos por Kit
          </h2>

          {loading ? (
            <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest animate-pulse">
              Calculando...
            </p>
          ) : stats.consumoKits.length === 0 ? (
            <p className="text-zinc-700 font-black text-[9px] uppercase tracking-widest">
              Sin movimientos de consumo registrados
            </p>
          ) : (
            <div className="space-y-3">
              {stats.consumoKits.map((item) => (
                <div key={item.kit} className="bg-black border border-zinc-900 rounded-2xl p-5">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <h4 className="font-black italic uppercase text-sm truncate">{item.kit}</h4>
                    <span className="text-[9px] font-black text-red-600 uppercase tracking-widest shrink-0">
                      {item.insumos} insumos
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(item.detalle).map(([insumo, cantidad]) => (
                      <span
                        key={insumo}
                        className="text-[9px] font-bold text-zinc-400 bg-zinc-900/60 border border-zinc-800 px-2 py-1 rounded-lg"
                      >
                        {insumo}: <span className="text-white">{cantidad}</span>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
