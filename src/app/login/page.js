"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState(''); // Para el código de verificación
  const [step, setStep] = useState('login'); // 'login' o 'otp'
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  
  const router = useRouter();

  // --- PASO 1: Login con correo y contraseña ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setCargando(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Si el usuario no está verificado, pasamos al paso OTP
        if (res.status === 403) {
          setStep('otp');
          setErrorMsg("Debes verificar tu correo. Hemos enviado un código.");
          setCargando(false);
          return;
        }
        setErrorMsg(data.error || "Datos incorrectos");
        setCargando(false);
        return;
      }

      // Login exitoso
      localStorage.setItem('token', data.token);
      router.push('/'); // Cambia '/' por la ruta de tu dashboard

    } catch (error) {
      setErrorMsg("Error de conexión con el servidor");
      setCargando(false);
    }
  };

  // --- PASO 2: Verificar el código OTP ---
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setCargando(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otpCode: otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Código incorrecto");
        setCargando(false);
        return;
      }

      // Verificación exitosa, volvemos al login
      setStep('login');
      setErrorMsg(null);
      setCargando(false);
      alert("¡Correo verificado! Ahora puedes iniciar sesión.");

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
          <p className="text-zinc-500 text-xs uppercase tracking-widest mt-2 font-bold">
            {step === 'login' ? 'Acceso al Sistema' : 'Verificación de Correo'}
          </p>
        </div>

        {/* FORMULARIO DE LOGIN */}
        {step === 'login' && (
          <form onSubmit={handleLogin} className="space-y-6">
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

            <button 
              type="submit"
              disabled={cargando}
              className="w-full bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-black py-4 rounded-lg transition-all shadow-lg shadow-red-900/40 uppercase tracking-widest disabled:opacity-50"
            >
              {cargando ? 'Verificando...' : 'Entrar al Estudio'}
            </button>
          </form>
        )}

        {/* FORMULARIO DE OTP */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <p className="text-zinc-400 text-sm text-center">
              Hemos enviado un código de 6 dígitos a <br/>
              <span className="text-white font-bold">{email}</span>
            </p>

            <div>
              <label className="block text-zinc-400 text-sm mb-2 font-medium tracking-wide">CÓDIGO DE VERIFICACIÓN</label>
              <input 
                type="text" 
                maxLength="6"
                className="w-full bg-black/50 border border-zinc-800 rounded-lg p-3 text-white text-center text-2xl tracking-[0.5em] font-black focus:border-red-600 outline-none transition-all placeholder:text-zinc-700"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="000000"
                required
              />
            </div>

            {errorMsg && (
              <p className="text-red-500 text-[10px] font-black uppercase text-center tracking-widest bg-red-500/10 py-2 rounded border border-red-500/20">
                {errorMsg}
              </p>
            )}

            <button 
              type="submit"
              disabled={cargando}
              className="w-full bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-black py-4 rounded-lg transition-all shadow-lg shadow-red-900/40 uppercase tracking-widest disabled:opacity-50"
            >
              {cargando ? 'Verificando...' : 'Verificar Código'}
            </button>

            <button 
              type="button"
              onClick={() => setStep('login')}
              className="w-full text-zinc-500 hover:text-white text-xs uppercase tracking-widest transition-colors"
            >
              Volver al inicio de sesión
            </button>
          </form>
        )}
      </div>
    </main>
  );
}