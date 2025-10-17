/**
 * @fileoverview Rate Limiting Helper
 * Sistema simple de rate limiting en memoria para prevenir abuso de APIs
 * 
 * NOTA: En producción, usar Redis o similar para rate limiting distribuido
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Almacenamiento en memoria (por IP)
const store = new Map<string, RateLimitEntry>();

// Limpiar entradas expiradas cada 5 minutos
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetTime < now) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  /**
   * Ventana de tiempo en milisegundos
   * Default: 15 minutos
   */
  windowMs?: number;

  /**
   * Máximo de requests permitidos en la ventana
   * Default: 5
   */
  max?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

/**
 * Verifica si una IP puede hacer un request
 * 
 * @param identifier - Identificador único (normalmente IP)
 * @param config - Configuración de rate limit
 * @returns Resultado indicando si se permite el request
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = {}
): RateLimitResult {
  const { windowMs = 15 * 60 * 1000, max = 5 } = config; // 15 min, 5 intentos
  
  const now = Date.now();
  const entry = store.get(identifier);

  // Si no existe o expiró, crear nueva entrada
  if (!entry || entry.resetTime < now) {
    const resetTime = now + windowMs;
    store.set(identifier, { count: 1, resetTime });
    
    return {
      allowed: true,
      remaining: max - 1,
      resetTime,
    };
  }

  // Si alcanzó el límite
  if (entry.count >= max) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  // Incrementar contador
  entry.count++;
  store.set(identifier, entry);

  return {
    allowed: true,
    remaining: max - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Bloquea una IP inmediatamente (por ejemplo, después de actividad sospechosa)
 * 
 * @param identifier - Identificador a bloquear
 * @param durationMs - Duración del bloqueo en milisegundos (default: 1 hora)
 */
export function blockIdentifier(identifier: string, durationMs = 60 * 60 * 1000) {
  const resetTime = Date.now() + durationMs;
  store.set(identifier, { count: 999999, resetTime });
}

/**
 * Resetea el contador para una IP específica
 * 
 * @param identifier - Identificador a resetear
 */
export function resetRateLimit(identifier: string) {
  store.delete(identifier);
}

/**
 * Obtiene la IP del request (considerando proxies)
 * 
 * @param request - Request object de Next.js
 * @returns IP address
 */
export function getClientIP(request: Request): string {
  // Intenta obtener IP de headers de proxy
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP.trim();
  }
  
  // Fallback a unknown (en desarrollo local)
  return 'unknown';
}
