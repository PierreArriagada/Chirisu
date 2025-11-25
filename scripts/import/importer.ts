/**
 * Script principal de importación
 * Importa anime, manga, manhwa, manhua, novels desde AniList API
 */

import { Pool } from 'pg';
import { checkpointManager, CheckpointData } from './checkpoint-manager';
import { 
  anilistClient, 
  mapAniListToAnime, 
  mapAniListToManga, 
  getTableForAniListMedia,
  mapAniListCharacters,
  mapAniListVoiceActors,
  mapAniListStaff,
  mapAniListStudios,
  mapAniListRelations
} from './clients/anilist-client';
import { IMPORT_CONFIG, BATCH_CONFIG, validateConfig } from './config';
import { chunk, estimateTimeRemaining, formatDuration } from './utils';

// ============================================
// CONFIGURACIÓN DB
// ============================================

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'bd_chirisu',
  user: 'postgres',
  password: '123456',
});

// ============================================
// TIPOS
// ============================================

type MediaType = 'anime' | 'manga' | 'novels' | 'donghua' | 'manhua' | 'manhwa';
type Source = 'ANILIST';

interface ImportOptions {
  source: Source;
  mediaType: MediaType;
  limit?: number;
  resume?: boolean;
  dryRun?: boolean;
}

// ============================================
// IMPORTADOR PRINCIPAL
// ============================================

