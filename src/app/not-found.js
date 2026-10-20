import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-zinc-900/60 border border-zinc-800 rounded-3xl p-8 text-center">
        <div className="bg-red-600 w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg mx-auto mb-6">
          IB
        </div>
        <p className="text-red-600 font-black text-6xl italic tracking-tighter mb-2">404</p>
        <h1 className="text-xl font-black italic uppercase tracking-tighter mb-2">
          Página no encontrada
        </h1>
        <p className="text-zinc-500 text-xs font-bold mb-6">
          La ventana que buscas no existe o fue movida.
        </p>
        <Link
          href="/"
          className="block w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-xl uppercase text-[10px] tracking-widest transition-all"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
