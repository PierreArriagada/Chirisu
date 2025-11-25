/**
 * Sistema de checkpoints para guardar y recuperar progreso de importación
 */

import fs from 'fs/promises';
import path from 'path';
import { CHECKPOINT_CONFIG } from './config';

// ============================================
// TIPOS
// ============================================

export interface CheckpointData {
  source: 'MAL' | 'ANILIST' | 'KITSU';
  mediaType: 'anime' | 'manga' | 'novels' | 'donghua' | 'manhua' | 'manhwa';
  
  // Progreso
  lastProcessedId: number | null;
  lastProcessedPage: number;
  totalProcessed: number;
  totalImported: number;
  totalSkipped: number;
  totalErrors: number;
  
  // Timestamps
  startedAt: string;
  lastUpdatedAt: string;
  
  // Estado
  status: 'running' | 'paused' | 'completed' | 'error';
  errorMessage?: string;
  
  // Estadísticas
  stats: {
    itemsPerMinute: number;
    averageResponseTime: number;
    retryCount: number;
  };
}

export interface CheckpointSummary {
  source: string;
  mediaType: string;
  progress: string;
  status: string;
  lastUpdated: string;
  itemsPerMinute: number;
}

// ============================================
// CHECKPOINT MANAGER
// ============================================

export class CheckpointManager {
  private checkpointsDir: string;

  constructor() {
    this.checkpointsDir = CHECKPOINT_CONFIG.DIR;
  }

