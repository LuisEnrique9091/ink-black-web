// src/lib/validators.js

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export function isValidEmail(email) {
  return EMAIL_REGEX.test(normalizeEmail(email));
}

export function isValidPassword(password) {
  return typeof password === 'string' && password.length >= 8;
}

export function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** Escapa caracteres especiales para usar un texto dentro de una RegExp. */
export function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Interpreta fechas ISO y también formatos tipo "2026-05-10 00:40:35.739578+00". */
export function parseFechaFlexible(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  const texto = String(value).trim();
  const normalizado = texto
    .replace(' ', 'T')
    .replace(/(\.\d{3})\d+/, '$1')
    .replace(/([+-]\d{2})$/, '$1:00');

  const fecha = new Date(normalizado);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

/** Regex exacta e insensible a mayúsculas para comparar nombres. */
export function exactRegex(text) {
  return { $regex: `^${escapeRegex(String(text).trim())}$`, $options: 'i' };
}

/** Acepta Date o string y devuelve 'YYYY-MM-DD' (o null). */
export function toFechaStr(value) {
  if (!value) return null;
  if (typeof value === 'string') {
    const match = value.match(/^\d{4}-\d{2}-\d{2}/);
    if (match) return match[0];
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  return null;
}

export function isValidFecha(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
}

export function isValidHora(value) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(value || ''));
}

export const ESTADOS_CITA = ['pendiente', 'confirmada', 'cancelada', 'completada'];

export function normalizeEstado(value) {
  const estado = String(value || 'confirmada').trim().toLowerCase();
  return ESTADOS_CITA.includes(estado) ? estado : 'confirmada';
}
