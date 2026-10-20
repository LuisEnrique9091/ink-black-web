"use client";
import { useState, useEffect } from 'react';

import { 
  Search, ChevronLeft, Plus, X, Save, ShoppingCart, Clock, 
  Package, LogOut, Edit3, Filter, 
  LayoutDashboard, Calendar // <--- ESTOS DOS FALTABAN
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Inventario() {
  const [productos, setProductos] = useState([]);
  const [filtroNombre, setFiltroNombre] = useState('');
  const [filtroCat, setFiltroCat] = useState('Todos');
  const router = useRouter();
  
  const [showModalCompra, setShowModalCompra] = useState(false);
  const [showModalNuevo, setShowModalNuevo] = useState(false);
  const [showModalEdit, setShowModalEdit] = useState(false);

  const [compra, setCompra] = useState({ id: '', cantidad: 0, caducidad: '' });
  const [prodSeleccionado, setProdSeleccionado] = useState(null);
  const [nuevoProd, setNuevoProd] = useState({ 
    nombre: '', stock_actual: 0, stock_minimo: 5, unidad_medida: 'unidades', fecha_caducidad: '', categoria: 'Insumos' 
  });

  useEffect(() => { fetchProductos(); }, []);

  async function fetchProductos() {
    const { data } = await supabase.from('productos').select('*').order('nombre', { ascending: true });
    if (data) setProductos(data);
  }

  // LÓGICA DEL SEMÁFORO
  const getSemaforo = (actual, minimo) => {
    if (actual <= 0) return { label: 'AGOTADO', color: 'bg-red-600', text: 'text-red-500' };
    if (actual <= minimo) return { label: 'COMPRAR PRONTO', color: 'bg-yellow-500', text: 'text-yellow-500' };
    return { label: 'SUFICIENTE', color: 'bg-green-500', text: 'text-green-500' };
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const agregarNuevoProducto = async () => {
    if (!nuevoProd.nombre) return alert("El nombre es obligatorio");
    try {
      const { error } = await supabase.from('productos').insert([{ 
        ...nuevoProd, 
        stock_actual: Number(nuevoProd.stock_actual),
        stock_minimo: Number(nuevoProd.stock_minimo)
      }]);
      if (error) throw error;
      alert("¡Insumo registrado! ");
      setShowModalNuevo(false);
      setNuevoProd({ nombre: '', stock_actual: 0, stock_minimo: 5, unidad_medida: 'unidades', fecha_caducidad: '', categoria: 'Insumos' });
      fetchProductos();
    } catch (err) { alert("Error: " + err.message); }
  };

  const actualizarFecha = async () => {
    try {
      const { error } = await supabase.from('productos')
        .update({ fecha_caducidad: prodSeleccionado.fecha_caducidad })
        .eq('id', prodSeleccionado.id);
      if (error) throw error;
      alert("Fecha actualizada ✅");
      setShowModalEdit(false);
      fetchProductos();
    } catch (err) { alert(err.message); }
  };

  const registrarCompra = async () => {
    const prodOriginal = productos.find(p => String(p.id) === String(compra.id));
    if (!prodOriginal) return alert("Selecciona un producto.");

    try {
      const nuevoStock = Number(prodOriginal.stock_actual) + Number(compra.cantidad);
      const { error } = await supabase.from('productos').update({ 
        stock_actual: nuevoStock,
        fecha_caducidad: compra.caducidad || prodOriginal.fecha_caducidad
      }).eq('id', compra.id);

      if (error) throw error;
      alert("¡Stock actualizado! ✅");
      setShowModalCompra(false);
      setCompra({ id: '', cantidad: 0, caducidad: '' });
      fetchProductos();
    } catch (err) { alert("Error: " + err.message); }
  };

  // FILTRADO DINÁMICO
  const productosFiltrados = productos.filter(p => {
    const coincideNombre = p.nombre.toLowerCase().includes(filtroNombre.toLowerCase());
    const coincideCat = filtroCat === 'Todos' || p.categoria === filtroCat;
    return coincideNombre && coincideCat;
  });

  return (
    <div className="min-h-screen bg-black text-white flex">
      
      {/* SIDEBAR CORREGIDO */}
<aside className="w-60 bg-zinc-950 border-r border-zinc-900 p-6 flex flex-col fixed h-full z-20">
  <div className="flex items-center gap-3 mb-10 px-2">
    <div className="bg-red-600 w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shadow-lg shadow-red-900/40 text-white">IB</div>
    <h2 className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] italic text-white">INK BLACK</h2>
  </div>
  
  <nav className="space-y-1 flex-1">
    <Link href="/" className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-900 text-zinc-500 font-bold text-xs transition-all">
      <LayoutDashboard size={16} /> Inicio
    </Link>
    <Link href="/agenda" className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-900 text-zinc-500 font-bold hover:text-zinc-200 text-xs transition-all">
      <Calendar size={16} /> Agenda
    </Link>
    {/* Aquí el botón activo de Inventario con el icono Package */}
    <Link href="/inventario" className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900 text-white font-bold text-xs border border-zinc-800 transition-all">
      <Package size={16} className="text-red-600" /> Inventario
    </Link>
  </nav>

  <button onClick={handleLogout} className="flex items-center gap-3 p-3 text-zinc-600 hover:text-red-500 font-black uppercase text-[9px] tracking-widest transition-all border-t border-zinc-900 pt-6">
    <LogOut size={14} /> Cerrar Sesión
  </button>
</aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 ml-64 p-10">
        <header className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Gestión de Almacén</h1>
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em] mt-2">Inventario Técnico de Insumos</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowModalNuevo(true)} className="bg-zinc-800 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase border border-zinc-700 hover:bg-zinc-700 transition-all">
              <Plus size={16} /> Nuevo Insumo
            </button>
            <button onClick={() => setShowModalCompra(true)} className="bg-red-600 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase hover:bg-red-700 transition-all">
              <ShoppingCart size={16} /> Surtir Stock
            </button>
          </div>
        </header>

        {/* BUSCADOR Y FILTRO */}
        <div className="flex gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={16}/>
            <input 
              type="text" placeholder="Buscar por nombre..." 
              className="w-full bg-zinc-900 border border-zinc-800 p-3 pl-10 rounded-xl outline-none focus:border-red-600 text-sm"
              onChange={(e) => setFiltroNombre(e.target.value)}
            />
          </div>
          <select 
            className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl outline-none text-sm font-bold text-zinc-400"
            onChange={(e) => setFiltroCat(e.target.value)}
          >
            <option value="Todos">Categorías</option>
            <option value="Químicos">Químicos</option>
            <option value="Agujas">Agujas</option>
            <option value="Limpieza">Limpieza</option>
            <option value="Insumos">Insumos</option>
          </select>
        </div>

        {/* TABLA CON SEMÁFORO */}
        <div className="bg-zinc-900/20 border border-zinc-800 rounded-3xl overflow-hidden backdrop-blur-sm">
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
              {productosFiltrados.map((p, idx) => {
                const semaforo = getSemaforo(p.stock_actual, p.stock_minimo);
                return (
                  <tr key={p.id || idx} className="border-b border-zinc-800/30 hover:bg-white/[0.01]">
                    <td className="p-5">
                      <p className="font-bold text-zinc-300">{p.nombre}</p>
                      <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{p.categoria}</p>
                    </td>
                    <td className="p-5">
                      <div className="flex flex-col items-center gap-1">
                        <div className={`w-3 h-3 rounded-full ${semaforo.color} shadow-lg shadow-current/20 animate-pulse`}></div>
                        <span className={`text-[8px] font-black ${semaforo.text}`}>{semaforo.label}</span>
                      </div>
                    </td>
                    <td className="p-5 text-right font-black italic text-xl">{p.stock_actual}</td>
                    <td className="p-5 text-zinc-500 text-xs font-bold text-center">{p.fecha_caducidad || '---'}</td>
                    <td className="p-5 text-center">
                      <button onClick={() => { setProdSeleccionado(p); setShowModalEdit(true); }} className="p-2 hover:bg-white/10 rounded-lg text-zinc-500 hover:text-white transition-all">
                        <Edit3 size={16}/>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>

      {/* MODAL NUEVO (CATEGORÍA AÑADIDA) */}
      {showModalNuevo && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl w-full max-w-md relative">
            <button onClick={() => setShowModalNuevo(false)} className="absolute top-6 right-6 text-zinc-500 hover:text-white"><X size={20} /></button>
            <h2 className="text-xl font-black italic uppercase mb-6">Nuevo Insumo</h2>
            <div className="space-y-4">
              <input type="text" placeholder="Nombre" className="w-full bg-black border border-zinc-800 p-3 rounded-xl outline-none font-bold" value={nuevoProd.nombre} onChange={e => setNuevoProd({...nuevoProd, nombre: e.target.value})} />
              <select className="w-full bg-black border border-zinc-800 p-3 rounded-xl font-bold text-zinc-400" value={nuevoProd.categoria} onChange={e => setNuevoProd({...nuevoProd, categoria: e.target.value})}>
                <option value="Insumos">Insumos</option>
                <option value="Químicos">Químicos</option>
                <option value="Agujas">Agujas</option>
                <option value="Limpieza">Limpieza</option>
              </select>
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="Stock Inicial" className="w-full bg-black border border-zinc-800 p-3 rounded-xl outline-none font-bold" onChange={e => setNuevoProd({...nuevoProd, stock_actual: e.target.value})} />
                <input type="number" placeholder="Stock Mínimo" className="w-full bg-black border border-zinc-800 p-3 rounded-xl outline-none font-bold" value={nuevoProd.stock_minimo} onChange={e => setNuevoProd({...nuevoProd, stock_minimo: e.target.value})} />
              </div>
              <input type="date" className="w-full bg-black border border-zinc-800 p-3 rounded-xl text-xs font-bold text-zinc-400" onChange={e => setNuevoProd({...nuevoProd, fecha_caducidad: e.target.value})} />
              <button onClick={agregarNuevoProducto} className="w-full bg-red-600 text-white font-black py-4 rounded-xl mt-2 uppercase text-[10px]">Registrar en Almacén</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR (EL LÁPIZ) */}
      {showModalEdit && prodSeleccionado && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl w-full max-w-sm relative">
            <button onClick={() => setShowModalEdit(false)} className="absolute top-6 right-6 text-zinc-500 hover:text-white"><X size={20}/></button>
            <h2 className="text-xl font-black italic uppercase mb-2">Editar Fecha</h2>
            <p className="text-zinc-600 text-[10px] font-black uppercase mb-6">{prodSeleccionado.nombre}</p>
            <div className="space-y-4">
              <input type="date" className="w-full bg-black border border-zinc-800 p-3 rounded-xl text-white font-bold" value={prodSeleccionado.fecha_caducidad || ''} onChange={(e) => setProdSeleccionado({...prodSeleccionado, fecha_caducidad: e.target.value})} />
              <button onClick={actualizarFecha} className="w-full bg-white text-black font-black py-4 rounded-xl mt-2 uppercase text-[10px] flex items-center justify-center gap-2"><Save size={16}/> Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SURTIR */}
      {showModalCompra && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl w-full max-w-md relative">
            <button onClick={() => setShowModalCompra(false)} className="absolute top-6 right-6 text-zinc-500 hover:text-white"><X size={20} /></button>
            <h2 className="text-xl font-black italic uppercase mb-6">Surtir Almacén</h2>
            <div className="space-y-4">
              <select className="w-full bg-black border border-zinc-800 p-3 rounded-xl outline-none font-bold" value={compra.id} onChange={e => setCompra({...compra, id: e.target.value})}>
                <option value="">Seleccionar insumo...</option>
                {productos.map((p, idx) => (<option key={p.id || `opt-${idx}`} value={p.id}>{p.nombre}</option>))}
              </select>
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="Cantidad" className="w-full bg-black border border-zinc-800 p-3 rounded-xl outline-none font-bold" onChange={e => setCompra({...compra, cantidad: e.target.value})} />
                <input type="date" className="w-full bg-black border border-zinc-800 p-3 rounded-xl text-xs font-bold text-zinc-400" onChange={e => setCompra({...compra, caducidad: e.target.value})} />
              </div>
              <button onClick={registrarCompra} className="w-full bg-white text-black font-black py-4 rounded-xl mt-2 uppercase text-[10px] flex items-center justify-center gap-2 shadow-lg"><Save size={16} /> Guardar Stock</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}