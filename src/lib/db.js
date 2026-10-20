// src/lib/db.js
import getClientPromise from '@/lib/mongodb';

export const COLLECTIONS = {
  usuarios: 'Users-InkBlack',
  citas: 'citas',
  productos: 'productos',
  kits: 'kits_insumos',
  movimientos: 'movimientos',
};

/**
 * Devuelve la base de datos configurada en DB_NAME.
 * Reutiliza la conexión global para no abrir un cliente por request.
 */
export async function getDb() {
  const client = await getClientPromise();
  return client.db(process.env.DB_NAME);
}

export async function getCollection(name) {
  const db = await getDb();
  return db.collection(name);
}
