// src/app/api/citas/[id]/route.js
import { ObjectId } from 'mongodb';
import { getCollection, COLLECTIONS } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { badRequest, handleError, notFound, ok, unauthorized } from '@/lib/http';
import { serializeCita } from '@/lib/serializers';
import { ESTADOS_CITA, normalizeEstado } from '@/lib/validators';

export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  try {
    const session = getSession(request);
    if (!session) return unauthorized();

    const { id } = await params;
    if (!ObjectId.isValid(id)) return badRequest('Identificador inválido');

    const body = await request.json();
    const estado = normalizeEstado(body.estado);
    if (!ESTADOS_CITA.includes(estado)) return badRequest('Estado no válido');

    const citasCollection = await getCollection(COLLECTIONS.citas);
    const resultado = await citasCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { estado, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    if (!resultado) return notFound('Cita no encontrada');
    return ok({ message: 'Cita actualizada', cita: serializeCita(resultado) });
  } catch (err) {
    return handleError(err, 'PATCH /api/citas/[id]');
  }
}
