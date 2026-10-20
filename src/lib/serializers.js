// src/lib/serializers.js
import { toFechaStr } from '@/lib/validators';

export function serializeCita(cita) {
  if (!cita) return null;
  const hora = cita.hora ? String(cita.hora).slice(0, 5) : '';
  return {
    id: String(cita._id),
    cliente: cita.cliente || '',
    estilo: cita.estilo || '',
    fecha: toFechaStr(cita.fecha),
    hora,
    artista: cita.artista || '',
    estado: (cita.estado || 'confirmada').toLowerCase(),
    kit_nombre: cita.kit_nombre || '',
  };
}

export function serializeProducto(prod) {
  if (!prod) return null;
  return {
    id: String(prod._id),
    nombre: prod.nombre || '',
    categoria: prod.categoria || 'Insumos',
    stock_actual: Number(prod.stock_actual) || 0,
    stock_minimo: Number(prod.stock_minimo) || 0,
    unidad_medida: prod.unidad_medida || 'unidades',
    fecha_caducidad: toFechaStr(prod.fecha_caducidad),
  };
}
