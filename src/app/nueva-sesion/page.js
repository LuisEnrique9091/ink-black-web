"use client";
import { useState, useEffect } from 'react';

import { useRouter } from 'next/navigation';
import { Zap, LayoutDashboard, Calendar, Box } from 'lucide-react';
import Link from 'next/link';

export default function NuevaSesion() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [productos, setProductos] = useState([]);
  
  const kitsDisponibles = ['Kit Estándar', 'Kit Micro', 'Kit Realismo'];

  const [form, setForm] = useState({
    cliente: '',
    estilo: '',
    fecha: '',
    hora: '',
    kit_nombre: 'Kit Estándar'
  });

  useEffect(() => {
    async function cargarInventario() {
      const { data } = await supabase.from('productos').select('*');
      if (data) setProductos(data);
    }
    cargarInventario();
  }, []);

  const handleRegistrar = async () => {
    // 1. Validaciones de campos vacíos
    if (!form.cliente || !form.fecha || !form.hora) {
      return alert("Por favor, completa Nombre, Fecha y Hora.");
    }

    setLoading(true);

    try {
      // 2. Obtener la receta del kit seleccionado
      const { data: receta, error: errReceta } = await supabase
        .from('kits_insumos')
        .select('*')
        .eq('nombre_kit', form.kit_nombre);

      if (errReceta) throw new Error("No se pudo cargar la receta del kit.");

      // 3. VALIDACIÓN DE STOCK: Revisar si hay suficiente material ANTES de agendar
      if (receta && receta.length > 0) {
        for (const item of receta) {
          const productoEnAlmacen = productos.find(p => p.nombre === item.insumo_nombre);
          
          // Si el producto no existe en inventario o el stock es menor a lo que pide el kit
          if (!productoEnAlmacen || productoEnAlmacen.stock_actual < item.cantidad_a_descontar) {
            alert(`🚫 STOCK INSUFICIENTE: No hay suficiente "${item.insumo_nombre}" para el ${form.kit_nombre}.`);
            setLoading(false);
            return; // Detiene la ejecución por completo
          }
        }
      }

      // 4. DESCONTAR MATERIAL (Solo llega aquí si la validación anterior pasó)
      if (receta && receta.length > 0) {
        for (const item of receta) {
          const productoEnAlmacen = productos.find(p => p.nombre === item.insumo_nombre);
          
          if (productoEnAlmacen) {
            // Math.max asegura que por seguridad nunca baje de 0
            const nuevoStock = Math.max(0, productoEnAlmacen.stock_actual - item.cantidad_a_descontar);
            
            const { error: errUpdate } = await supabase
              .from('productos')
              .update({ stock_actual: nuevoStock })
              .eq('id', productoEnAlmacen.id);
            
            if (errUpdate) console.error(`Error descontando ${item.insumo_nombre}`);
          }
        }
      }

      // 5. INSERTAR LA CITA
      const { error: errCita } = await supabase.from('citas').insert([
        { 
          cliente: form.cliente,
          estilo: form.estilo,
          fecha: form.fecha,
          hora: form.hora,
          artista: 'Alexandra',
          estado: 'Confirmada',
          kit_nombre: form.kit_nombre
        }
      ]);

      if (errCita) throw errCita;

      alert("¡Sesión agendada y material descontado con éxito! 💉✨");
      router.push('/agenda');

    } catch (err) {
      console.error(err);
      alert("Hubo un error en el registro: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex overflow-hidden font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-60 bg-zinc-950 border-r border-zinc-900 p-6 flex flex-col fixed h-full z-20">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="bg-red-600 w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shadow-lg shadow-red-900/40 text-white">IB</div>
          <h2 className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] italic">Ink Black</h2>
        </div>
        <nav className="space-y-1 flex-1">
          <Link href="/" className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-900 text-zinc-500 font-bold text-xs transition-all">
            <LayoutDashboard size={16} /> Inicio
          </Link>
          <Link href="/agenda" className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-900 text-zinc-500 font-bold text-xs transition-all">
            <Calendar size={16} /> Agenda
          </Link>
          <Link href="/inventario" className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-900 text-zinc-500 font-bold text-xs transition-all">
            <Box size={16} /> Inventario
          </Link>
        </nav>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 ml-60 p-12 bg-black overflow-y-auto">
        <header className="mb-10">
          <h1 className="text-5xl font-black italic uppercase tracking-tighter text-red-600 leading-none">Nueva Sesión</h1>
          <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em] mt-3 italic text-white">Registro de Consumo y Agendado Directo</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLUMNA IZQUIERDA: FORMULARIO */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-zinc-900/30 border border-zinc-800 p-8 rounded-[40px] space-y-5 shadow-2xl">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest px-1">Nombre del Cliente</label>
                <input 
                  type="text" 
                  placeholder="Nombre del cliente" 
                  className="w-full bg-black border border-zinc-800 p-4 rounded-2xl outline-none focus:border-red-600 font-bold text-lg transition-all text-white" 
                  value={form.cliente} 
                  onChange={e => setForm({...form, cliente: e.target.value})} 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest px-1">Estilo de Tatuaje</label>
                <input 
                  type="text" 
                  placeholder="Ej. Blackwork / Realismo" 
                  className="w-full bg-black border border-zinc-800 p-4 rounded-2xl outline-none focus:border-red-600 font-bold transition-all text-white" 
                  value={form.estilo} 
                  onChange={e => setForm({...form, estilo: e.target.value})} 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest px-1">Fecha de Sesión</label>
                  <input 
                    type="date" 
                    className="w-full bg-black border border-zinc-800 p-4 rounded-2xl text-xs font-bold text-zinc-400 outline-none" 
                    onChange={e => setForm({...form, fecha: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest px-1">Hora de Inicio</label>
                  <input 
                    type="time" 
                    className="w-full bg-black border border-zinc-800 p-4 rounded-2xl text-xs font-bold text-zinc-400 outline-none" 
                    onChange={e => setForm({...form, hora: e.target.value})} 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: KITS Y BOTÓN */}
          <div className="space-y-6">
            <div className="bg-zinc-900/30 border border-zinc-800 p-8 rounded-[40px] shadow-2xl">
              <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-6 block px-1">Seleccionar Kit de Trabajo</label>
              <div className="space-y-3">
                {kitsDisponibles.map(kit => (
                  <button 
                    key={kit} 
                    onClick={() => setForm({...form, kit_nombre: kit})} 
                    className={`w-full p-5 rounded-2xl border-2 transition-all text-left flex items-center justify-between group ${form.kit_nombre === kit ? 'border-red-600 bg-red-600/5' : 'border-zinc-800 bg-black hover:border-zinc-700'}`}
                  >
                    <div>
                      <p className={`font-black text-sm uppercase italic ${form.kit_nombre === kit ? 'text-white' : 'text-zinc-600'}`}>{kit}</p>
                      <p className="text-[8px] text-zinc-700 mt-0.5 font-bold uppercase tracking-widest">Insumos Automáticos</p>
                    </div>
                    {form.kit_nombre === kit && <Zap size={16} className="text-red-600 fill-red-600" />}
                  </button>
                ))}
              </div>

              <button 
                disabled={loading} 
                onClick={handleRegistrar} 
                className="w-full bg-red-600 text-white font-black py-6 rounded-[2rem] mt-10 uppercase text-[11px] tracking-[0.3em] hover:bg-red-700 transition-all shadow-xl shadow-red-900/20 active:scale-95 disabled:opacity-50"
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