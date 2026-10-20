// src/app/api/citas/route.js
import { ObjectId } from 'mongodb';
import { getCollection, COLLECTIONS } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { badRequest, conflict, created, handleError, ok, unauthorized } from '@/lib/http';
import { serializeCita } from '@/lib/serializers';
import {
  exactRegex,
  isNonEmptyString,
  isValidFecha,
  isValidHora,
  normalizeEmail,
  toNumber,
} from '@/lib/validators';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const session = getSession(request);
    if (!session) return unauthorized();

    const { searchParams } = new URL(request.url);
    const fecha = searchParams.get('fecha');
    const estado = searchParams.get('estado');

    const filtro = {};
    if (fecha) {
      // Las citas guardan la fecha como Date (medianoche UTC)
      const desde = new Date(`${fecha}T00:00:00.000Z`);
      const hasta = new Date(desde);
      hasta.setUTCDate(hasta.getUTCDate() + 1);
      filtro.fecha = { $gte: desde, $lt: hasta };
    }
    if (estado) filtro.estado = estado.toLowerCase();

    const citasCollection = await getCollection(COLLECTIONS.citas);
    const citas = await citasCollection
      .find(filtro)
      .sort({ fecha: 1, hora: 1 })
      .toArray();

    return ok(citas.map(serializeCita));
  } catch (err) {
    return handleError(err, 'GET /api/citas');
  }
}

async function resolverInsumos(kitsCollection, productosCollection, kitNombre) {
  const receta = await kitsCollection
    .find({ $or: [{ kit_nombre: kitNombre }, { nombre_kit: kitNombre }] })
    .toArray();

  const insumos = [];
  for (const item of receta) {
    const cantidad = toNumber(item.cantidad_a_descontar, 0);
    if (cantidad <= 0) continue;

    let producto = null;
    if (item.productoId) {
      try {
        producto = await productosCollection.findOne({ _id: new ObjectId(item.productoId) });
      } catch {
        producto = null;
      }
    }
    if (!producto && item.insumo_nombre) {
      producto = await productosCollection.findOne({ nombre: exactRegex(item.insumo_nombre) });
    }

    // Si la receta apunta a un insumo que ya no existe, se ignora en vez de romper el agendado.
    if (!producto) continue;

    insumos.push({
      productoId: producto._id,
      nombre: producto.nombre,
      cantidad,
    });
  }

  return insumos;
}

export async function POST(request) {
  const aplicados = [];
  try {
    const session = getSession(request);
    if (!session) return unauthorized();

    const body = await request.json();
    const cliente = String(body.cliente || '').trim();
    const estilo = String(body.estilo || '').trim();
    const fecha = String(body.fecha || '').trim();
    const hora = String(body.hora || '').trim();
    const kitNombre = String(body.kit_nombre || '').trim();
    const artista = String(body.artista || session.username || 'Ink Black').trim();

    if (!isNonEmptyString(cliente)) return badRequest('El nombre del cliente es obligatorio');
    if (!isValidFecha(fecha)) return badRequest('La fecha no es válida');
    if (!isValidHora(hora)) return badRequest('La hora no es válida');
    if (!isNonEmptyString(kitNombre)) return badRequest('Selecciona un kit de trabajo');

    const hoy = new Date().toISOString().slice(0, 10);
    if (fecha < hoy) return badRequest('No puedes agendar una sesión en el pasado');

    const citasCollection = await getCollection(COLLECTIONS.citas);
    const kitsCollection = await getCollection(COLLECTIONS.kits);
    const productosCollection = await getCollection(COLLECTIONS.productos);
    const movimientosCollection = await getCollection(COLLECTIONS.movimientos);

    // 1. Evitar doble reserva de la misma hora (las citas viejas guardan HH:MM:SS)
    const desde = new Date(`${fecha}T00:00:00.000Z`);
    const hasta = new Date(desde);
    hasta.setUTCDate(hasta.getUTCDate() + 1);

    const choque = await citasCollection.findOne({
      fecha: { $gte: desde, $lt: hasta },
      hora: { $in: [hora, `${hora}:00`] },
      estado: { $not: /^cancelada$/i },
    });
    if (choque) return conflict('Ya existe una sesión agendada a esa fecha y hora');

    // 2. Receta del kit
    const insumos = await resolverInsumos(kitsCollection, productosCollection, kitNombre);

    // 3. Descontar stock de forma atómica (solo si hay suficiente)
    for (const insumo of insumos) {
      const actualizado = await productosCollection.findOneAndUpdate(
        { _id: insumo.productoId, stock_actual: { $gte: insumo.cantidad } },
        { $inc: { stock_actual: -insumo.cantidad }, $set: { updatedAt: new Date() } },
        { returnDocument: 'after' }
      );

      if (!actualizado) {
        // Rollback de lo ya descontado
        for (const previo of aplicados) {
          await productosCollection.updateOne(
            { _id: previo.productoId },
            { $inc: { stock_actual: previo.cantidad }, $set: { updatedAt: new Date() } }
          );
        }
        return conflict(`Stock insuficiente de "${insumo.nombre}" para el ${kitNombre}`);
      }

      aplicados.push(insumo);
    }

    // 4. Insertar la cita
    let citaId;
    try {
      const resultado = await citasCollection.insertOne({
        cliente,
        estilo,
        fecha: desde,
        hora,
        artista,
        kit_nombre: kitNombre,
        estado: 'confirmada',
        usuario: normalizeEmail(session.email),
        createdAt: new Date(),
      });
      citaId = resultado.insertedId;
    } catch (err) {
      // Rollback del stock si la cita no se pudo guardar
      for (const previo of aplicados) {
        await productosCollection.updateOne(
          { _id: previo.productoId },
          { $inc: { stock_actual: previo.cantidad }, $set: { updatedAt: new Date() } }
        );
      }
      throw err;
    }

    // 5. Registrar el histórico de consumo
    if (aplicados.length > 0) {
      await movimientosCollection.insertMany(
        aplicados.map((insumo) => ({
          tipo: 'consumo',
          productoId: insumo.productoId,
          producto_nombre: insumo.nombre,
          cantidad: insumo.cantidad,
          motivo: `Sesión ${kitNombre}`,
          citaId,
          kit_nombre: kitNombre,
          usuario: normalizeEmail(session.email),
          fecha: new Date(),
        }))
      );
    }

    const cita = await citasCollection.findOne({ _id: citaId });
    return created({ message: 'Sesión agendada y material descontado', cita: serializeCita(cita) });
  } catch (err) {
    return handleError(err, 'POST /api/citas');
  }
}
