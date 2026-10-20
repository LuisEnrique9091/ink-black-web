"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, Plus, Save, ShoppingCart, Package, Edit3, RefreshCw, Boxes } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Modal from '@/components/Modal';
import { useToast } from '@/components/Toast';
import { apiFetch } from '@/lib/apiClient';
import { diasHasta, formatearFechaCorta } from '@/lib/fechas';

const CATEGORIAS = ['Químicos', 'Agujas', 'Limpieza', 'Insumos'];

const NUEVO_PRODUCTO_VACIO = {
  nombre: '',
  stock_actual: 0,
  stock_minimo: 5,
  unidad_medida: 'unidades',
  fecha_caducidad: '',
  categoria: 'Insumos',
};

export default function Inventario() {
  const [productos, setProductos] = useState([]);
  const [filtroNombre, setFiltroNombre] = useState('');
  const [filtroCat, setFiltroCat] = useState('Todos');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  const [showModalCompra, setShowModalCompra] = useState(false);
  const [showModalNuevo, setShowModalNuevo] = useState(false);
  const [showModalEdit, setShowModalEdit] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [compra, setCompra] = useState({ id: '', cantidad: '', caducidad: '' });
  const [prodSeleccionado, setProdSeleccionado] = useState(null);
  const [nuevoProd, setNuevoProd] = useState(NUEVO_PRODUCTO_VACIO);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/api/productos');
      setProductos(data);
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

  // Permite abrir el modal de surtir desde el dashboard: /inventario?comprar=1
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('comprar') !== '1') return;
    const id = setTimeout(() => setShowModalCompra(true), 0);
    return () => clearTimeout(id);
  }, []);

  const getSemaforo = (actual, minimo) => {
    const stock = Number(actual) || 0;
    const min = Number(minimo) || 0;
    if (stock <= 0) return { label: 'AGOTADO', color: 'bg-red-600', text: 'text-red-500' };
    if (stock <= min) return { label: 'COMPRAR PRONTO', color: 'bg-yellow-500', text: 'text-yellow-500' };
    return { label: 'SUFICIENTE', color: 'bg-green-500', text: 'text-green-500' };
  };

  const estadoCaducidad = (fecha) => {
    const dias = diasHasta(fecha);
    if (dias === null) return null;
    if (dias < 0) return { label: 'CADUCADO', clase: 'text-red-500 border-red-600/40' };
    if (dias <= 15) return { label: `VENCE EN ${dias}D`, clase: 'text-yellow-500 border-yellow-600/40' };
    return null;
  };

  const agregarNuevoProducto = async () => {
    if (!nuevoProd.nombre.trim()) {
      showToast('El nombre es obligatorio', 'error');
      return;
    }

    setGuardando(true);
    try {
      await apiFetch('/api/productos', {
        method: 'POST',
        body: JSON.stringify({
          ...nuevoProd,
          stock_actual: Number(nuevoProd.stock_actual) || 0,
          stock_minimo: Number(nuevoProd.stock_minimo) || 0,
        }),
      });
      showToast('Insumo registrado correctamente', 'success');
      setShowModalNuevo(false);
      setNuevoProd(NUEVO_PRODUCTO_VACIO);
      await cargar();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  const actualizarFecha = async () => {
    if (!prodSeleccionado) return;
    setGuardando(true);
    try {
      await apiFetch(`/api/productos/${prodSeleccionado.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ fecha_caducidad: prodSeleccionado.fecha_caducidad || null }),
      });
      showToast('Fecha de caducidad actualizada', 'success');
      setShowModalEdit(false);
      await cargar();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  const registrarCompra = async () => {
    const cantidad = Number(compra.cantidad);
    if (!compra.id) {
      showToast('Selecciona un insumo', 'error');
      return;
    }
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      showToast('La cantidad debe ser mayor que cero', 'error');
      return;
    }

    setGuardando(true);
    try {
      await apiFetch(`/api/productos/${compra.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          cantidad,
          fecha_caducidad: compra.caducidad || undefined,
          motivo: 'Compra de insumo',
        }),
      });
      showToast('Stock actualizado correctamente', 'success');
      setShowModalCompra(false);
      setCompra({ id: '', cantidad: '', caducidad: '' });
      await cargar();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      const coincideNombre = (p.nombre || '').toLowerCase().includes(filtroNombre.toLowerCase());
      const coincideCat = filtroCat === 'Todos' || p.categoria === filtroCat;
      return coincideNombre && coincideCat;
    });
  }, [productos, filtroNombre, filtroCat]);

  const inputClass =
    'w-full bg-black border border-zinc-800 p-3 rounded-xl outline-none focus:border-red-600 text-white transition-colors';

  return (
    <div className="min-h-screen bg-black text-white">
      <Sidebar />

      <main className="lg:ml-64 pt-20 lg:pt-0 p-4 sm:p-6 lg:p-10 min-w-0">
        <header className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-5 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black italic tracking-tighter uppercase leading-none">
              Gestión de Almacén
            </h1>
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em] mt-2">
              Inventario Técnico de Insumos
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={cargar}
              aria-label="Actualizar inventario"
              className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              type="button"
              onClick={() => setShowModalNuevo(true)}
              className="flex items-center gap-2 bg-zinc-800 text-white px-4 py-3 rounded-xl font-black text-[10px] uppercase border border-zinc-700 hover:bg-zinc-700 transition-all"
            >
              <Plus size={16} /> Nuevo Insumo
            </button>
            <button
              type="button"
              onClick={() => setShowModalCompra(true)}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-3 rounded-xl font-black text-[10px] uppercase hover:bg-red-700 transition-all"
            >
              <ShoppingCart size={16} /> Surtir Stock
            </button>
          </div>
        </header>

        {/* BUSCADOR Y FILTRO */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={filtroNombre}
              className="w-full bg-zinc-900 border border-zinc-800 p-3 pl-10 rounded-xl outline-none focus:border-red-600 text-sm text-white"
              onChange={(e) => setFiltroNombre(e.target.value)}
            />
          </div>

          <select
            value={filtroCat}
            className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl outline-none text-sm font-bold text-zinc-300"
            onChange={(e) => setFiltroCat(e.target.value)}
          >
            <option value="Todos">Todas las categorías</option>
            {CATEGORIAS.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="mb-6 flex items-center justify-between gap-4 bg-red-950/30 border border-red-600/40 rounded-2xl p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-red-400">
              No se pudo cargar el inventario: {error}
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

        {loading ? (
          <p className="text-zinc-500 animate-pulse font-black uppercase text-xs tracking-widest">
            Cargando inventario...
          </p>
        ) : productosFiltrados.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-zinc-900 rounded-[2rem] px-6">
            <Boxes size={32} className="mx-auto text-zinc-800 mb-4" />
            <p className="text-zinc-700 font-black uppercase tracking-[0.3em] text-xs">
              {productos.length === 0 ? 'Aún no hay insumos registrados' : 'Sin resultados para tu búsqueda'}
            </p>
          </div>
        ) : (
          <>
            {/* TABLA (desktop) */}
            <div className="hidden md:block bg-zinc-900/20 border border-zinc-800 rounded-3xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-zinc-900/40 text-[10px] font-black uppercase text-zinc-500 tracking-widest border-b border-zinc-800">
                  <tr>
                    <th className="p-5">Producto / Categoría</th>
                    <th className="p-5 text-center">Estado</th>
                    <th className="p-5 text-right">Stock</th>
                    <th className="p-5 text-center">Vence</th>
                    <th className="p-5 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {productosFiltrados.map((p) => {
                    const semaforo = getSemaforo(p.stock_actual, p.stock_minimo);
                    const caducidad = estadoCaducidad(p.fecha_caducidad);

                    return (
                      <tr key={p.id} className="border-b border-zinc-800/30 hover:bg-white/[0.02]">
                        <td className="p-5">
                          <p className="font-bold text-zinc-300">{p.nombre}</p>
                          <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">
                            {p.categoria}
                          </p>
                        </td>
                        <td className="p-5">
                          <div className="flex flex-col items-center gap-1">
                            <div className={`w-3 h-3 rounded-full ${semaforo.color} animate-pulse`}></div>
                            <span className={`text-[8px] font-black ${semaforo.text}`}>{semaforo.label}</span>
                          </div>
                        </td>
                        <td className="p-5 text-right font-black italic text-xl">
                          {p.stock_actual}
                          <span className="text-[9px] text-zinc-600 not-italic ml-1">{p.unidad_medida}</span>
                        </td>
                        <td className="p-5 text-center">
                          <span className={`text-xs font-bold ${caducidad ? caducidad.clase : 'text-zinc-500'}`}>
                            {p.fecha_caducidad ? formatearFechaCorta(p.fecha_caducidad) : '---'}
                          </span>
                          {caducidad && (
                            <p className="text-[8px] font-black uppercase tracking-widest mt-1">{caducidad.label}</p>
                          )}
                        </td>
                        <td className="p-5 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setProdSeleccionado(p);
                              setShowModalEdit(true);
                            }}
                            aria-label={`Editar ${p.nombre}`}
                            className="p-2 hover:bg-white/10 rounded-lg text-zinc-500 hover:text-white transition-all"
                          >
                            <Edit3 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* TARJETAS (móvil) */}
            <div className="md:hidden space-y-3">
              {productosFiltrados.map((p) => {
                const semaforo = getSemaforo(p.stock_actual, p.stock_minimo);
                const caducidad = estadoCaducidad(p.fecha_caducidad);

                return (
                  <div key={p.id} className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-zinc-200 truncate">{p.nombre}</p>
                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">
                          {p.categoria}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setProdSeleccionado(p);
                          setShowModalEdit(true);
                        }}
                        aria-label={`Editar ${p.nombre}`}
                        className="p-2 bg-zinc-800/60 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-all shrink-0"
                      >
                        <Edit3 size={16} />
                      </button>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Stock</p>
                        <p className="font-black italic text-lg">{p.stock_actual}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Estado</p>
                        <div className="flex items-center justify-center gap-1.5 mt-1.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${semaforo.color}`}></span>
                          <span className={`text-[8px] font-black ${semaforo.text}`}>{semaforo.label}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Vence</p>
                        <p className={`text-xs font-bold mt-0.5 ${caducidad ? caducidad.clase : 'text-zinc-500'}`}>
                          {p.fecha_caducidad ? formatearFechaCorta(p.fecha_caducidad) : '---'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>

      {/* MODAL NUEVO INSUMO */}
      <Modal
        open={showModalNuevo}
        onClose={() => setShowModalNuevo(false)}
        title="Nuevo Insumo"
        description="Registrar material en el almacén"
      >
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Nombre"
            className={inputClass}
            value={nuevoProd.nombre}
            onChange={(e) => setNuevoProd({ ...nuevoProd, nombre: e.target.value })}
          />

          <select
            className={inputClass}
            value={nuevoProd.categoria}
            onChange={(e) => setNuevoProd({ ...nuevoProd, categoria: e.target.value })}
          >
            {CATEGORIAS.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1 block">
                Stock inicial
              </label>
              <input
                type="number"
                min="0"
                className={inputClass}
                value={nuevoProd.stock_actual}
                onChange={(e) => setNuevoProd({ ...nuevoProd, stock_actual: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1 block">
                Stock mínimo
              </label>
              <input
                type="number"
                min="0"
                className={inputClass}
                value={nuevoProd.stock_minimo}
                onChange={(e) => setNuevoProd({ ...nuevoProd, stock_minimo: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1 block">
              Fecha de caducidad (opcional)
            </label>
            <input
              type="date"
              className={`${inputClass} text-xs font-bold text-zinc-400`}
              value={nuevoProd.fecha_caducidad}
              onChange={(e) => setNuevoProd({ ...nuevoProd, fecha_caducidad: e.target.value })}
            />
          </div>

          <button
            type="button"
            onClick={agregarNuevoProducto}
            disabled={guardando}
            className="w-full bg-red-600 text-white font-black py-4 rounded-xl mt-2 uppercase text-[10px] tracking-widest hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Package size={16} /> {guardando ? 'Guardando...' : 'Registrar en Almacén'}
          </button>
        </div>
      </Modal>

      {/* MODAL EDITAR FECHA */}
      <Modal
        open={showModalEdit && Boolean(prodSeleccionado)}
        onClose={() => setShowModalEdit(false)}
        title="Editar Fecha"
        description={prodSeleccionado?.nombre}
        maxWidth="max-w-sm"
      >
        <div className="space-y-4">
          <input
            type="date"
            className={`${inputClass} font-bold`}
            value={prodSeleccionado?.fecha_caducidad || ''}
            onChange={(e) =>
              setProdSeleccionado({ ...prodSeleccionado, fecha_caducidad: e.target.value })
            }
          />
          <button
            type="button"
            onClick={actualizarFecha}
            disabled={guardando}
            className="w-full bg-white text-black font-black py-4 rounded-xl uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all disabled:opacity-50"
          >
            <Save size={16} /> {guardando ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </Modal>

      {/* MODAL SURTIR */}
      <Modal
        open={showModalCompra}
        onClose={() => setShowModalCompra(false)}
        title="Surtir Almacén"
        description="Sumar insumos al stock actual"
      >
        <div className="space-y-3">
          <select
            className={inputClass}
            value={compra.id}
            onChange={(e) => setCompra({ ...compra, id: e.target.value })}
          >
            <option value="">Seleccionar insumo...</option>
            {productos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1 block">
                Cantidad
              </label>
              <input
                type="number"
                min="1"
                placeholder="0"
                className={inputClass}
                value={compra.cantidad}
                onChange={(e) => setCompra({ ...compra, cantidad: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1 block">
                Nueva caducidad
              </label>
              <input
                type="date"
                className={`${inputClass} text-xs font-bold text-zinc-400`}
                value={compra.caducidad}
                onChange={(e) => setCompra({ ...compra, caducidad: e.target.value })}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={registrarCompra}
            disabled={guardando}
            className="w-full bg-white text-black font-black py-4 rounded-xl mt-2 uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all disabled:opacity-50"
          >
            <Save size={16} /> {guardando ? 'Guardando...' : 'Guardar Stock'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
