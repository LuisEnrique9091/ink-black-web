"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  Package, 
  AlertCircle, 
  Zap, 
  PlusCircle,
  Clock,
  ChevronRight,
  LogOut,
  LayoutDashboard,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  XCircle
} from 'lucide-react';

export default function Dashboard() {
  const [alertas, setAlertas] = useState([]);
  const [citasHoy, setCitasHoy] = useState([]);
  const [cargando, setCargando] = useState(true);
  const router = useRouter();

  // Lógica para determinar el estado de tiempo de la cita
  const getEstadoCita = (horaCita) => {
    if (!horaCita) return 'pendiente';
    const ahora = new Date();
    const [horas, minutos] = horaCita.split(':');
    const fechaCita = new Date();
    fechaCita.setHours(parseInt(horas), parseInt(minutos), 0);

    const diferenciaMs = fechaCita - ahora;
    const diferenciaMin = diferenciaMs / (1000 * 60);

    if (diferenciaMin < 0) return 'pasada';
    if (diferenciaMin <= 60) return 'proxima';
    return 'pendiente';
  };

  useEffect(() => {
    async function inicializarDashboard() {
      try {
        // TODO: Aquí irá la lógica para cargar datos desde MongoDB
        // Por ahora, simulamos que ya cargó para quitar el "Cargando..."
        console.log("Dashboard inicializado correctamente (sin Supabase)");
        
        // Simulamos un pequeño retraso para que se vea el efecto de carga
        setTimeout(() => {
          setCargando(false);
        }, 500);

      } catch (err) {
        console.error("Error en Dashboard:", err.message);
        setCargando(false);
      }
    }

    inicializarDashboard();
  }, [router]);

  const handleLogout = async () => {
    // TODO: Aquí deberías eliminar el token JWT del localStorage
    localStorage.removeItem('token');
    router.push('/login');
  };

  const conteoCitasReales = citasHoy.filter(c => c.estado?.toLowerCase() !== 'cancelada').length;

  return (
    <div className="min-h-screen bg-black text-white flex overflow-hidden font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-60 bg-zinc-950 border-r border-zinc-900 p-6 flex flex-col fixed h-full z-20">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="bg-red-600 w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shadow-lg shadow-red-900/40 text-white">IB</div>
          <h2 className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] italic text-white">INK BLACK</h2>
        </div>
        
        <nav className="space-y-1 flex-1">
          <Link href="/" className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900 text-white font-bold text-xs border border-zinc-800 transition-all">
            <LayoutDashboard size={16} className="text-red-600" /> Inicio
          </Link>
          <Link href="/agenda" className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-900 text-zinc-500 font-bold hover:text-zinc-200 text-xs transition-all">
            <Calendar size={16} /> Agenda
          </Link>
          <Link href="/inventario" className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-900 text-zinc-500 font-bold hover:text-zinc-200 text-xs transition-all">
            <Package size={16} /> Inventario
          </Link>
          <Link href="/reportes" className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-900 text-zinc-500 font-bold hover:text-zinc-200 text-xs transition-all group">
            <BarChart3 size={16} className="group-hover:text-red-600 transition-colors" /> 
            Reportes
          </Link>
        </nav>

        <button onClick={handleLogout} className="flex items-center gap-3 p-3 text-zinc-600 hover:text-red-500 font-black uppercase text-[9px] tracking-widest transition-all border-t border-zinc-900 pt-6">
          <LogOut size={14} /> Cerrar Sesión
        </button>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 ml-60 p-8 bg-black overflow-y-auto">
        
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none text-white">DASHBOARD</h1>
            <p className="text-zinc-600 font-black uppercase text-[9px] tracking-[0.3em] mt-1 italic">Estudio InkBlack</p>
          </div>
          <div className="flex items-center gap-2 bg-zinc-900/50 px-3 py-1.5 rounded-full border border-zinc-800">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-[9px] font-black text-zinc-500 uppercase italic">Online</span>
          </div>
        </header>

        {/* ACCESOS RÁPIDOS */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          <Link href="/nueva-sesion" className="group bg-red-600 hover:bg-red-700 p-6 rounded-3xl flex items-center justify-between transition-all shadow-xl shadow-red-900/10">
            <div>
              <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">Nueva Sesión</h3>
              <p className="text-red-200 text-[8px] font-black uppercase tracking-widest">Descontar material ahora</p>
            </div>
            <Zap size={24} className="text-white fill-white group-hover:scale-110 transition-transform" />
          </Link>

          <Link href="/inventario" className="group bg-zinc-100 hover:bg-white p-6 rounded-3xl flex items-center justify-between transition-all shadow-xl">
            <div>
              <h3 className="text-xl font-black italic text-black uppercase tracking-tighter">Registrar Compra</h3>
              <p className="text-zinc-500 text-[8px] font-black uppercase tracking-widest">Sumar insumos al stock</p>
            </div>
            <PlusCircle size={24} className="text-black group-hover:rotate-90 transition-transform" />
          </Link>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* SECCIÓN ALERTAS */}
          <section>
            <h2 className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.4em] flex items-center gap-2 mb-4">
              <AlertCircle size={12} className="text-red-600" /> Alertas de Pánico
            </h2>
            <div className="space-y-2">
              {cargando ? (
                <p className="text-zinc-700 animate-pulse font-bold text-[10px] uppercase">Sincronizando...</p>
              ) : alertas.length > 0 ? (
                alertas.map((item) => {
                  const hoy = new Date();
                  const fechaVence = item.fecha_caducidad ? new Date(item.fecha_caducidad) : null;
                  const esCaducidad = fechaVence && ((fechaVence - hoy) / (1000 * 60 * 60 * 24)) <= 15;
                  const esAgotado = item.stock_actual === 0;

                  return (
                    <div key={item.id} className={`border p-4 rounded-2xl flex items-center justify-between group transition-all 
                      ${(esAgotado || esCaducidad) ? 'bg-red-950/20 border-red-600 animate-pulse' : 'bg-zinc-900/40 border-zinc-800'}`}>
                      <div>
                        <p className="text-red-600 font-black uppercase text-[8px] tracking-widest mb-0.5 italic flex items-center gap-2">
                          {esCaducidad ? <><Clock size={10} /> ¡PRÓXIMO A CADUCAR!</> : esAgotado ? '¡PRODUCTO AGOTADO!' : '¡CUIDADO! STOCK CRÍTICO'}
                        </p>
                        <p className="text-zinc-200 font-bold text-sm tracking-tight">
                          {esCaducidad ? (
                            <>El insumo <span className="text-white uppercase font-black">{item.nombre}</span> vence el {item.fecha_caducidad}</>
                          ) : (
                            <>Quedan <span className="text-white font-black">{item.stock_actual}</span> en <span className="text-white uppercase text-xs font-black">{item.nombre}</span></>
                          )}
                        </p>
                      </div>
                      <AlertCircle size={16} className="text-red-600" />
                    </div>
                  );
                })
              ) : (
                <div className="p-8 border border-dashed border-zinc-900 rounded-3xl text-center">
                  <p className="text-zinc-700 font-black text-[9px] uppercase tracking-widest">Todo bajo control</p>
                </div>
              )}
            </div>
          </section>

          {/* SECCIÓN AGENDA HOY */}
          <section>
            <h2 className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.4em] flex justify-between items-center mb-4">
              <span className="flex items-center gap-2"><Calendar size={12} /> Agenda Hoy</span>
              <span className="bg-zinc-900 px-2 py-0.5 rounded text-[8px] text-white italic font-black">{conteoCitasReales} ACTIVAS</span>
            </h2>
            
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-[2.5rem] overflow-hidden backdrop-blur-sm min-h-[300px] flex flex-col">
              {cargando ? (
                <div className="flex-1 flex items-center justify-center p-8">
                  <p className="text-zinc-700 animate-pulse font-bold text-[10px] uppercase">Cargando...</p>
                </div>
              ) : citasHoy.length > 0 ? (
                <div className="flex-1">
                  {citasHoy.map((cita) => {
                    const estadoTiempo = getEstadoCita(cita.hora);
                    const esCancelada = cita.estado?.toLowerCase() === 'cancelada';

                    return (
                      <div 
                        key={cita.id} 
                        className={`p-5 flex items-center justify-between hover:bg-zinc-800/40 transition-all border-b border-zinc-800/50 last:border-0 group 
                          ${esCancelada ? 'opacity-30' : estadoTiempo === 'pasada' ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`transition-all w-12 h-12 rounded-2xl flex flex-col items-center justify-center shadow-lg 
                            ${esCancelada ? 'bg-zinc-800' : estadoTiempo === 'proxima' ? 'bg-red-600 animate-bounce text-white' : 'bg-zinc-800 group-hover:bg-zinc-700'}`}>
                            <span className="text-[10px] font-black leading-none">{cita.hora?.slice(0, 5)}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-black text-sm uppercase tracking-tighter group-hover:text-red-500 transition-colors text-white">{cita.cliente}</h4>
                              
                              {/* TAGS DE ESTADO */}
                              {esCancelada ? (
                                <span className="bg-red-600/10 text-red-500 text-[7px] font-black px-1.5 py-0.5 rounded border border-red-600/20 flex items-center gap-1">
                                  <XCircle size={8} /> CANCELADA
                                </span>
                              ) : estadoTiempo === 'proxima' ? (
                                <span className="bg-red-600 text-[7px] font-black px-1.5 py-0.5 rounded animate-pulse text-white flex items-center gap-1">
                                  <Clock size={8} /> ¡YA LLEGA!
                                </span>
                              ) : (
                                <span className="bg-green-600/10 text-green-500 text-[7px] font-black px-1.5 py-0.5 rounded border border-green-600/20 flex items-center gap-1">
                                  <CheckCircle2 size={8} /> CONFIRMADA
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest">
                              <p className="text-zinc-500">{cita.estilo || 'Estilo Libre'}</p>
                              <span className="text-zinc-800">•</span>
                              <p className="text-red-600 italic">{cita.kit_nombre}</p>
                            </div>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-zinc-800 group-hover:text-white transition-all" />
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
              
              <Link href="/agenda" className="block w-full p-4 text-[8px] font-black text-zinc-500 hover:text-white text-center uppercase tracking-[0.4em] transition-all bg-black/40 border-t border-zinc-800 group">
                Ver Agenda Completa <ArrowUpRight size={10} className="inline ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}