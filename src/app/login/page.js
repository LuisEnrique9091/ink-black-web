"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('login');
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [cooldown, setCooldown] = useState(0);

  const router = useRouter();

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setCargando(true);
    setErrorMsg(null);
    setAviso(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 403) {
        setStep('otp');
        setAviso(data.error || 'Debes verificar tu correo. Te enviamos un código nuevo.');
        setCooldown(60);
        return;
      }

      if (!res.ok) {
        setErrorMsg(data.error || 'Datos incorrectos');
        return;
      }

      router.push('/');
      router.refresh();
    } catch {
      setErrorMsg('Error de conexión con el servidor');
    } finally {
      setCargando(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setCargando(true);
    setErrorMsg(null);
    setAviso(null);

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otpCode: otp }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrorMsg(data.error || 'Código incorrecto');
        return;
      }

      setStep('login');
      setOtp('');
      setAviso('¡Correo verificado! Ya puedes iniciar sesión.');
    } catch {
      setErrorMsg('Error de conexión con el servidor');
    } finally {
      setCargando(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setCargando(true);
    setErrorMsg(null);
    setAviso(null);

    try {
      const res = await fetch('/api/auth/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrorMsg(data.error || 'No se pudo reenviar el código');
        return;
      }

      setAviso(data.message || 'Te enviamos un código nuevo.');
      setCooldown(60);
    } catch {
      setErrorMsg('Error de conexión con el servidor');
    } finally {
      setCargando(false);
    }
  };

  const inputClass =
    'w-full bg-black/50 border border-zinc-800 rounded-lg p-3 text-white focus:border-red-600 outline-none transition-all placeholder:text-zinc-700';

  return (
    <main
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: "url('/imagen/fondo.jpeg')" }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

      <div className="relative w-full max-w-sm bg-zinc-900/90 border border-zinc-800 p-6 sm:p-10 rounded-2xl shadow-2xl backdrop-blur-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-red-600 tracking-tighter italic">INK BLACK</h1>
          <p className="text-zinc-500 text-xs uppercase tracking-widest mt-2 font-bold">
            {step === 'login' ? 'Acceso al Sistema' : 'Verificación de Correo'}
          </p>
        </div>

        {aviso && (
          <p className="mb-5 text-green-400 text-[10px] font-black uppercase text-center tracking-widest bg-green-500/10 py-2 px-3 rounded border border-green-500/20">
            {aviso}
          </p>
        )}

        {step === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-zinc-400 text-sm mb-2 font-medium tracking-wide">
                CORREO ELECTRÓNICO
              </label>
              <input
                type="email"
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ej. tilin@inkblack.com"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="block text-zinc-400 text-sm mb-2 font-medium tracking-wide">
                CONTRASEÑA
              </label>
              <input
                type="password"
                className={inputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            {errorMsg && (
              <p className="text-red-500 text-[10px] font-black uppercase text-center tracking-widest bg-red-500/10 py-2 px-3 rounded border border-red-500/20">
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
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <p className="text-zinc-400 text-sm text-center">
              Enviamos un código de 6 dígitos a
              <br />
              <span className="text-white font-bold break-all">{email}</span>
            </p>

            <div>
              <label className="block text-zinc-400 text-sm mb-2 font-medium tracking-wide">
                CÓDIGO DE VERIFICACIÓN
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                className={`${inputClass} text-center text-2xl tracking-[0.5em] font-black`}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                autoComplete="one-time-code"
                required
              />
            </div>

            {errorMsg && (
              <p className="text-red-500 text-[10px] font-black uppercase text-center tracking-widest bg-red-500/10 py-2 px-3 rounded border border-red-500/20">
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
              onClick={handleResend}
              disabled={cargando || cooldown > 0}
              className="w-full text-zinc-500 hover:text-white text-[10px] uppercase tracking-widest transition-colors disabled:opacity-50"
            >
              {cooldown > 0 ? `Reenviar código en ${cooldown}s` : 'Reenviar código'}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('login');
                setErrorMsg(null);
                setAviso(null);
              }}
              className="w-full text-zinc-600 hover:text-white text-[10px] uppercase tracking-widest transition-colors"
            >
              Volver al inicio de sesión
            </button>
          </form>
        )}

        {step === 'login' && (
          <div className="mt-6 text-center">
            <Link
              href="/register"
              className="text-zinc-500 hover:text-white text-xs uppercase tracking-widest transition-colors"
            >
              ¿No tienes cuenta? Regístrate
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
