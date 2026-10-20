// src/app/api/productos/route.js
import { getCollection, COLLECTIONS } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { badRequest, created, handleError, ok, unauthorized } from '@/lib/http';
import { serializeProducto } from '@/lib/serializers';
import { isNonEmptyString, isValidFecha, toNumber, exactRegex } from '@/lib/validators';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const session = getSession(request);
    if (!session) return unauthorized();

    const productosCollection = await getCollection(COLLECTIONS.productos);
    const productos = await productosCollection.find({}).sort({ nombre: 1 }).toArray();
    return ok(productos.map(serializeProducto));
  } catch (err) {
    return handleError(err, 'GET /api/productos');
  }
}

export async function POST(request) {
  try {
    const session = getSession(request);
    if (!session) return unauthorized();

    const body = await request.json();
    const nombre = String(body.nombre || '').trim();
    if (!isNonEmptyString(nombre)) return badRequest('El nombre es obligatorio');

    const fechaCaducidad = body.fecha_caducidad ? String(body.fecha_caducidad) : '';
    if (fechaCaducidad && !isValidFecha(fechaCaducidad)) {
      return badRequest('La fecha de caducidad no es válida');
    }

    const productosCollection = await getCollection(COLLECTIONS.productos);
    const existente = await productosCollection.findOne({ nombre: exactRegex(nombre) });
    if (existente) return badRequest('Ya existe un insumo con ese nombre');

    const documento = {
      nombre,
      categoria: String(body.categoria || 'Insumos'),
      stock_actual: toNumber(body.stock_actual, 0),
      stock_minimo: toNumber(body.stock_minimo, 5),
      unidad_medida: String(body.unidad_medida || 'unidades'),
      fecha_caducidad: fechaCaducidad || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const resultado = await productosCollection.insertOne(documento);
    return created({ message: 'Insumo registrado', producto: serializeProducto({ ...documento, _id: resultado.insertedId }) });
  } catch (err) {
    return handleError(err, 'POST /api/productos');
  }
}
