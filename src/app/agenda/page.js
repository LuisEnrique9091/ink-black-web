"use client";
import { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Package, 
  XCircle, 
  CheckCircle2, 
  LayoutDashboard, 
  Box,
  Trash2
} from 'lucide-react';
import Link from 'next/link';

export default function Agenda() {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { 
    fetchCitas(); 
  }, []);

  async function fetchCitas() {
    setLoading(true);
    const { data, error } = await supabase
      .from('citas')
      .select('*')
      .order('fecha', { ascending: true });
    
    if (data) setCitas(data);
    setLoading(false);
  }

  const cancelarCita = async (id) => {
    const confirmar = confirm("¿Estás segura de que quieres cancelar esta sesión?");
    if (!confirmar) return;

    const { error } = await supabase
      .from('citas')
      .update({ estado: 'Cancelada' })
      .eq('id', id);
    
    if (!error) {
      fetchCitas(); // Refrescar la lista
    } else {
      alert("Error al cancelar: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex">
      
      {/* SIDEBAR */}
      <aside className="w-60 bg-zinc-950 border-r border-zinc-900 p-6 flex flex-col fixed h-full z-20">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="bg-red-600 w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm">IB</div>
          <h2 className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] italic">Ink Black</h2>
        </div>
        <nav className="space-y-1 flex-1">
          <Link href="/" className="flex items-center gap-3 p-3 rounded-xl text-zinc-500 hover:bg-zinc-900 hover:text-white font-bold text-xs transition-all">
            <LayoutDashboard size={16}/> Inicio
          </Link>
          <Link href="/agenda" className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900 text-white font-bold text-xs border border-zinc-800">
            <Calendar size={16} className="text-red-600"/> Agenda
          </Link>
          <Link href="/inventario" className="flex items-center gap-3 p-3 rounded-xl text-zinc-500 hover:bg-zinc-900 hover:text-white font-bold text-xs transition-all">
            <Box size={16}/> Inventario
          </Link>
        </nav>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 ml-60 p-12 bg-black">
        <header className="mb-10 flex justify-between items-center">
          <div>
            <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none">Próximas Sesiones</h1>
            <p className="text-red-600 text-[10px] font-black uppercase tracking-[0.4em] mt-3">Control de Citas y Estados</p>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            <p className="text-zinc-500 animate-pulse font-black uppercase text-xs tracking-widest">Cargando agenda...</p>
          ) : citas.length > 0 ? (
            citas.map((cita) => (
              <div 
                key={cita.id} 
                className={`flex items-center justify-between p-6 rounded-[2.5rem] border transition-all ${
                  cita.estado === 'Cancelada' 
                  ? 'bg-zinc-950 border-zinc-900 opacity-40' 
                  : 'bg-zinc-900/40 border-zinc-800 hover:border-red-600/20'
                }`}
              >
                {/* INFO TIEMPO */}
                <div className="flex items-center gap-8">
                  <div className="text-center min-w-[100px]">
                    <div className="flex items-center justify-center gap-2 text-red-600 mb-1">
                      <Clock size={14} />
                      <span className="text-2xl font-black italic tracking-tighter">{cita.hora.slice(0, 5)}</span>
                    </div>
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{cita.fecha}</p>
                  </div>

                  <div className="h-12 w-[1px] bg-zinc-800"></div>

                  {/* INFO CLIENTE */}
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter leading-none mb-1">
                      {cita.cliente}
                    </h3>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-black uppercase tracking-widest text-red-600 italic">
                        {cita.estilo || 'Estilo libre'}
                      </span>
                      <span className="text-zinc-800 text-xs">|</span>
                      <div className="flex items-center gap-1 text-zinc-400">
                        <Package size={12} />
                        <span className="text-[9px] font-black uppercase tracking-widest">{cita.kit_nombre || 'Sin Kit'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ACCIONES Y ESTADO */}
                <div className="flex items-center gap-4">
                  <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] ${
                    cita.estado === 'Cancelada' ? 'bg-zinc-800 text-zinc-500' : 'bg-green-600/10 text-green-500 border border-green-600/20'
                  }`}>
                    {cita.estado}
                  </div>

                  {cita.estado !== 'Cancelada' && (
                    <button 
                      onClick={() => cancelarCita(cita.id)}
                      className="p-4 rounded-2xl bg-zinc-800/50 text-zinc-500 hover:bg-red-600/10 hover:text-red-600 transition-all group"
                      title="Cancelar Cita"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 border-2 border-dashed border-zinc-900 rounded-[3rem]">
              <p className="text-zinc-700 font-black uppercase tracking-[0.3em]">No hay citas registradas</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}