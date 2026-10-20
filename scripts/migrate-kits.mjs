import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;

if (!uri || !dbName) {
  console.error('❌ Faltan MONGODB_URI o DB_NAME. Ejecuta: npm run migrate:kits');
  process.exit(1);
}

const client = new MongoClient(uri);

const MODO = process.argv.includes('--apply') ? 'apply' : 'dry-run';

function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function main() {
  await client.connect();
  const db = client.db(dbName);
  const productos = db.collection('productos');
  const kits = db.collection('kits_insumos');

  console.log(`\n🧪 Migración de recetas (${MODO})\n`);

  let revisados = 0;
  let migrados = 0;
  let sinProducto = 0;

  const recetas = await kits.find({}).toArray();

  for (const receta of recetas) {
    revisados += 1;

    if (receta.productoId) continue;

    const nombre = String(receta.insumo_nombre || '').trim();
    if (!nombre) {
      sinProducto += 1;
      console.log(`   ⚠️  Receta ${receta._id} sin insumo_nombre`);
      continue;
    }

    const producto = await productos.findOne({
      nombre: { $regex: `^${escapeRegex(nombre)}$`, $options: 'i' },
    });

    if (!producto) {
      sinProducto += 1;
      console.log(`   ⚠️  No existe el producto "${nombre}" (kit: ${receta.kit_nombre || receta.nombre_kit || '?'})`);
      continue;
    }

    if (MODO === 'apply') {
      await kits.updateOne({ _id: receta._id }, { $set: { productoId: producto._id } });
    }

    migrados += 1;
    console.log(
      `   ✅ ${receta.kit_nombre || receta.nombre_kit || '?'} → ${nombre} (${producto._id})`
    );
  }

  // Normalizar stock numérico en productos
  const productosTodos = await productos.find({}).toArray();
  let normalizados = 0;

  for (const producto of productosTodos) {
    const stock = Number(producto.stock_actual);
    const minimo = Number(producto.stock_minimo);

    if (producto.stock_actual !== stock || producto.stock_minimo !== minimo) {
      normalizados += 1;
      if (MODO === 'apply') {
        await productos.updateOne(
          { _id: producto._id },
          {
            $set: {
              stock_actual: Number.isFinite(stock) ? stock : 0,
              stock_minimo: Number.isFinite(minimo) ? minimo : 5,
              updatedAt: new Date(),
            },
          }
        );
      }
    }
  }

  console.log('\n📊 Resumen:');
  console.log(`   Recetas revisadas: ${revisados}`);
  console.log(`   Recetas a migrar: ${migrados}`);
  console.log(`   Sin producto asociado: ${sinProducto}`);
  console.log(`   Productos con stock a normalizar: ${normalizados}`);

  if (MODO === 'dry-run') {
    console.log('\nℹ️  Esto fue una simulación. Para aplicar los cambios ejecuta:');
    console.log('   npm run migrate:kits -- --apply\n');
  } else {
    console.log('\n✨ Migración aplicada.\n');
  }
}

main()
  .catch((err) => {
    console.error('❌ Error en la migración:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.close();
  });
