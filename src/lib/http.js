// src/lib/http.js
import { NextResponse } from 'next/server';

export function ok(data, status = 200) {
  return NextResponse.json(data, { status });
}

export function created(data) {
  return NextResponse.json(data, { status: 201 });
}

export function badRequest(error) {
  return NextResponse.json({ error }, { status: 400 });
}

export function unauthorized(error = 'No autorizado') {
  return NextResponse.json({ error }, { status: 401 });
}

export function forbidden(error = 'Acceso denegado') {
  return NextResponse.json({ error }, { status: 403 });
}

export function notFound(error = 'No encontrado') {
  return NextResponse.json({ error }, { status: 404 });
}

export function conflict(error) {
  return NextResponse.json({ error }, { status: 409 });
}

export function tooManyRequests(error) {
  return NextResponse.json({ error }, { status: 429 });
}

export function serverError(error = 'Error en el servidor') {
  return NextResponse.json({ error }, { status: 500 });
}

export function handleError(err, context = '') {
  console.error(`[API] ${context}:`, err);
  const message = err instanceof Error ? err.message : 'Error desconocido';
  return serverError(`Error en el servidor: ${message}`);
}
