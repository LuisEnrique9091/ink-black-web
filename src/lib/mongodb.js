// src/lib/mongodb.js
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error('Por favor, agrega MONGODB_URI a tu archivo .env.local');
}

const options = {
  // En Windows/redes con IPv6 roto, forzar IPv4 evita timeouts de Atlas
  family: 4,
  serverSelectionTimeoutMS: 15000,
  connectTimeoutMS: 15000,
};

/**
 * Conexión perezosa: no se abre hasta que una ruta realmente la necesita.
 * Esto evita conectarse durante el build o al analizar los módulos.
 */
let cachedPromise = global._mongoClientPromise;

function resetCache() {
  cachedPromise = null;
  if (process.env.NODE_ENV === 'development') {
    global._mongoClientPromise = null;
  }
}

export default function getClientPromise() {
  if (!cachedPromise) {
    const client = new MongoClient(uri, options);
    cachedPromise = client.connect().catch((err) => {
      // Si falla, no dejamos cacheada la promesa rechazada:
      // así el siguiente request puede reintentar la conexión.
      resetCache();
      throw err;
    });

    if (process.env.NODE_ENV === 'development') {
      global._mongoClientPromise = cachedPromise;
    }
  }

  return cachedPromise;
}
