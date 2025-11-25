/**
 * Utilidades para manejo de rate limiting y reintentos
 */

import { RATE_LIMITS, RETRY_CONFIG } from './config';

// ============================================
// RATE LIMITER
// ============================================

export class RateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private lastRequestTime = 0;
  private requestCount = 0;
  private minuteStartTime = Date.now();

  constructor(
    private source: 'ANILIST'
  ) {}

  /**
   * Agrega una petición a la cola con rate limiting
   */
  async schedule<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  private async processQueue(): Promise<void> {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;
    const task = this.queue.shift()!;

    // Verificar límites por minuto
    const now = Date.now();
    const minuteElapsed = now - this.minuteStartTime;

    if (minuteElapsed >= 60000) {
      // Resetear contador cada minuto
      this.requestCount = 0;
      this.minuteStartTime = now;
    }

    const limits = RATE_LIMITS.ANILIST;

    // Si alcanzamos el límite por minuto, esperar
    if (this.requestCount >= limits.REQUESTS_PER_MINUTE) {
      const waitTime = 60000 - minuteElapsed;
      console.log(`⏳ Rate limit alcanzado para ${this.source}. Esperando ${Math.ceil(waitTime / 1000)}s...`);
      await sleep(waitTime);
      this.requestCount = 0;
      this.minuteStartTime = Date.now();
    }

    // Asegurar delay mínimo entre requests
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < limits.DELAY_BETWEEN_REQUESTS) {
      await sleep(limits.DELAY_BETWEEN_REQUESTS - timeSinceLastRequest);
    }

    // Ejecutar tarea
    this.lastRequestTime = Date.now();
    this.requestCount++;

    await task();

    // Procesar siguiente
    this.processQueue();
  }

  /**
   * Obtiene estadísticas del rate limiter
   */
  getStats() {
    return {
      source: this.source,
      queueLength: this.queue.length,
      requestCount: this.requestCount,
      minuteStartTime: new Date(this.minuteStartTime).toISOString(),
    };
  }
}

// ============================================
// RETRY CON EXPONENTIAL BACKOFF
// ============================================

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  context: string = 'Request'
): Promise<T> {
  let lastError: Error | null = null;
  let delay = RETRY_CONFIG.INITIAL_DELAY;

  for (let attempt = 1; attempt <= RETRY_CONFIG.MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // No reintentar en ciertos casos
      if (error.statusCode === 404 || error.statusCode === 401) {
        throw error;
      }

      if (attempt === RETRY_CONFIG.MAX_RETRIES) {
        console.error(`❌ ${context}: Falló después de ${attempt} intentos`);
        break;
      }

      // Calcular delay con exponential backoff
      const jitter = Math.random() * 1000; // Random jitter
      const waitTime = Math.min(delay + jitter, RETRY_CONFIG.MAX_DELAY);

      console.warn(
        `⚠️ ${context}: Intento ${attempt}/${RETRY_CONFIG.MAX_RETRIES} falló. ` +
        `Reintentando en ${Math.ceil(waitTime / 1000)}s... ` +
        `Error: ${error.message}`
      );

      await sleep(waitTime);
      delay *= RETRY_CONFIG.BACKOFF_MULTIPLIER;
    }
  }

  throw lastError || new Error(`${context} falló después de ${RETRY_CONFIG.MAX_RETRIES} intentos`);
}

// ============================================
// UTILIDADES
// ============================================

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calcula el progreso porcentual
 */
export function calculateProgress(current: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((current / total) * 100);
}

/**
 * Formatea bytes a formato legible
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Formatea duración en ms a formato legible
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

/**
 * Estima tiempo restante basado en velocidad actual
 */
export function estimateTimeRemaining(
  processed: number,
  total: number,
  startTime: number
): string {
  if (processed === 0) return 'Calculando...';
  
  const elapsed = Date.now() - startTime;
  const rate = processed / elapsed; // items por ms
  const remaining = total - processed;
  const estimatedMs = remaining / rate;
  
  return formatDuration(estimatedMs);
}

/**
 * Chunking de arrays
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Validar si un objeto tiene las propiedades requeridas
 */
export function validateRequired<T extends object>(
  obj: T,
  requiredFields: (keyof T)[],
  context: string
): void {
  const missing = requiredFields.filter(field => !obj[field]);
  
  if (missing.length > 0) {
    throw new Error(
      `${context}: Campos requeridos faltantes: ${missing.join(', ')}`
    );
  }
}

/**
 * Sanitizar texto para evitar inyección SQL
 */
export function sanitizeText(text: string | null | undefined, maxLength: number = 5000): string | null {
  if (!text) return null;
  return text
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Control characters
    .trim()
    .substring(0, maxLength); // Límite de longitud
}

/**
 * Parsear fecha de diferentes formatos
 */
export function parseDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date;
  } catch {
    return null;
  }
}

/**
 * Normalizar rating (convertir a escala 0-10)
 */
export function normalizeRating(
  rating: number | null | undefined,
  scale: number = 10
): number | null {
  if (rating === null || rating === undefined || rating === 0) return null;
  
  if (scale === 10) return rating;
  if (scale === 100) return rating / 10;
  if (scale === 5) return rating * 2;
  
  return rating;
}

/**
 * Extraer año de fecha
 */
export function extractYear(date: Date | string | null): number | null {
  if (!date) return null;
  
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.getFullYear();
  } catch {
    return null;
  }
}

/**
 * Detectar país de origen por tipo y título
 */
export function detectCountry(
  type: string,
  title: string | null
): 'JP' | 'CN' | 'KR' | null {
  // Basado en tipo
  if (type.toLowerCase().includes('donghua')) return 'CN';
  if (type.toLowerCase().includes('manhua')) return 'CN';
  if (type.toLowerCase().includes('manhwa')) return 'KR';
  
  // Por defecto para anime/manga
  if (type.toLowerCase().includes('anime') || type.toLowerCase().includes('manga')) {
    return 'JP';
  }
  
  return null;
}

/**
 * Crear slug único a partir de título
 */
export function createSlug(title: string, id: number): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 200);
  
  return `${slug}-${id}`;
}
