// src/app/api/kits/route.js
import { getCollection, COLLECTIONS } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { handleError, ok, unauthorized } from '@/lib/http';
import { serializeProducto } from '@/lib/serializers';
import { toNumber } from '@/lib/validators';

export const dynamic = 'force-dynamic';

/**
 * Devuelve los kits con su receta y el stock actual de cada insumo,
 * para que el cliente pueda mostrar qué material falta antes de agendar.
 */
export async function GET(request) {
  try {
    const session = getSession(request);
    if (!session) return unauthorized();

    const kitsCollection = await getCollection(COLLECTIONS.kits);
    const productosCollection = await getCollection(COLLECTIONS.productos);

    const recetas = await kitsCollection.find({}).toArray();
    const productos = await productosCollection.find({}).toArray();
    const porId = new Map(productos.map((p) => [String(p._id), p]));
    const porNombre = new Map(productos.map((p) => [p.nombre.toLowerCase(), p]));

    const kits = new Map();

    for (const item of recetas) {
      const nombreKit = item.kit_nombre || item.nombre_kit || 'Kit sin nombre';
      if (!kits.has(nombreKit)) kits.set(nombreKit, []);

      const producto =
        (item.productoId && porId.get(String(item.productoId))) ||
        porNombre.get(String(item.insumo_nombre || '').toLowerCase()) ||
        null;

      kits.get(nombreKit).push({
        insumo_nombre: item.insumo_nombre || producto?.nombre || 'Insumo',
        cantidad_a_descontar: toNumber(item.cantidad_a_descontar, 0),
        producto: serializeProducto(producto),
      });
    }

    const respuesta = Array.from(kits.entries())
      .map(([nombre, insumos]) => ({
        nombre,
        insumos,
        disponible: insumos.every((i) => (i.producto?.stock_actual ?? 0) >= i.cantidad_a_descontar),
      }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));

    return ok(respuesta);
  } catch (err) {
    return handleError(err, 'GET /api/kits');
  }
}
