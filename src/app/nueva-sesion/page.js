"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Package, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { useToast } from '@/components/Toast';
import { apiFetch } from '@/lib/apiClient';
import { fechaLocalISO } from '@/lib/fechas';

export default function NuevaSesion() {
  const router = useRouter();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [cargandoKits, setCargandoKits] = useState(true);
  const [errorCarga, setErrorCarga] = useState(null);
  const [kits, setKits] = useState([]);

  const [form, setForm] = useState({
    cliente: '',
    estilo: '',
    fecha: '',
    hora: '',
    kit_nombre: '',
  });

  const cargarKits = useCallback(async () => {
    setCargandoKits(true);
    setErrorCarga(null);
    try {
      const data = await apiFetch('/api/kits');
      setKits(data);
      setForm((prev) => ({
        ...prev,
        kit_nombre: prev.kit_nombre || data[0]?.nombre || '',
      }));
    } catch (err) {
      setErrorCarga(err.message);
    } finally {
      setCargandoKits(false);
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(cargarKits, 0);
    return () => clearTimeout(id);
  }, [cargarKits]);

  const kitSeleccionado = useMemo(
    () => kits.find((k) => k.nombre === form.kit_nombre) || null,
    [kits, form.kit_nombre]
  );

  const handleRegistrar = async () => {
    if (!form.cliente.trim() || !form.fecha || !form.hora) {
      showToast('Completa el nombre, la fecha y la hora', 'error');
      return;
    }
    if (!form.kit_nombre) {
      showToast('Selecciona un kit de trabajo', 'error');
      return;
    }
    if (form.fecha < fechaLocalISO()) {
      showToast('No puedes agendar una sesión en el pasado', 'error');
      return;
    }

    setLoading(true);
    try {
      await apiFetch('/api/citas', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      showToast('Sesión agendada y material descontado', 'success');
      router.push('/agenda');
      router.refresh();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full bg-black border border-zinc-800 p-4 rounded-2xl outline-none focus:border-red-600 font-bold text-white transition-colors';

  return (
    <div className="min-h-screen bg-black text-white">
      <Sidebar />

      <main className="lg:ml-64 pt-20 lg:pt-0 p-4 sm:p-6 lg:p-10 min-w-0">
        <header className="mb-8 flex flex-wrap gap-4 justify-between items-end">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black italic uppercase tracking-tighter text-red-600 leading-none">
              Nueva Sesión
            </h1>
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em] mt-3 italic">
              Registro de Consumo y Agendado Directo
            </p>
          </div>

          <button
            type="button"
            onClick={cargarKits}
            aria-label="Actualizar kits"
            className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <RefreshCw size={16} className={cargandoKits ? 'animate-spin' : ''} />
          </button>
        </header>

        {errorCarga && (
          <div className="mb-6 flex items-center justify-between gap-4 bg-red-950/30 border border-red-600/40 rounded-2xl p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-red-400">
              No se pudieron cargar los kits: {errorCarga}
            </p>
            <button
              type="button"
              onClick={cargarKits}
              className="text-[10px] font-black uppercase tracking-widest text-white bg-red-600 px-4 py-2 rounded-xl"
            >
              Reintentar
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* FORMULARIO */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-zinc-900/30 border border-zinc-800 p-5 sm:p-8 rounded-3xl sm:rounded-[2.5rem] space-y-4 shadow-2xl">
              <div>
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest px-1 mb-2 block">
                  Nombre del Cliente
                </label>
                <input
                  type="text"
                  placeholder="Nombre del cliente"
                  className={`${inputClass} text-lg`}
                  value={form.cliente}
                  onChange={(e) => setForm({ ...form, cliente: e.target.value })}
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest px-1 mb-2 block">
                  Estilo de Tatuaje
                </label>
                <input
                  type="text"
                  placeholder="Ej. Blackwork / Realismo"
                  className={inputClass}
                  value={form.estilo}
                  onChange={(e) => setForm({ ...form, estilo: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest px-1 mb-2 block">
                    Fecha de Sesión
                  </label>
                  <input
                    type="date"
                    min={fechaLocalISO()}
                    className={`${inputClass} text-xs font-bold text-zinc-300`}
                    value={form.fecha}
                    onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest px-1 mb-2 block">
                    Hora de Inicio
                  </label>
                  <input
                    type="time"
                    className={`${inputClass} text-xs font-bold text-zinc-300`}
                    value={form.hora}
                    onChange={(e) => setForm({ ...form, hora: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* KITS */}
          <div className="space-y-4">
            <div className="bg-zinc-900/30 border border-zinc-800 p-5 sm:p-8 rounded-3xl sm:rounded-[2.5rem] shadow-2xl">
              <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-4 block px-1">
                Seleccionar Kit de Trabajo
              </label>

              {cargandoKits ? (
                <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest animate-pulse">
                  Cargando kits...
                </p>
              ) : kits.length === 0 ? (
                <div className="border border-dashed border-zinc-800 rounded-2xl p-6 text-center">
                  <Package size={24} className="mx-auto text-zinc-700 mb-3" />
                  <p className="text-zinc-600 text-[9px] font-black uppercase tracking-widest">
                    No hay kits configurados
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {kits.map((kit) => {
                    const activo = form.kit_nombre === kit.nombre;
                    return (
                      <button
                        key={kit.nombre}
                        type="button"
                        onClick={() => setForm({ ...form, kit_nombre: kit.nombre })}
                        className={`w-full p-4 rounded-2xl border-2 transition-all text-left flex items-center justify-between gap-3 ${
                          activo
                            ? 'border-red-600 bg-red-600/5'
                            : 'border-zinc-800 bg-black hover:border-zinc-700'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className={`font-black text-sm uppercase italic truncate ${activo ? 'text-white' : 'text-zinc-500'}`}>
                            {kit.nombre}
                          </p>
                          <p className={`text-[8px] mt-0.5 font-bold uppercase tracking-widest flex items-center gap-1 ${kit.disponible ? 'text-green-600' : 'text-yellow-600'}`}>
                            {kit.disponible ? <CheckCircle2 size={10} /> : <AlertTriangle size={10} />}
                            {kit.disponible ? 'Material disponible' : 'Material insuficiente'}
                          </p>
                        </div>
                        {activo && <Zap size={16} className="text-red-600 fill-red-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {kitSeleccionado && kitSeleccionado.insumos.length > 0 && (
                <div className="mt-5 pt-5 border-t border-zinc-800">
                  <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-2">
                    Material que se descontará
                  </p>
                  <ul className="space-y-1">
                    {kitSeleccionado.insumos.map((insumo) => {
                      const stock = insumo.producto?.stock_actual ?? 0;
                      const suficiente = stock >= insumo.cantidad_a_descontar;
                      return (
                        <li key={insumo.insumo_nombre} className="flex items-center justify-between gap-2 text-[10px]">
                          <span className="text-zinc-400 truncate">{insumo.insumo_nombre}</span>
                          <span className={`font-black shrink-0 ${suficiente ? 'text-zinc-300' : 'text-red-500'}`}>
                            {insumo.cantidad_a_descontar} / {stock}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              <button
                type="button"
                disabled={loading || kits.length === 0}
                onClick={handleRegistrar}
                className="w-full bg-red-600 text-white font-black py-5 rounded-2xl mt-6 uppercase text-[10px] tracking-[0.25em] hover:bg-red-700 transition-all shadow-xl shadow-red-900/20 disabled:opacity-50"
              >
                {loading ? 'Validando Stock...' : 'Finalizar y Agendar'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
