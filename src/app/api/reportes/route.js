// src/app/api/reportes/route.js
import { getCollection, COLLECTIONS } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { handleError, ok, unauthorized } from '@/lib/http';
import { parseFechaFlexible } from '@/lib/validators';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const session = getSession(request);
    if (!session) return unauthorized();

    const citasCollection = await getCollection(COLLECTIONS.citas);
    const productosCollection = await getCollection(COLLECTIONS.productos);
    const movimientosCollection = await getCollection(COLLECTIONS.movimientos);

    const [citas, productos, movimientos] = await Promise.all([
      citasCollection.find({}).toArray(),
      productosCollection.find({}).toArray(),
      movimientosCollection.find({ tipo: 'consumo' }).toArray(),
    ]);

    const ahora = new Date();
    const mesActual = ahora.getMonth();
    const anioActual = ahora.getFullYear();

    const citasValidas = citas.filter((c) => String(c.estado || '').toLowerCase() !== 'cancelada');

    // Uso de kits a partir de las citas
    const usoKits = {};
    for (const cita of citasValidas) {
      const kit = cita.kit_nombre || cita.nombre_kit || 'Sin kit';
      usoKits[kit] = (usoKits[kit] || 0) + 1;
    }

    let topKit = { nombre: 'Sin datos', cantidad: 0 };
    for (const [nombre, cantidad] of Object.entries(usoKits)) {
      if (cantidad > topKit.cantidad) topKit = { nombre, cantidad };
    }

    // Salud del inventario: insumos por encima del mínimo
    const criticos = productos.filter(
      (p) => Number(p.stock_actual) <= Number(p.stock_minimo)
    ).length;
    const saludInventario = productos.length > 0
      ? Math.round(((productos.length - criticos) / productos.length) * 100)
      : 0;

    // Insumos dados de alta este mes
    const insumosNuevosMes = productos.filter((p) => {
      const fecha = parseFechaFlexible(p.createdAt || p.created_at);
      return fecha && fecha.getMonth() === mesActual && fecha.getFullYear() === anioActual;
    }).length;

    // Consumo real de insumos por kit (histórico de movimientos)
    const consumoPorKit = {};
    for (const mov of movimientos) {
      const kit = mov.kit_nombre || 'Sin kit';
      if (!consumoPorKit[kit]) consumoPorKit[kit] = { kit, insumos: 0, detalle: {} };
      consumoPorKit[kit].insumos += Number(mov.cantidad) || 0;
      const nombre = mov.producto_nombre || 'Insumo';
      consumoPorKit[kit].detalle[nombre] = (consumoPorKit[kit].detalle[nombre] || 0) + (Number(mov.cantidad) || 0);
    }

    return ok({
      totalCitas: citasValidas.length,
      citasCanceladas: citas.length - citasValidas.length,
      usoKits,
      topKit,
      saludInventario,
      insumosNuevosMes,
      totalInsumos: productos.length,
      consumoKits: Object.values(consumoPorKit).sort((a, b) => b.insumos - a.insumos),
    });
  } catch (err) {
    return handleError(err, 'GET /api/reportes');
  }
}
