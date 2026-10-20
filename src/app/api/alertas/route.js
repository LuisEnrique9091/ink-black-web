// src/app/api/alertas/route.js
import { getCollection, COLLECTIONS } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { handleError, ok, unauthorized } from '@/lib/http';
import { serializeProducto } from '@/lib/serializers';
import { toFechaStr } from '@/lib/validators';

export const dynamic = 'force-dynamic';

const DIAS_AVISO_CADUCIDAD = 15;

export async function GET(request) {
  try {
    const session = getSession(request);
    if (!session) return unauthorized();

    const productosCollection = await getCollection(COLLECTIONS.productos);
    const productos = await productosCollection.find({}).toArray();

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const limite = new Date(hoy);
    limite.setDate(limite.getDate() + DIAS_AVISO_CADUCIDAD);

    const alertas = productos
      .map((p) => {
        const prod = serializeProducto(p);
        const caduca = prod.fecha_caducidad ? new Date(`${prod.fecha_caducidad}T00:00:00`) : null;
        const agotado = prod.stock_actual <= 0;
        const bajoStock = prod.stock_actual <= prod.stock_minimo;
        const porCaducar = caduca ? caduca <= limite : false;
        const caducado = caduca ? caduca < hoy : false;

        let tipo = null;
        if (caducado) tipo = 'caducado';
        else if (agotado) tipo = 'agotado';
        else if (porCaducar) tipo = 'caduca';
        else if (bajoStock) tipo = 'bajo';

        if (!tipo) return null;
        return { ...prod, tipo };
      })
      .filter(Boolean)
      .sort((a, b) => {
        const prioridad = { caducado: 0, agotado: 1, caduca: 2, bajo: 3 };
        return prioridad[a.tipo] - prioridad[b.tipo];
      });

    return ok(alertas);
  } catch (err) {
    return handleError(err, 'GET /api/alertas');
  }
}
