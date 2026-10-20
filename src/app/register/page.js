"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Register() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    setCargando(true);
    setErrorMsg(null);
    setMensaje(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Error al registrar usuario");
        setCargando(false);
        return;
      }

      setMensaje("¡Registro exitoso! Revisa tu correo electrónico para obtener el código de verificación.");
      setCargando(false);
      
      setTimeout(() => {
        router.push('/login');
      }, 4000);

    } catch (error) {
      setErrorMsg("Error de conexión con el servidor");
      setCargando(false);
    }
  };

  return (
    <main 
      className="min-h-screen flex items-center justify-center p-6 bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: "url('/imagen/fondo.jpeg')" }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

      <div className="relative w-full max-w-sm bg-zinc-900/90 border border-zinc-800 p-10 rounded-2xl shadow-2xl backdrop-blur-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-red-600 tracking-tighter italic">INK BLACK</h1>
          <p className="text-zinc-500 text-xs uppercase tracking-widest mt-2 font-bold">Crear Cuenta</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          <div>
            <label className="block text-zinc-400 text-sm mb-2 font-medium tracking-wide">NOMBRE DE USUARIO</label>
            <input 
              type="text" 
              className="w-full bg-black/50 border border-zinc-800 rounded-lg p-3 text-white focus:border-red-600 outline-none transition-all placeholder:text-zinc-700"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ej. Tilin"
              required
            />
          </div>

          <div>
            <label className="block text-zinc-400 text-sm mb-2 font-medium tracking-wide">CORREO ELECTRÓNICO</label>
            <input 
              type="email" 
              className="w-full bg-black/50 border border-zinc-800 rounded-lg p-3 text-white focus:border-red-600 outline-none transition-all placeholder:text-zinc-700"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ej. Tilin@inkblack.com"
              required
            />
          </div>

          <div>
            <label className="block text-zinc-400 text-sm mb-2 font-medium tracking-wide">CONTRASEÑA</label>
            <input 
              type="password" 
              className="w-full bg-black/50 border border-zinc-800 rounded-lg p-3 text-white focus:border-red-600 outline-none transition-all placeholder:text-zinc-700"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {errorMsg && (
            <p className="text-red-500 text-[10px] font-black uppercase text-center tracking-widest bg-red-500/10 py-2 rounded border border-red-500/20">
              {errorMsg}
            </p>
          )}

          {mensaje && (
            <p className="text-green-500 text-[10px] font-black uppercase text-center tracking-widest bg-green-500/10 py-2 rounded border border-green-500/20">
              {mensaje}
            </p>
          )}

          <button 
            type="submit"
            disabled={cargando}
            className="w-full bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-black py-4 rounded-lg transition-all shadow-lg shadow-red-900/40 uppercase tracking-widest disabled:opacity-50"
          >
            {cargando ? 'Registrando...' : 'Crear Cuenta'}
          </button>
        </form>

        <div className="mt-6 text-center">
            <a href="/login" className="text-zinc-500 hover:text-white text-xs uppercase tracking-widest transition-colors">
              ¿Ya tienes cuenta? Inicia sesión
            </a>
        </div>
      </div>
    </main>
  );
}