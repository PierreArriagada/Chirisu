#!/usr/bin/env node
/**
 * CLI para ejecutar importaciones desde APIs externas
 * 
 * Uso:
 *   npm run import -- --help
 *   npm run import -- --source anilist --type anime --limit 1000
 *   npm run import -- --source mal --type manga --resume
 *   npm run import -- --status
 *   npm run import -- --cleanup
 */

import { Command } from 'commander';
import { MediaImporter, showAllStatus, cleanupOldCheckpoints, pool, checkpointManager } from './importer';
import { validateConfig } from './config';

// ============================================
// CLI SETUP
// ============================================

const program = new Command();

program
  .name('import')
  .description('Importar anime, manga, manhwa, manhua, novels desde APIs externas (MyAnimeList, AniList)')
  .version('1.0.0');

// ============================================
// COMANDO: IMPORT
// ============================================

program
  .command('run')
  .description('Ejecutar importación desde AniList')
  .requiredOption('-s, --source <source>', 'Fuente de datos (solo anilist)')
  .requiredOption('-t, --type <type>', 'Tipo de media (anime, manga)')
  .option('-l, --limit <number>', 'Límite de items a importar', '10000')
  .option('-r, --resume', 'Continuar desde el último checkpoint', false)
  .option('-d, --dry-run', 'Ejecutar sin insertar en BD (solo prueba)', false)
  .action(async (options) => {
    try {
      // Validar configuración
      validateConfig();

      // Validar opciones
      const source = options.source.toUpperCase();
      if (source !== 'ANILIST') {
        console.error('❌ Error: source debe ser "anilist"');
        console.log('ℹ️ MyAnimeList fue removido. Solo AniList está soportado.');
        process.exit(1);
      }

      const type = options.type.toLowerCase();
      if (!['anime', 'manga'].includes(type)) {
        console.error('❌ Error: type debe ser "anime" o "manga"');
        process.exit(1);
      }

      const limit = parseInt(options.limit);
      if (isNaN(limit) || limit <= 0) {
        console.error('❌ Error: limit debe ser un número positivo');
        process.exit(1);
      }

      // Inicializar checkpoint manager
      await checkpointManager.initialize();

      // Crear importer
      const importer = new MediaImporter(pool);

      // Ejecutar importación desde AniList
      await importer.importFromAniList(type as 'anime' | 'manga', {
        limit,
        resume: options.resume,
        dryRun: options.dryRun,
      });

      // Cerrar conexiones
      await importer.close();
      process.exit(0);
    } catch (error: any) {
      console.error(`\n❌ Error fatal: ${error.message}`);
      console.error(error.stack);
      process.exit(1);
    }
  });

// ============================================
// COMANDO: STATUS
// ============================================

program
  .command('status')
  .description('Mostrar estado de todas las importaciones')
  .action(async () => {
    try {
      await checkpointManager.initialize();
      await showAllStatus();
      process.exit(0);
    } catch (error: any) {
      console.error(`❌ Error: ${error.message}`);
      process.exit(1);
    }
  });

// ============================================
// COMANDO: SUMMARY
// ============================================

program
  .command('summary')
  .description('Mostrar resumen detallado de una importación específica')
  .requiredOption('-s, --source <source>', 'Fuente (anilist)')
  .requiredOption('-t, --type <type>', 'Tipo (anime, manga, novels, donghua, manhua, manhwa)')
  .action(async (options) => {
    try {
      await checkpointManager.initialize();
      
      const source = options.source.toUpperCase() as 'ANILIST';
      const type = options.type.toLowerCase() as any;

      if (source !== 'ANILIST') {
        console.error('❌ Error: source debe ser "anilist"');
        process.exit(1);
      }

      await checkpointManager.showSummary(source, type);
      process.exit(0);
    } catch (error: any) {
      console.error(`❌ Error: ${error.message}`);
      process.exit(1);
    }
  });

// ============================================
// COMANDO: CLEANUP
// ============================================

program
  .command('cleanup')
  .description('Limpiar checkpoints antiguos')
  .option('-d, --days <number>', 'Días de antigüedad', '30')
  .action(async (options) => {
    try {
      await checkpointManager.initialize();
      
      const days = parseInt(options.days);
      if (isNaN(days) || days <= 0) {
        console.error('❌ Error: days debe ser un número positivo');
        process.exit(1);
      }

      await cleanupOldCheckpoints(days);
      process.exit(0);
    } catch (error: any) {
      console.error(`❌ Error: ${error.message}`);
      process.exit(1);
    }
  });

// ============================================
// COMANDO: DELETE
// ============================================

program
  .command('delete')
  .description('Eliminar checkpoint específico')
  .requiredOption('-s, --source <source>', 'Fuente (anilist)')
  .requiredOption('-t, --type <type>', 'Tipo (anime, manga, novels, donghua, manhua, manhwa)')
  .action(async (options) => {
    try {
      await checkpointManager.initialize();
      
      const source = options.source.toUpperCase() as 'ANILIST';
      const type = options.type.toLowerCase() as any;

      if (source !== 'ANILIST') {
        console.error('❌ Error: source debe ser "anilist"');
        process.exit(1);
      }

      await checkpointManager.delete(source, type);
      console.log(`✅ Checkpoint eliminado: ${source} ${type}`);
      process.exit(0);
    } catch (error: any) {
      console.error(`❌ Error: ${error.message}`);
      process.exit(1);
    }
  });

// ============================================
// COMANDO: ALL
// ============================================

program
  .command('all')
  .description('Importar todo desde AniList (anime + manga)')
  .requiredOption('-s, --source <source>', 'Fuente de datos (anilist)')
  .option('-l, --limit <number>', 'Límite de items por tipo', '10000')
  .option('-r, --resume', 'Continuar desde checkpoints', false)
  .option('-d, --dry-run', 'Ejecutar sin insertar en BD', false)
  .action(async (options) => {
    try {
      // Validar configuración
      validateConfig();

      const source = options.source.toUpperCase();
      if (source !== 'ANILIST') {
        console.error('❌ Error: source debe ser "anilist"');
        console.log('ℹ️ MyAnimeList fue removido. Solo AniList está soportado.');
        process.exit(1);
      }

      const limit = parseInt(options.limit);
      if (isNaN(limit) || limit <= 0) {
        console.error('❌ Error: limit debe ser un número positivo');
        process.exit(1);
      }

      // Inicializar
      await checkpointManager.initialize();
      const importer = new MediaImporter(pool);

      console.log(`\n${'='.repeat(70)}`);
      console.log(`🚀 IMPORTACIÓN MASIVA DESDE ANILIST`);
      console.log(`${'='.repeat(70)}\n`);

      // Importar anime
      await importer.importFromAniList('anime', {
        limit,
        resume: options.resume,
        dryRun: options.dryRun,
      });

      // Importar manga (incluye manhwa, manhua, novelas)
      await importer.importFromAniList('manga', {
        limit,
        resume: options.resume,
        dryRun: options.dryRun,
      });

      // Cerrar
      await importer.close();

      console.log(`\n${'='.repeat(70)}`);
      console.log(`✅ IMPORTACIÓN MASIVA COMPLETADA`);
      console.log(`${'='.repeat(70)}\n`);

      await showAllStatus();
      process.exit(0);
    } catch (error: any) {
      console.error(`\n❌ Error fatal: ${error.message}`);
      console.error(error.stack);
      process.exit(1);
    }
  });

// ============================================
// PARSE Y EJECUTAR
// ============================================

// Si no hay argumentos, mostrar ayuda
if (process.argv.length === 2) {
  program.help();
}

program.parse(process.argv);
