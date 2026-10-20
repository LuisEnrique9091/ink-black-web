// src/app/api/productos/[id]/route.js
import { ObjectId } from 'mongodb';
import { getCollection, COLLECTIONS } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { badRequest, handleError, notFound, ok, unauthorized } from '@/lib/http';
import { serializeProducto } from '@/lib/serializers';
import { isValidFecha, toNumber } from '@/lib/validators';

export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  try {
    const session = getSession(request);
    if (!session) return unauthorized();

    const { id } = await params;
    if (!ObjectId.isValid(id)) return badRequest('Identificador inválido');

    const body = await request.json();
    const productosCollection = await getCollection(COLLECTIONS.productos);
    const movimientosCollection = await getCollection(COLLECTIONS.movimientos);

    const producto = await productosCollection.findOne({ _id: new ObjectId(id) });
    if (!producto) return notFound('Insumo no encontrado');

    const cambios = { updatedAt: new Date() };

    if (body.fecha_caducidad !== undefined) {
      const fecha = body.fecha_caducidad ? String(body.fecha_caducidad) : null;
      if (fecha && !isValidFecha(fecha)) return badRequest('Fecha de caducidad inválida');
      cambios.fecha_caducidad = fecha;
    }

    let cantidadEntrada = 0;
    if (body.cantidad !== undefined) {
      cantidadEntrada = toNumber(body.cantidad, 0);
      if (cantidadEntrada <= 0) return badRequest('La cantidad debe ser mayor que cero');
      cambios.stock_actual = (Number(producto.stock_actual) || 0) + cantidadEntrada;
    }

    const actualizado = await productosCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: cambios },
      { returnDocument: 'after' }
    );

    if (cantidadEntrada > 0) {
      await movimientosCollection.insertOne({
        tipo: 'entrada',
        productoId: new ObjectId(id),
        producto_nombre: producto.nombre,
        cantidad: cantidadEntrada,
        motivo: String(body.motivo || 'Compra de insumo'),
        usuario: session.email,
        fecha: new Date(),
      });
    }

    return ok({ message: 'Insumo actualizado', producto: serializeProducto(actualizado) });
  } catch (err) {
    return handleError(err, 'PATCH /api/productos/[id]');
  }
}
