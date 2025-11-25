/**
 * ============================================================================
 * SCRIPT: Extraer colores de medios existentes sin color
 * ============================================================================
 * 
 * Este script procesa todos los medios que no tienen dominant_color
 * y extrae el color dominante de sus imágenes de portada.
 * 
 * Uso:
 *   npm run extract-colors
 *   npm run extract-colors -- --type anime
 *   npm run extract-colors -- --type manga --limit 100
 *   npm run extract-colors -- --force (recalcula todos, incluso los que tienen color)
 * 
 * ============================================================================
 */

import { Pool } from 'pg';
import { extractDominantColorHex } from '../src/lib/color-extractor';

// Crear conexión directa a PostgreSQL
// OPCIÓN 1: Usar DATABASE_URL (preferido)
// OPCIÓN 2: Usar credenciales individuales
const connectionString = process.env.DATABASE_URL;

const db = new Pool(
  connectionString 
    ? { connectionString }
    : {
        user: 'postgres',
        host: 'localhost',
        database: 'bd_chirisu',
        password: process.env.DB_PASSWORD || '',
        port: 5432,
      }
);

// Verificar conexión al iniciar
db.connect()
  .then(client => {
    console.log('✅ Conexión a PostgreSQL establecida');
    client.release();
  })
  .catch(err => {
    console.error('❌ Error al conectar a PostgreSQL:', err.message);
    console.error('\n💡 Solución:');
    console.error('   1. Configura DATABASE_URL:');
    console.error('      $env:DATABASE_URL="postgresql://postgres:TU_PASSWORD@localhost:5432/bd_chirisu"');
    console.error('   O');
    console.error('   2. Configura DB_PASSWORD:');
    console.error('      $env:DB_PASSWORD="TU_PASSWORD"');
    process.exit(1);
  });

interface Args {
  type?: string;
  limit?: number;
  force?: boolean;
}

const MEDIA_TYPES = ['anime', 'manga', 'manhwa', 'manhua', 'novels', 'donghua', 'fan_comics'];

const TABLE_MAP: Record<string, string> = {
  'anime': 'anime',
  'manga': 'manga',
  'manhwa': 'manhwa',
  'manhua': 'manhua',
  'novel': 'novels',
  'novels': 'novels',
  'donghua': 'donghua',
  'fan_comic': 'fan_comics',
  'fan_comics': 'fan_comics',
};

async function parseArgs(): Promise<Args> {
  const args: Args = {};
  
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    
    if (arg === '--type' || arg === '-t') {
      args.type = process.argv[++i];
    } else if (arg === '--limit' || arg === '-l') {
      args.limit = parseInt(process.argv[++i]);
    } else if (arg === '--force' || arg === '-f') {
      args.force = true;
    }
  }
  
  return args;
}

async function extractColorsForTable(
  tableName: string, 
  limit?: number,
  force: boolean = false
): Promise<void> {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🎨 PROCESANDO: ${tableName.toUpperCase()}`);
  console.log(`${'='.repeat(80)}\n`);

  // 1. Contar total de medios
  const countQuery = force
    ? `SELECT COUNT(*) as total FROM app.${tableName} WHERE cover_image_url IS NOT NULL`
    : `SELECT COUNT(*) as total FROM app.${tableName} WHERE cover_image_url IS NOT NULL AND dominant_color IS NULL`;
  
  const countResult = await db.query(countQuery);
  const total = parseInt(countResult.rows[0].total);
  
  if (total === 0) {
    console.log(`✅ No hay medios ${force ? '' : 'sin color '}en ${tableName}`);
    return;
  }
  
  console.log(`📊 Medios a procesar: ${total}`);
  if (limit) {
    console.log(`   Límite aplicado: ${limit}`);
  }
  
  // 2. Obtener medios sin color
  const selectQuery = force
    ? `
      SELECT id, title_romaji, cover_image_url, dominant_color
      FROM app.${tableName}
      WHERE cover_image_url IS NOT NULL
      ORDER BY id ASC
      ${limit ? `LIMIT ${limit}` : ''}
    `
    : `
      SELECT id, title_romaji, cover_image_url
      FROM app.${tableName}
      WHERE cover_image_url IS NOT NULL AND dominant_color IS NULL
      ORDER BY id ASC
      ${limit ? `LIMIT ${limit}` : ''}
    `;
  
  const selectResult = await db.query(selectQuery);
  const medias = selectResult.rows;
  
  console.log(`\n🚀 Iniciando extracción...\n`);
  
  // 3. Procesar cada medio
  let processed = 0;
  let success = 0;
  let errors = 0;
  let skipped = 0;
  
  for (const media of medias) {
    processed++;
    const progress = `[${processed}/${medias.length}]`;
    const title = media.title_romaji || `ID ${media.id}`;
    
    console.log(`${progress} ${title.substring(0, 50)}...`);
    
    try {
      // Extraer color
      const color = await extractDominantColorHex(media.cover_image_url);
      
      if (!color) {
        console.log(`   ⚠️  No se pudo extraer color`);
        errors++;
        continue;
      }
      
      // Guardar en BD
      const updateQuery = `
        UPDATE app.${tableName}
        SET dominant_color = $1, updated_at = NOW()
        WHERE id = $2
      `;
      
      await db.query(updateQuery, [color, media.id]);
      
      console.log(`   ✅ Color guardado: ${color}`);
      success++;
      
      // Pequeña pausa para no sobrecargar (50ms)
      await new Promise(resolve => setTimeout(resolve, 50));
      
    } catch (error) {
      console.error(`   ❌ Error:`, error instanceof Error ? error.message : error);
      errors++;
    }
  }
  
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📊 RESUMEN: ${tableName.toUpperCase()}`);
  console.log(`${'='.repeat(80)}`);
  console.log(`   Procesados: ${processed}`);
  console.log(`   ✅ Exitosos: ${success}`);
  console.log(`   ❌ Errores: ${errors}`);
  console.log(`   ⏭️  Omitidos: ${skipped}`);
  console.log(`${'='.repeat(80)}\n`);
}

async function main() {
  const args = await parseArgs();
  
  console.log('\n╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║     EXTRACCIÓN DE COLORES DOMINANTES PARA MEDIOS EXISTENTES      ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝\n');
  
  if (args.force) {
    console.log('⚠️  MODO FORZADO: Se recalcularán TODOS los colores, incluso los existentes\n');
  }
  
  try {
    if (args.type) {
      // Procesar un solo tipo
      const tableName = TABLE_MAP[args.type.toLowerCase()];
      
      if (!tableName) {
        console.error(`❌ Tipo inválido: ${args.type}`);
        console.error(`   Tipos válidos: ${Object.keys(TABLE_MAP).join(', ')}`);
        await db.end();
        process.exit(1);
      }
      
      await extractColorsForTable(tableName, args.limit, args.force);
      
    } else {
      // Procesar todos los tipos
      for (const tableName of MEDIA_TYPES) {
        await extractColorsForTable(tableName, args.limit, args.force);
      }
    }
    
    console.log('\n✅ PROCESO COMPLETADO\n');
    await db.end();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ ERROR FATAL:', error);
    await db.end();
    process.exit(1);
  }
}

main();
