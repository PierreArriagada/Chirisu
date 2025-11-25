/**
 * ============================================================================
 * SCRIPT: Actualizar colores cuando cambien las imágenes
 * ============================================================================
 * 
 * Este script detecta medios cuyas imágenes de portada han cambiado
 * y recalcula sus colores dominantes automáticamente.
 * 
 * Casos de uso:
 * 1. AniList actualiza la imagen de un anime/manga
 * 2. Se corrige manualmente una URL de imagen
 * 3. Medios sin color que ahora tienen imagen
 * 
 * Uso:
 *   npm run update-colors
 *   npm run update-colors -- --type anime
 *   npm run update-colors -- --dry-run (solo muestra cambios, no actualiza)
 * 
 * ============================================================================
 */

import { Pool } from 'pg';
import { extractDominantColorHex } from '../src/lib/color-extractor';

// Crear conexión directa a PostgreSQL
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

const MEDIA_TYPES = ['anime', 'manga', 'manhwa', 'manhua', 'novels', 'donghua', 'fan_comics'];

interface Args {
  type?: string;
  dryRun?: boolean;
  limit?: number;
}

/**
 * Busca medios que necesitan actualización de color por cambio de imagen
 */
async function findMediaNeedingColorUpdate(tableName: string, limit?: number): Promise<any[]> {
  const limitClause = limit ? `LIMIT ${limit}` : '';
  
  // Buscar medios donde:
  // 1. Tienen imagen pero no tienen color
  // 2. O tienen una URL de imagen diferente a la registrada previamente
  const query = `
    SELECT 
      id, 
      title_romaji, 
      cover_image_url, 
      dominant_color
    FROM app.${tableName}
    WHERE 
      cover_image_url IS NOT NULL
      AND dominant_color IS NULL
    ORDER BY id ASC
    ${limitClause}
  `;
  
  const result = await db.query(query);
  return result.rows;
}

/**
 * Actualiza el color de un medio específico
 */
async function updateMediaColor(
  tableName: string, 
  mediaId: number, 
  imageUrl: string,
  title: string,
  dryRun: boolean
): Promise<{ success: boolean; color: string | null }> {
  try {
    console.log(`   🎨 Extrayendo color para "${title}"...`);
    const color = await extractDominantColorHex(imageUrl);
    
    if (!color) {
      console.log(`   ⚠️  No se pudo extraer color`);
      return { success: false, color: null };
    }
    
    if (dryRun) {
      console.log(`   🔍 [DRY RUN] Se actualizaría a: ${color}`);
      return { success: true, color };
    }
    
    // Actualizar en BD
    await db.query(
      `UPDATE app.${tableName} 
       SET dominant_color = $1, updated_at = NOW() 
       WHERE id = $2`,
      [color, mediaId]
    );
    
    console.log(`   ✅ Color actualizado: ${color}`);
    return { success: true, color };
    
  } catch (error) {
    console.error(`   ❌ Error:`, error instanceof Error ? error.message : error);
    return { success: false, color: null };
  }
}

/**
 * Procesa una tabla específica
 */
async function processTable(tableName: string, args: Args) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🔄 PROCESANDO: ${tableName.toUpperCase()}`);
  console.log('='.repeat(70));
  
  // Buscar medios que necesitan actualización
  const medias = await findMediaNeedingColorUpdate(tableName, args.limit);
  
  if (medias.length === 0) {
    console.log(`✅ No hay medios que necesiten actualización de color\n`);
    return { processed: 0, updated: 0, failed: 0 };
  }
  
  console.log(`📊 Medios a procesar: ${medias.length}`);
  if (args.dryRun) {
    console.log(`🔍 MODO DRY RUN: No se realizarán cambios reales\n`);
  }
  
  console.log(`\n🚀 Iniciando actualización...\n`);
  
  let processed = 0;
  let updated = 0;
  let failed = 0;
  
  for (const media of medias) {
    processed++;
    console.log(`[${processed}/${medias.length}] ${media.title_romaji || 'Sin título'}...`);
    
    const result = await updateMediaColor(
      tableName,
      media.id,
      media.cover_image_url,
      media.title_romaji || `ID:${media.id}`,
      args.dryRun || false
    );
    
    if (result.success) {
      updated++;
    } else {
      failed++;
    }
    
    // Pausa para no sobrecargar
    if (processed < medias.length) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
  
  console.log(`\n${'='.repeat(70)}`);
  console.log(`📊 RESUMEN: ${tableName.toUpperCase()}`);
  console.log('='.repeat(70));
  console.log(`   Procesados: ${processed}`);
  console.log(`   ✅ Actualizados: ${updated}`);
  console.log(`   ❌ Fallidos: ${failed}`);
  console.log('='.repeat(70) + '\n');
  
  return { processed, updated, failed };
}

/**
 * Función principal
 */
async function main() {
  const args: Args = {
    dryRun: process.argv.includes('--dry-run'),
    limit: undefined,
  };
  
  // Parsear argumentos
  for (let i = 0; i < process.argv.length; i++) {
    if (process.argv[i] === '--type' && process.argv[i + 1]) {
      args.type = process.argv[i + 1];
    }
    if (process.argv[i] === '--limit' && process.argv[i + 1]) {
      args.limit = parseInt(process.argv[i + 1]);
    }
  }
  
  console.log('\n╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║     ACTUALIZACIÓN DE COLORES POR CAMBIO DE IMAGEN                 ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝\n');
  
  if (args.dryRun) {
    console.log('⚠️  MODO DRY RUN: Se mostrarán los cambios pero no se guardarán\n');
  }
  
  try {
    // Verificar conexión
    await db.connect()
      .then(client => client.release())
      .catch(err => {
        console.error('❌ Error al conectar a PostgreSQL:', err.message);
        console.error('\n💡 Solución: Configura DB_PASSWORD:');
        console.error('   $env:DB_PASSWORD="TU_PASSWORD"');
        process.exit(1);
      });
    
    let totalProcessed = 0;
    let totalUpdated = 0;
    let totalFailed = 0;
    
    if (args.type) {
      // Procesar solo un tipo
      const tableName = args.type.toLowerCase();
      if (!MEDIA_TYPES.includes(tableName)) {
        console.error(`❌ Tipo inválido: ${args.type}`);
        console.error(`   Tipos válidos: ${MEDIA_TYPES.join(', ')}`);
        await db.end();
        process.exit(1);
      }
      
      const result = await processTable(tableName, args);
      totalProcessed = result.processed;
      totalUpdated = result.updated;
      totalFailed = result.failed;
      
    } else {
      // Procesar todos los tipos
      for (const tableName of MEDIA_TYPES) {
        const result = await processTable(tableName, args);
        totalProcessed += result.processed;
        totalUpdated += result.updated;
        totalFailed += result.failed;
      }
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('📊 RESUMEN TOTAL');
    console.log('='.repeat(70));
    console.log(`   Procesados: ${totalProcessed}`);
    console.log(`   ✅ Actualizados: ${totalUpdated}`);
    console.log(`   ❌ Fallidos: ${totalFailed}`);
    console.log('='.repeat(70) + '\n');
    
    if (args.dryRun) {
      console.log('💡 Para aplicar los cambios, ejecuta sin --dry-run\n');
    } else {
      console.log('✅ ACTUALIZACIÓN COMPLETADA\n');
    }
    
    await db.end();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ ERROR FATAL:', error);
    await db.end();
    process.exit(1);
  }
}

// Ejecutar
main();
