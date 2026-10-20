"use client";
import { useState, useEffect } from 'react';

import { 
  BarChart3, TrendingUp, Users, Package, 
  RefreshCw, activity, Award, AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

export default function Reportes() {
  const [stats, setStats] = useState({
    totalCitas: 0,
    crecimiento: 0,
    insumosNuevosMes: 0, // En lugar de dinero, contamos cuántos productos nuevos entraron
    usoKits: {},
    topKit: { nombre: '-', cantidad: 0 },
    saludInventario: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargarDataOperativa() {
      const ahora = new Date();
      const mesActual = ahora.getMonth();
      const añoActual = ahora.getFullYear();

      // 1. Cargar Citas reales (No canceladas)
      const { data: citas } = await supabase.from('citas').select('*').not('estado', 'ilike', 'cancelada');
      
      // 2. Cargar Productos para análisis de stock
      const { data: productos } = await supabase.from('productos').select('*');

      // 3. Flujo de Inventario: ¿Cuántos insumos se registraron/actualizaron este mes?
      const { data: flujoMes } = await supabase
        .from('productos')
        .select('created_at')
        .gte('created_at', new Date(añoActual, mesActual, 1).toISOString());

      if (citas && productos) {
        // --- ANÁLISIS DE KITS ---
        const kits = citas.reduce((acc, c) => {
          acc[c.kit_nombre] = (acc[c.kit_nombre] || 0) + 1;
          return acc;
        }, {});

        let maxKit = { nombre: 'Ninguno', cantidad: 0 };
        Object.entries(kits).forEach(([nombre, cant]) => {
          if (cant > maxKit.cantidad) maxKit = { nombre, cantidad: cant };
        });

        // --- SALUD DE STOCK (Basado en cantidades, no precios) ---
        const criticos = productos.filter(p => p.stock_actual <= p.stock_minimo).length;
        const salud = ((productos.length - criticos) / productos.length) * 100;

        setStats({
          totalCitas: citas.length,
          insumosNuevosMes: flujoMes?.length || 0,
          usoKits: kits,
          topKit: maxKit,
          saludInventario: salud.toFixed(0)
        });
      }
      setLoading(false);
    }
    cargarDataOperativa();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex font-sans">
      
      <aside className="w-60 bg-zinc-950 border-r border-zinc-900 p-6 flex flex-col fixed h-full z-20">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="bg-red-600 w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm text-white">IB</div>
          <h2 className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] italic text-white">INK BLACK</h2>
        </div>
        <nav className="space-y-1 flex-1">
          <Link href="/reportes" className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900 text-white font-bold text-xs border border-zinc-800"><BarChart3 size={16} className="text-red-600" /> Reportes</Link>
          <Link href="/" className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-900 text-zinc-500 font-bold text-xs transition-all"><Users size={16}/> Inicio</Link>
          <Link href="/inventario" className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-900 text-zinc-500 font-bold text-xs transition-all"><Package size={16}/> Inventario</Link>
        </nav>
      </aside>

      <main className="flex-1 ml-60 p-12 bg-black overflow-y-auto">
        <header className="mb-12 flex justify-between items-center">
          <div>
            <h1 className="text-5xl font-black italic uppercase tracking-tighter">Control de Flujo</h1>
            <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em] mt-2 italic">Análisis de Desgaste y Rotación de Material</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-3xl text-right">
             <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Insumos Registrados (Mes)</p>
             <h2 className="text-2xl font-black italic text-white">{stats.insumosNuevosMes} Unidades</h2>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-[2.5rem] flex items-center gap-6">
            <div className="bg-red-600/20 p-4 rounded-2xl">
              <Award className="text-red-600" size={32} />
            </div>
            <div>
              <p className="text-zinc-500 text-[8px] font-black uppercase tracking-widest">Kit de Mayor Desgaste</p>
              <h3 className="text-xl font-black italic uppercase">{stats.topKit.nombre}</h3>
            </div>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-[2.5rem] flex items-center gap-6">
            <div className="bg-yellow-600/20 p-4 rounded-2xl">
              <AlertTriangle className="text-yellow-500" size={32} />
            </div>
            <div>
              <p className="text-zinc-500 text-[8px] font-black uppercase tracking-widest">Nivel de Abastecimiento</p>
              <h3 className="text-3xl font-black italic">{stats.saludInventario}%</h3>
            </div>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-[2.5rem] flex items-center gap-6">
            <div className="bg-green-600/20 p-4 rounded-2xl">
              <RefreshCw className="text-green-500" size={32} />
            </div>
            <div>
              <p className="text-zinc-500 text-[8px] font-black uppercase tracking-widest">Servicios Concluidos</p>
              <h3 className="text-3xl font-black italic">{stats.totalCitas}</h3>
            </div>
          </div>
        </div>

        <section className="bg-zinc-900/20 border border-zinc-800 p-10 rounded-[3rem]">
          <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-10 italic">Frecuencia de Uso por Kit Operativo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(stats.usoKits).map(([nombre, cant]) => (
              <div key={nombre} className="bg-black border border-zinc-900 p-6 rounded-3xl group hover:border-red-600/50 transition-all">
                <p className="text-zinc-500 text-[8px] font-black uppercase mb-1 tracking-widest">Kit</p>
                <h4 className="text-lg font-black italic text-white uppercase">{nombre}</h4>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-red-600 italic">{cant}</span>
                    <span className="text-[8px] text-zinc-600 font-bold uppercase">usos</span>
                  </div>
                  {/* Barra de progreso mini */}
                  <div className="w-16 bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-red-600 h-full" 
                      style={{ width: `${(cant / stats.totalCitas) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}