  /**
   * Inicializar directorio de checkpoints
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.checkpointsDir, { recursive: true });
      console.log(`✅ Directorio de checkpoints inicializado: ${this.checkpointsDir}`);
    } catch (error: any) {
      throw new Error(`Error al crear directorio de checkpoints: ${error.message}`);
    }
  }

  /**
   * Guardar checkpoint
   */
  async save(data: CheckpointData): Promise<void> {
    const filename = this.getFilename(data.source, data.mediaType);
    const filepath = path.join(this.checkpointsDir, filename);

    try {
      await fs.writeFile(
        filepath,
        JSON.stringify(data, null, 2),
        'utf-8'
      );

      // Log simple en consola
      console.log(
        `💾 Checkpoint guardado: ${data.source} ${data.mediaType} ` +
        `(Procesados: ${data.totalProcessed}, Página: ${data.lastProcessedPage})`
      );
    } catch (error: any) {
      console.error(`❌ Error al guardar checkpoint: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cargar checkpoint
   */
  async load(
    source: 'MAL' | 'ANILIST' | 'KITSU',
    mediaType: 'anime' | 'manga' | 'novels' | 'donghua' | 'manhua' | 'manhwa'
  ): Promise<CheckpointData | null> {
    const filename = this.getFilename(source, mediaType);
    const filepath = path.join(this.checkpointsDir, filename);

    try {
      const content = await fs.readFile(filepath, 'utf-8');
      const data: CheckpointData = JSON.parse(content);

      console.log(
        `📂 Checkpoint cargado: ${source} ${mediaType} ` +
        `(Procesados: ${data.totalProcessed}, Página: ${data.lastProcessedPage})`
      );

      return data;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.log(`📝 No existe checkpoint anterior para ${source} ${mediaType}`);
        return null;
      }
      console.error(`❌ Error al cargar checkpoint: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crear checkpoint inicial
   */
  createInitial(
    source: 'MAL' | 'ANILIST' | 'KITSU',
    mediaType: 'anime' | 'manga' | 'novels' | 'donghua' | 'manhua' | 'manhwa'
  ): CheckpointData {
    const now = new Date().toISOString();

    return {
      source,
      mediaType,
      lastProcessedId: null,
      lastProcessedPage: 0,
      totalProcessed: 0,
      totalImported: 0,
      totalSkipped: 0,
      totalErrors: 0,
      startedAt: now,
      lastUpdatedAt: now,
      status: 'running',
      stats: {
        itemsPerMinute: 0,
        averageResponseTime: 0,
        retryCount: 0,
      },
    };
  }

  /**
   * Actualizar checkpoint con nuevo progreso
   */
  async update(
    checkpoint: CheckpointData,
    updates: {
      lastProcessedId?: number | null;
      lastProcessedPage?: number;
      totalProcessed?: number;
      totalImported?: number;
      totalSkipped?: number;
      totalErrors?: number;
      status?: CheckpointData['status'];
      errorMessage?: string;
      stats?: Partial<CheckpointData['stats']>;
    }
  ): Promise<CheckpointData> {
    const updated: CheckpointData = {
      ...checkpoint,
      ...updates,
      lastUpdatedAt: new Date().toISOString(),
      stats: {
        ...checkpoint.stats,
        ...updates.stats,
      },
    };

    // Calcular items por minuto
    const startTime = new Date(checkpoint.startedAt).getTime();
    const elapsed = Date.now() - startTime;
    const minutes = elapsed / 60000;
    if (minutes > 0 && updated.totalProcessed > 0) {
      updated.stats.itemsPerMinute = Math.round(updated.totalProcessed / minutes);
    }

    await this.save(updated);
    return updated;
  }

  /**
   * Marcar checkpoint como completado
   */
  async complete(checkpoint: CheckpointData): Promise<void> {
    await this.update(checkpoint, {
      status: 'completed',
    });

    console.log(
      `✅ Importación completada: ${checkpoint.source} ${checkpoint.mediaType}\n` +
      `   Total procesados: ${checkpoint.totalProcessed}\n` +
      `   Importados: ${checkpoint.totalImported}\n` +
      `   Saltados: ${checkpoint.totalSkipped}\n` +
      `   Errores: ${checkpoint.totalErrors}\n` +
      `   Velocidad: ${checkpoint.stats.itemsPerMinute} items/min`
    );
  }

  /**
   * Marcar checkpoint como pausado
   */
  async pause(checkpoint: CheckpointData, reason?: string): Promise<void> {
    await this.update(checkpoint, {
      status: 'paused',
      errorMessage: reason,
    });

    console.log(`⏸️ Importación pausada: ${checkpoint.source} ${checkpoint.mediaType}`);
    if (reason) console.log(`   Razón: ${reason}`);
  }

  /**
   * Marcar checkpoint como error
   */
  async error(checkpoint: CheckpointData, errorMessage: string): Promise<void> {
    await this.update(checkpoint, {
      status: 'error',
      errorMessage,
    });

    console.error(
      `❌ Importación con error: ${checkpoint.source} ${checkpoint.mediaType}\n` +
      `   Error: ${errorMessage}`
    );
  }

  /**
   * Eliminar checkpoint
   */
  async delete(
    source: 'MAL' | 'ANILIST' | 'KITSU',
    mediaType: 'anime' | 'manga' | 'novels' | 'donghua' | 'manhua' | 'manhwa'
  ): Promise<void> {
    const filename = this.getFilename(source, mediaType);
    const filepath = path.join(this.checkpointsDir, filename);

    try {
      await fs.unlink(filepath);
      console.log(`🗑️ Checkpoint eliminado: ${source} ${mediaType}`);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        console.error(`❌ Error al eliminar checkpoint: ${error.message}`);
      }
    }
  }

  /**
   * Listar todos los checkpoints
   */
  async listAll(): Promise<CheckpointSummary[]> {
    try {
      const files = await fs.readdir(this.checkpointsDir);
      const checkpoints: CheckpointSummary[] = [];

      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        const filepath = path.join(this.checkpointsDir, file);
        const content = await fs.readFile(filepath, 'utf-8');
        const data: CheckpointData = JSON.parse(content);

        const progress = data.totalProcessed > 0
          ? `${data.totalProcessed} items (${data.totalImported} importados)`
          : 'No iniciado';

        checkpoints.push({
          source: data.source,
          mediaType: data.mediaType,
          progress,
          status: data.status,
          lastUpdated: new Date(data.lastUpdatedAt).toLocaleString('es-ES'),
          itemsPerMinute: data.stats.itemsPerMinute,
        });
      }

      return checkpoints;
    } catch (error: any) {
      console.error(`❌ Error al listar checkpoints: ${error.message}`);
      return [];
    }
  }

  /**
   * Limpiar checkpoints antiguos
   */
  async cleanup(daysOld: number = 30): Promise<void> {
    try {
      const files = await fs.readdir(this.checkpointsDir);
      const now = Date.now();
      const maxAge = daysOld * 24 * 60 * 60 * 1000;
      let cleaned = 0;

      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        const filepath = path.join(this.checkpointsDir, file);
        const stats = await fs.stat(filepath);
        const age = now - stats.mtimeMs;

        if (age > maxAge) {
          await fs.unlink(filepath);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        console.log(`🧹 Limpiados ${cleaned} checkpoints antiguos (>${daysOld} días)`);
      }
    } catch (error: any) {
      console.error(`❌ Error al limpiar checkpoints: ${error.message}`);
    }
  }

  /**
   * Mostrar resumen de checkpoint
   */
  async showSummary(
    source: 'MAL' | 'ANILIST' | 'KITSU',
    mediaType: 'anime' | 'manga' | 'novels' | 'donghua' | 'manhua' | 'manhwa'
  ): Promise<void> {
    const checkpoint = await this.load(source, mediaType);

    if (!checkpoint) {
      console.log(`ℹ️ No existe checkpoint para ${source} ${mediaType}`);
      return;
    }

    const duration = Date.now() - new Date(checkpoint.startedAt).getTime();
    const hours = Math.floor(duration / 3600000);
    const minutes = Math.floor((duration % 3600000) / 60000);

    console.log(`
╔═══════════════════════════════════════════════════════════════
║ RESUMEN DE CHECKPOINT
╠═══════════════════════════════════════════════════════════════
║ Fuente:          ${checkpoint.source}
║ Tipo de Media:   ${checkpoint.mediaType}
║ Estado:          ${checkpoint.status}
╠═══════════════════════════════════════════════════════════════
║ PROGRESO
╠═══════════════════════════════════════════════════════════════
║ Total Procesados:  ${checkpoint.totalProcessed}
║ Importados:        ${checkpoint.totalImported}
║ Saltados:          ${checkpoint.totalSkipped}
║ Errores:           ${checkpoint.totalErrors}
║ Última Página:     ${checkpoint.lastProcessedPage}
║ Último ID:         ${checkpoint.lastProcessedId || 'N/A'}
╠═══════════════════════════════════════════════════════════════
║ ESTADÍSTICAS
╠═══════════════════════════════════════════════════════════════
║ Items/minuto:      ${checkpoint.stats.itemsPerMinute}
║ Tiempo Resp. Prom: ${checkpoint.stats.averageResponseTime}ms
║ Reintentos:        ${checkpoint.stats.retryCount}
╠═══════════════════════════════════════════════════════════════
║ TIEMPO
╠═══════════════════════════════════════════════════════════════
║ Iniciado:          ${new Date(checkpoint.startedAt).toLocaleString('es-ES')}
║ Última Act.:       ${new Date(checkpoint.lastUpdatedAt).toLocaleString('es-ES')}
║ Duración:          ${hours}h ${minutes}m
╚═══════════════════════════════════════════════════════════════
    `);

    if (checkpoint.errorMessage) {
      console.log(`⚠️ Error: ${checkpoint.errorMessage}\n`);
    }
  }

  /**
   * Generar nombre de archivo para checkpoint
   */
  private getFilename(
    source: 'MAL' | 'ANILIST' | 'KITSU',
    mediaType: string
  ): string {
    return `${source.toLowerCase()}_${mediaType}.json`;
  }
}

// ============================================
// INSTANCIA SINGLETON
// ============================================

export const checkpointManager = new CheckpointManager();
