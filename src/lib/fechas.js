// src/lib/fechas.js

/** Fecha de hoy en formato YYYY-MM-DD según la zona horaria del navegador. */
export function fechaLocalISO(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export function formatearFecha(fechaStr) {
  if (!fechaStr) return 'Sin fecha';
  const fecha = new Date(`${fechaStr}T00:00:00`);
  if (Number.isNaN(fecha.getTime())) return fechaStr;
  return fecha.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatearFechaCorta(fechaStr) {
  if (!fechaStr) return '';
  const fecha = new Date(`${fechaStr}T00:00:00`);
  if (Number.isNaN(fecha.getTime())) return fechaStr;
  return fecha.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
}

export function diasHasta(fechaStr) {
  if (!fechaStr) return null;
  const objetivo = new Date(`${fechaStr}T00:00:00`);
  if (Number.isNaN(objetivo.getTime())) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return Math.round((objetivo - hoy) / (1000 * 60 * 60 * 24));
}

/** 'pasada' | 'proxima' | 'hoy' | 'pendiente' */
export function estadoPorFechaHora(fecha, hora) {
  if (!fecha || !hora) return 'pendiente';

  const hoy = fechaLocalISO();
  if (fecha < hoy) return 'pasada';
  if (fecha > hoy) return 'pendiente';

  const [horas, minutos] = String(hora).split(':').map(Number);
  if (!Number.isFinite(horas) || !Number.isFinite(minutos)) return 'pendiente';

  const ahora = new Date();
  const cita = new Date();
  cita.setHours(horas, minutos, 0, 0);

  const diferenciaMin = (cita - ahora) / (1000 * 60);
  if (diferenciaMin < 0) return 'pasada';
  if (diferenciaMin <= 60) return 'proxima';
  return 'hoy';
}