export class MediaImporter {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Importar desde AniList
   */
  async importFromAniList(
    mediaType: 'anime' | 'manga',
    options: { limit?: number; resume?: boolean; dryRun?: boolean } = {}
  ): Promise<void> {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🚀 INICIANDO IMPORTACIÓN DESDE ANILIST - ${mediaType.toUpperCase()}`);
    console.log(`${'='.repeat(70)}\n`);

    // Cargar o crear checkpoint
    let checkpoint = options.resume
      ? await checkpointManager.load('ANILIST', mediaType)
      : null;

    if (!checkpoint) {
      checkpoint = checkpointManager.createInitial('ANILIST', mediaType);
      await checkpointManager.save(checkpoint);
    }

    const startPage = Math.floor(checkpoint.lastProcessedPage / 50) + 1;
    const limit = options.limit || 10000;
    const perPage = 50;
    const startTime = Date.now();

    console.log(`📊 Configuración:`);
    console.log(`   Página inicial: ${startPage}`);
    console.log(`   Límite: ${limit} items`);
    console.log(`   Items por página: ${perPage}`);
    console.log(`   Dry run: ${options.dryRun ? 'Sí' : 'No'}`);
    console.log('');

    try {
      let page = startPage;
      let hasNextPage = true;

      while (hasNextPage && (page - startPage) * perPage < limit) {
        const batchStart = Date.now();

        // Fetch batch desde AniList
        console.log(`📥 Fetching página ${page} desde AniList...`);
        const response = await anilistClient.queryMedia(
          page,
          perPage,
          mediaType === 'anime' ? 'ANIME' : 'MANGA'
        );

        const items = response.Page.media;

        if (items.length === 0) {
          console.log('✅ No hay más items. Importación completada.');
          await checkpointManager.complete(checkpoint);
          break;
        }

        console.log(`   Recibidos: ${items.length} items (Página ${response.Page.pageInfo.currentPage}/${response.Page.pageInfo.lastPage})`);

        // Filtrar por tipo de tabla destino y mapear
        const processedItems: Array<{ 
          table: string; 
          data: any;
          characters: any[];
          staff: any[];
          studios: any[];
          relations?: any[];
          sourceItem: any;
        }> = [];

        for (const item of items) {
          const table = getTableForAniListMedia(item);
          
          // Solo procesar si coincide con el tipo solicitado
          if (
            (mediaType === 'anime' && (table === 'anime' || table === 'donghua')) ||
            (mediaType === 'manga' && ['manga', 'manhwa', 'manhua', 'novels'].includes(table))
          ) {
            const mappedData = item.type === 'ANIME'
              ? await mapAniListToAnime(item)
              : await mapAniListToManga(item);
            
            // Extraer personajes, staff y studios
            const characters = mapAniListCharacters(item);
            const staff = mapAniListStaff(item);
            const studios = mapAniListStudios(item);
            const relations = mapAniListRelations(item);
            
            processedItems.push({ 
              table, 
              data: mappedData,
              characters,
              staff,
              studios,
              relations,
              sourceItem: item
            });
          }
        }

        console.log(`   Procesados: ${processedItems.length} items`);

        // Agrupar por tabla y insertar
        if (!options.dryRun && processedItems.length > 0) {
          const byTable = processedItems.reduce((acc, item) => {
            if (!acc[item.table]) acc[item.table] = [];
            acc[item.table].push(item.data);
            return acc;
          }, {} as Record<string, any[]>);

          let totalImported = 0;
          let totalUpdated = 0;
          let totalErrors = 0;
          let totalCharacters = 0;
          let totalVoiceActors = 0;
          let totalStaff = 0;
          let totalStudios = 0;

          for (const [table, data] of Object.entries(byTable)) {
            const result = await this.bulkUpsert(table as MediaType, data);
            totalImported += result.imported;
            totalUpdated += result.updated;
            totalErrors += result.errors;
          }

          // Procesar personajes, actores de voz, staff y studios
          for (const item of processedItems) {
            // Obtener el ID del media recién insertado
            const mediaIdQuery = `SELECT id FROM app.${item.table} WHERE anilist_id = $1`;
            const mediaIdResult = await this.pool.query(mediaIdQuery, [item.sourceItem.id]);
            
            if (mediaIdResult.rows.length === 0) continue;
            const mediaId = mediaIdResult.rows[0].id;

            // Insertar personajes
            if (item.characters.length > 0) {
              const charCount = await this.upsertCharacters(item.characters);
              totalCharacters += charCount;
              
              // Vincular personajes con el anime/manga
              await this.linkCharactersToMedia(item.table, mediaId, item.characters);
              
              // Extraer y insertar actores de voz
              const voiceActors = mapAniListVoiceActors(item.characters);
              if (voiceActors.length > 0) {
                const vaCount = await this.upsertVoiceActors(voiceActors);
                totalVoiceActors += vaCount;
                
                // Vincular actores de voz con personajes (pasar mediaTable y mediaId)
                await this.linkVoiceActorsToCharacters(item.table, mediaId, item.characters);
              }
            }

            // Insertar staff
            if (item.staff.length > 0) {
              const staffCount = await this.upsertStaff(item.staff);
              totalStaff += staffCount;
              
              // Vincular staff con el anime/manga
              await this.linkStaffToMedia(item.table, mediaId, item.staff);
            }

            // Insertar géneros
            if (item.sourceItem.genres && item.sourceItem.genres.length > 0) {
              await this.insertGenres(item.table, mediaId, item.sourceItem.genres);
            }

            // Insertar studios
            if (item.studios.length > 0) {
              const studioCount = await this.insertStudios(item.table, mediaId, item.studios);
              totalStudios += studioCount;
            }

            // Insertar relaciones
            if (item.relations && item.relations.length > 0) {
              await this.insertRelations(item.table, mediaId, item.relations);
            }
          }

          console.log(`   ✅ Medios: ${totalImported} importados, ${totalUpdated} actualizados, ${totalErrors} errores`);
          console.log(`   ✅ Personajes: ${totalCharacters}, Actores de voz: ${totalVoiceActors}, Staff: ${totalStaff}, Studios: ${totalStudios}`);

          // Actualizar checkpoint
          checkpoint = await checkpointManager.update(checkpoint, {
            lastProcessedPage: page * perPage,
            totalProcessed: checkpoint.totalProcessed + processedItems.length,
            totalImported: checkpoint.totalImported + totalImported + totalUpdated,
            totalErrors: checkpoint.totalErrors + totalErrors,
          });
        } else if (options.dryRun) {
          console.log(`   🔍 DRY RUN - No se insertó en BD`);
        }

        // Estadísticas
        const batchDuration = Date.now() - batchStart;
        const totalDuration = Date.now() - startTime;
        const itemsPerMinute = (checkpoint.totalProcessed / (totalDuration / 60000)) || 0;
        const remaining = estimateTimeRemaining(checkpoint.totalProcessed, limit, startTime);

        console.log(`   ⏱️ Batch: ${formatDuration(batchDuration)} | Total: ${formatDuration(totalDuration)}`);
        console.log(`   📈 Velocidad: ${Math.round(itemsPerMinute)} items/min | Restante: ${remaining}`);
        console.log('');

        // Verificar si hay más páginas
        hasNextPage = response.Page.pageInfo.hasNextPage;
        page++;

        if (!hasNextPage) {
          console.log('✅ No hay más páginas. Importación completada.');
          await checkpointManager.complete(checkpoint);
          break;
        }
      }
    } catch (error: any) {
      console.error(`\n❌ Error durante importación: ${error.message}`);
      await checkpointManager.error(checkpoint, error.message);
      throw error;
    }

    console.log(`\n${'='.repeat(70)}`);
    console.log(`✅ IMPORTACIÓN COMPLETADA`);
    console.log(`${'='.repeat(70)}\n`);
    await checkpointManager.showSummary('ANILIST', mediaType);
  }

  /**
   * Inserción/actualización masiva en BD
   */
  private async bulkUpsert(
    table: MediaType,
    items: any[]
  ): Promise<{ imported: number; updated: number; errors: number }> {
    let imported = 0;
    let updated = 0;
    let errors = 0;

    for (const item of items) {
      try {
        // Determinar columnas dinámicamente
        const keys = Object.keys(item).filter(k => item[k] !== undefined);
        const values = keys.map(k => item[k]);

        // Construcción de query
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
        const updateSet = keys
          .filter(k => !['created_at'].includes(k))
          .map(k => `${k} = EXCLUDED.${k}`)
          .join(', ');

        // Usar anilist_id como constraint único (única fuente de datos)
        const uniqueConstraint = 'anilist_id';

        const query = `
          INSERT INTO app.${table} (${keys.join(', ')})
          VALUES (${placeholders})
          ON CONFLICT (${uniqueConstraint})
          DO UPDATE SET
            ${updateSet},
            updated_at = NOW()
          RETURNING (xmax = 0) AS inserted
        `;

        const result = await this.pool.query(query, values);
        
        if (result.rows[0]?.inserted) {
          imported++;
        } else {
          updated++;
        }
      } catch (error: any) {
        errors++;
        console.error(`      ⚠️ Error al insertar item: ${error.message}`);
      }
    }

    return { imported, updated, errors };
  }

  /**
   * Insertar o actualizar personajes
   */
  private async upsertCharacters(characters: any[]): Promise<number> {
    let count = 0;

    for (const char of characters) {
      try {
        // UPSERT usando slug como clave única
        const query = `
          INSERT INTO app.characters (
            name, name_romaji, name_native, image_url, description,
            gender, age, blood_type, date_of_birth, favorites_count, slug
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (slug) DO UPDATE SET
            name = EXCLUDED.name,
            name_romaji = EXCLUDED.name_romaji,
            name_native = EXCLUDED.name_native,
            image_url = EXCLUDED.image_url,
            description = EXCLUDED.description,
            gender = EXCLUDED.gender,
            age = EXCLUDED.age,
            blood_type = EXCLUDED.blood_type,
            date_of_birth = EXCLUDED.date_of_birth,
            favorites_count = GREATEST(app.characters.favorites_count, EXCLUDED.favorites_count),
            updated_at = NOW()
          RETURNING id, (xmax = 0) AS inserted
        `;

        const values = [
          char.name,
          char.name_romaji,
          char.name_native,
          char.image_url,
          char.description,
          char.gender,
          char.age,
          char.blood_type,
          char.date_of_birth,
          char.favorites_count,
          char.slug,
        ];

        const result = await this.pool.query(query, values);
        if (result.rows[0]?.inserted) {
          count++; // Solo contar como nuevo si fue INSERT
        }
      } catch (error: any) {
        console.error(`      ⚠️ Error al insertar personaje ${char.name}: ${error.message}`);
      }
    }

    return count;
  }

  /**
   * Relacionar personajes con anime/manga
   */
  private async linkCharactersToMedia(
    mediaTable: string,
    mediaId: number,
    characters: any[]
  ): Promise<void> {
    for (const char of characters) {
      try {
        // Buscar ID del personaje por slug (más confiable que name)
        const charResult = await this.pool.query(
          'SELECT id FROM app.characters WHERE slug = $1',
          [char.slug]
        );

        if (charResult.rows.length === 0) continue;

        const characterId = charResult.rows[0].id;

        // Insertar relación (role ya viene convertido del mapper)
        await this.pool.query(
          `INSERT INTO app.characterable_characters (
            character_id, characterable_type, characterable_id, role
          ) VALUES ($1, $2, $3, $4)
          ON CONFLICT (character_id, characterable_type, characterable_id) DO UPDATE SET
            role = EXCLUDED.role`,
          [characterId, mediaTable, mediaId, char.role]
        );
      } catch (error: any) {
        console.error(`      ⚠️ Error al vincular personaje: ${error.message}`);
      }
    }
  }

  /**
   * Insertar o actualizar actores de voz
   */
  private async upsertVoiceActors(voiceActors: any[]): Promise<number> {
    let count = 0;

    for (const va of voiceActors) {
      try {
        // UPSERT usando slug como clave única
        const query = `
          INSERT INTO app.voice_actors (
            name_romaji, name_native, image_url, language, bio,
            gender, date_of_birth, blood_type, hometown, favorites_count, slug
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (slug) DO UPDATE SET
            name_romaji = EXCLUDED.name_romaji,
            name_native = EXCLUDED.name_native,
            image_url = EXCLUDED.image_url,
            language = EXCLUDED.language,
            bio = EXCLUDED.bio,
            gender = EXCLUDED.gender,
            date_of_birth = EXCLUDED.date_of_birth,
            blood_type = EXCLUDED.blood_type,
            hometown = EXCLUDED.hometown,
            favorites_count = GREATEST(app.voice_actors.favorites_count, EXCLUDED.favorites_count),
            updated_at = NOW()
          RETURNING id, (xmax = 0) AS inserted
        `;

        const values = [
          va.name_romaji,
          va.name_native,
          va.image_url,
          va.language,
          va.bio,
          va.gender,
          va.date_of_birth,
          va.blood_type,
          va.hometown,
          va.favorites_count,
          va.slug,
        ];

        const result = await this.pool.query(query, values);
        if (result.rows[0]?.inserted) {
          count++; // Solo contar como nuevo si fue INSERT
        }
      } catch (error: any) {
        console.error(`      ⚠️ Error al insertar actor de voz ${va.name_romaji}: ${error.message}`);
      }
    }

    return count;
  }

  /**
   * Relacionar actores de voz con personajes
   */
  private async linkVoiceActorsToCharacters(
    mediaTable: string,
    mediaId: number,
    characters: any[]
  ): Promise<void> {
    for (const char of characters) {
      if (!char.voiceActors || char.voiceActors.length === 0) continue;

      try {
        // Buscar ID del personaje
        const charResult = await this.pool.query(
          'SELECT id FROM app.characters WHERE name = $1',
          [char.name]
        );

        if (charResult.rows.length === 0) continue;
        const characterId = charResult.rows[0].id;

        for (const va of char.voiceActors) {
          // Filtrar solo japonés y español
          const lang = va.languageV2?.toLowerCase();
          if (lang !== 'japanese' && lang !== 'spanish') continue;

          const language = lang === 'japanese' ? 'ja' : 'es';

          // Buscar ID del actor de voz
          const vaResult = await this.pool.query(
            'SELECT id FROM app.voice_actors WHERE name_romaji = $1 AND language = $2',
            [va.name.full, language]
          );

          if (vaResult.rows.length === 0) continue;
          const voiceActorId = vaResult.rows[0].id;

          // Insertar relación (con media_type y media_id requeridos)
          await this.pool.query(
            `INSERT INTO app.character_voice_actors (
              character_id, voice_actor_id, media_type, media_id
            ) VALUES ($1, $2, $3, $4)`,
            [characterId, voiceActorId, mediaTable, mediaId]
          );
        }
      } catch (error: any) {
        // Ignorar duplicados
        if (!error.message.includes('llave duplicada') && !error.message.includes('duplicate key')) {
          console.error(`      ⚠️ Error al vincular actor de voz: ${error.message}`);
        }
      }
    }
  }

  /**
   * Insertar o actualizar staff
   */
  private async upsertStaff(staff: any[]): Promise<number> {
    let count = 0;

    for (const s of staff) {
      try {
        const query = `
          INSERT INTO app.staff (
            anilist_id, name, slug, image_url, bio, gender, 
            date_of_birth, blood_type, hometown
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (slug) DO UPDATE SET
            name = EXCLUDED.name,
            image_url = EXCLUDED.image_url,
            bio = EXCLUDED.bio,
            gender = EXCLUDED.gender,
            date_of_birth = EXCLUDED.date_of_birth,
            blood_type = EXCLUDED.blood_type,
            hometown = EXCLUDED.hometown,
            updated_at = NOW()
          RETURNING (xmax = 0) AS inserted
        `;

        const values = [
          s.anilist_id,
          s.name,
          s.slug,
          s.image_url,
          s.bio,
          s.gender,
          s.date_of_birth,
          s.blood_type,
          s.hometown
        ];

        const result = await this.pool.query(query, values);
        if (result.rows[0]?.inserted) {
          count++;
        }
      } catch (error: any) {
        // Ignorar duplicados
        if (!error.message.includes('llave duplicada') && !error.message.includes('duplicate key')) {
          console.error(`      ⚠️ Error al insertar staff ${s.name}: ${error.message}`);
        }
      }
    }

    return count;
  }

  /**
   * Relacionar staff con anime/manga
   */
  private async linkStaffToMedia(
    mediaTable: string,
    mediaId: number,
    staff: any[]
  ): Promise<void> {
    for (const s of staff) {
      try {
        // Buscar ID del staff por slug (más confiable que por nombre)
        const staffResult = await this.pool.query(
          'SELECT id FROM app.staff WHERE slug = $1',
          [s.slug]
        );

        if (staffResult.rows.length === 0) continue;
        const staffId = staffResult.rows[0].id;

        // Insertar relación con ON CONFLICT para evitar duplicados
        await this.pool.query(
          `INSERT INTO app.staffable_staff (
            staff_id, staffable_type, staffable_id, role
          ) VALUES ($1, $2, $3, $4)
          ON CONFLICT (staff_id, staffable_type, staffable_id, role) DO NOTHING`,
          [staffId, mediaTable, mediaId, s.role]
        );
      } catch (error: any) {
        // Ignorar duplicados
        if (!error.message.includes('llave duplicada') && !error.message.includes('duplicate key')) {
          console.error(`      ⚠️ Error al vincular staff: ${error.message}`);
        }
      }
    }
  }

  /**
   * Insertar géneros y vincularlos con el medio
   */
  private async insertGenres(
    mediaTable: string,
    mediaId: number,
    genreNames: string[]
  ): Promise<void> {
    for (const genreName of genreNames) {
      try {
        // Buscar o crear género
        let genreResult = await this.pool.query(
          'SELECT id FROM app.genres WHERE code = $1',
          [genreName.toUpperCase()]
        );

        let genreId: number;

        if (genreResult.rows.length === 0) {
          // Crear género nuevo
          const insertResult = await this.pool.query(
            `INSERT INTO app.genres (code, name_es, name_en)
            VALUES ($1, $2, $3)
            RETURNING id`,
            [genreName.toUpperCase(), genreName, genreName]
          );
          genreId = insertResult.rows[0].id;
        } else {
          genreId = genreResult.rows[0].id;
        }

        // Crear relación género-medio (usar titleable_type y titleable_id)
        await this.pool.query(
          `INSERT INTO app.media_genres (genre_id, titleable_type, titleable_id)
          VALUES ($1, $2, $3)
          ON CONFLICT (titleable_type, titleable_id, genre_id) DO NOTHING`,
          [genreId, mediaTable, mediaId]
        );
      } catch (error: any) {
        // Ignorar duplicados
        if (!error.message.includes('llave duplicada') && !error.message.includes('duplicate key')) {
          console.error(`      ⚠️ Error al insertar género ${genreName}: ${error.message}`);
        }
      }
    }
  }

  /**
   * Insertar studios y vincularlos con el medio
   */
  private async insertStudios(
    mediaTable: string,
    mediaId: number,
    studios: any[]
  ): Promise<number> {
    let count = 0;

    for (const studio of studios) {
      try {
        // Buscar o crear studio
        let studioResult = await this.pool.query(
          'SELECT id FROM app.studios WHERE name = $1',
          [studio.name]
        );

        let studioId: number;

        if (studioResult.rows.length === 0) {
          // Crear studio nuevo
          const insertResult = await this.pool.query(
            `INSERT INTO app.studios (name)
            VALUES ($1)
            RETURNING id`,
            [studio.name]
          );
          studioId = insertResult.rows[0].id;
          count++;
        } else {
          studioId = studioResult.rows[0].id;
        }

        // Crear relación studio-medio
        await this.pool.query(
          `INSERT INTO app.studiable_studios (
            studio_id, studiable_type, studiable_id, is_main_studio
          )
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (studio_id, studiable_type, studiable_id) DO UPDATE SET
            is_main_studio = EXCLUDED.is_main_studio`,
          [studioId, mediaTable, mediaId, studio.isMainStudio]
        );
      } catch (error: any) {
        // Ignorar duplicados
        if (!error.message.includes('llave duplicada') && !error.message.includes('duplicate key')) {
          console.error(`      ⚠️ Error al insertar studio ${studio.name}: ${error.message}`);
        }
      }
    }

    return count;
  }

  /**
   * Insertar relaciones entre medios (anime-manga, sequels, etc.)
   */
  private async insertRelations(
    sourceTable: string,
    sourceMediaId: number,
    relations: any[]
  ): Promise<void> {
    for (const relation of relations) {
      try {
        // Determinar la tabla del medio relacionado según el tipo
        const relatedTableMap: Record<string, string> = {
          'anime': 'anime',
          'manga': 'manga',
        };
        
        const relatedTable = relatedTableMap[relation.related_type] || 'manga';

        // Buscar el medio relacionado por anilist_id en TODAS las tablas posibles
        // porque 'manga' puede estar en manga, manhwa, manhua o novels
        let relatedMediaId: number | null = null;
        
        if (relation.related_type === 'anime') {
          // Buscar en anime o donghua
          const animeResult = await this.pool.query(
            `SELECT id FROM app.anime WHERE anilist_id = $1
             UNION ALL
             SELECT id FROM app.donghua WHERE anilist_id = $1
             LIMIT 1`,
            [relation.related_anilist_id]
          );
          
          if (animeResult.rows.length > 0) {
            relatedMediaId = animeResult.rows[0].id;
          }
        } else {
          // Buscar en manga, manhwa, manhua, novels
          const mangaResult = await this.pool.query(
            `SELECT id FROM app.manga WHERE anilist_id = $1
             UNION ALL
             SELECT id FROM app.manhwa WHERE anilist_id = $1
             UNION ALL
             SELECT id FROM app.manhua WHERE anilist_id = $1
             UNION ALL
             SELECT id FROM app.novels WHERE anilist_id = $1
             LIMIT 1`,
            [relation.related_anilist_id]
          );
          
          if (mangaResult.rows.length > 0) {
            relatedMediaId = mangaResult.rows[0].id;
          }
        }

        // Si no se encontró el medio relacionado, skip (puede que aún no esté importado)
        if (!relatedMediaId) {
          continue;
        }

        // Insertar la relación
        await this.pool.query(
          `INSERT INTO app.media_relations (
            source_type, source_id, target_type, target_id, relation_type
          )
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (source_type, source_id, target_type, target_id) DO UPDATE SET
            relation_type = EXCLUDED.relation_type`,
          [sourceTable, sourceMediaId, relatedTable, relatedMediaId, relation.relation_type]
        );
      } catch (error: any) {
        // Ignorar duplicados
        if (!error.message.includes('llave duplicada') && !error.message.includes('duplicate key')) {
          console.error(`      ⚠️ Error al insertar relación: ${error.message}`);
        }
      }
    }
  }

  /**
   * Cerrar conexión a BD
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}

// ============================================
// FUNCIONES DE AYUDA
// ============================================

/**
 * Mostrar estado de todas las importaciones
 */
export async function showAllStatus(): Promise<void> {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`📊 ESTADO DE IMPORTACIONES`);
  console.log(`${'='.repeat(70)}\n`);

  const checkpoints = await checkpointManager.listAll();

  if (checkpoints.length === 0) {
    console.log('ℹ️ No hay importaciones en progreso o completadas.\n');
    return;
  }

  console.table(checkpoints);
  console.log('');
}

/**
 * Limpiar checkpoints antiguos
 */
export async function cleanupOldCheckpoints(days: number = 30): Promise<void> {
  await checkpointManager.cleanup(days);
}

// ============================================
// EXPORT
// ============================================

export { pool, checkpointManager };
