import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;

if (!uri) {
  console.error('❌ Falta MONGODB_URI. Ejecuta: npm run seed (usa .env.local)');
  process.exit(1);
}
if (!dbName) {
  console.error('❌ Falta DB_NAME en .env.local');
  process.exit(1);
}

const client = new MongoClient(uri);

async function main() {
  await client.connect();
  const db = client.db(dbName);

  console.log(`\n🔧 Preparando base de datos "${dbName}"...\n`);

  // Un correo por usuario
  await db.collection('Users-InkBlack').createIndex(
    { email: 1 },
    { unique: true, name: 'email_unico' }
  );
  console.log('✅ Índice único en Users-InkBlack.email');

  // Agenda
  await db.collection('citas').createIndex({ fecha: 1, hora: 1 }, { name: 'citas_fecha_hora' });
  await db.collection('citas').createIndex({ estado: 1 }, { name: 'citas_estado' });
  console.log('✅ Índices en citas (fecha/hora, estado)');

  // Inventario
  await db.collection('productos').createIndex({ nombre: 1 }, { name: 'productos_nombre' });
  console.log('✅ Índice en productos.nombre');

  // Recetas de kits
  await db.collection('kits_insumos').createIndex(
    { kit_nombre: 1 },
    { name: 'kits_nombre' }
  );
  await db.collection('kits_insumos').createIndex(
    { nombre_kit: 1 },
    { name: 'kits_nombre_legacy' }
  );
  await db.collection('kits_insumos').createIndex(
    { productoId: 1 },
    { name: 'kits_producto' }
  );
  console.log('✅ Índices en kits_insumos');

  // Histórico de movimientos
  await db.collection('movimientos').createIndex({ productoId: 1 }, { name: 'mov_producto' });
  await db.collection('movimientos').createIndex({ fecha: -1 }, { name: 'mov_fecha' });
  await db.collection('movimientos').createIndex(
    { citaId: 1 },
    { name: 'mov_cita', sparse: true }
  );
  console.log('✅ Índices en movimientos');

  const resumen = {
    usuarios: await db.collection('Users-InkBlack').countDocuments(),
    citas: await db.collection('citas').countDocuments(),
    productos: await db.collection('productos').countDocuments(),
    kits: await db.collection('kits_insumos').countDocuments(),
    movimientos: await db.collection('movimientos').countDocuments(),
  };

  console.log('\n📊 Documentos actuales:');
  for (const [coleccion, total] of Object.entries(resumen)) {
    console.log(`   ${coleccion}: ${total}`);
  }

  if (resumen.kits === 0) {
    console.log(
      '\n⚠️  No hay recetas en "kits_insumos". Regístralas en MongoDB con esta forma:\n' +
        '   { kit_nombre: "Kit Estándar", insumo_nombre: "Agujas 3RL", cantidad_a_descontar: 1 }'
    );
  }

  console.log('\n✨ Base de datos lista.\n');
}

main()
  .catch((err) => {
    console.error('❌ Error preparando la base de datos:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.close();
  });
