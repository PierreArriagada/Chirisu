/**
 * Configuración para importación de datos desde AniList API
 * 
 * Este archivo centraliza toda la configuración de rate limits
 * y mapeos entre AniList y nuestra BD.
 */

// ============================================
// CREDENCIALES DE APIs
// ============================================

export const API_CREDENTIALS = {
  // AniList (GraphQL) - API pública, no requiere autenticación
  ANILIST: {
    BASE_URL: 'https://graphql.anilist.co',
  },
};

// ============================================
// LÍMITES DE RATE (por minuto)
// ============================================

export const RATE_LIMITS = {
  ANILIST: {
    REQUESTS_PER_MINUTE: 90,
    REQUESTS_PER_SECOND: 2,
    DELAY_BETWEEN_REQUESTS: 500, // 0.5 segundos
  },
};

// ============================================
// CONFIGURACIÓN DE REINTENTOS
// ============================================

export const RETRY_CONFIG = {
  MAX_RETRIES: 5,
  INITIAL_DELAY: 2000, // 2 segundos
  MAX_DELAY: 60000, // 1 minuto
  BACKOFF_MULTIPLIER: 2, // Exponencial
};

// ============================================
// CONFIGURACIÓN DE BATCH
// ============================================

export const BATCH_CONFIG = {
  ITEMS_PER_BATCH: 100,
  SAVE_CHECKPOINT_EVERY: 50, // Guardar progreso cada 50 items
  MAX_CONCURRENT_REQUESTS: 3,
};

// ============================================
// MAPEO DE TIPOS DE MEDIA
// ============================================

export const MEDIA_TYPE_MAP = {
  // MyAnimeList → Nuestra BD
  MAL: {
    // Anime
    'tv': 'TV',
    'movie': 'Movie',
    'ova': 'OVA',
    'ona': 'ONA',
    'special': 'Special',
    'music': 'Music',
    
    // Manga
    'manga': 'Manga',
    'novel': 'Light_Novel',
    'one_shot': 'One-shot',
    'doujinshi': 'Doujinshi',
    'manhwa': 'Manhwa',
    'manhua': 'Manhua',
  },
  
  // AniList → Nuestra BD
  ANILIST: {
    'TV': 'TV',
    'TV_SHORT': 'TV',
    'MOVIE': 'Movie',
    'SPECIAL': 'Special',
    'OVA': 'OVA',
    'ONA': 'ONA',
    'MUSIC': 'Music',
    'MANGA': 'Manga',
    'NOVEL': 'Light_Novel',
    'ONE_SHOT': 'One-shot',
  },
};

// ============================================
// MAPEO DE ESTADOS
// ============================================

export const STATUS_MAP = {
  MAL: {
    'finished_airing': 'Finished',
    'currently_airing': 'Ongoing',
    'not_yet_aired': 'Upcoming',
    'finished': 'Finished',
    'publishing': 'Ongoing',
    'not_yet_published': 'Upcoming',
  },
  
  ANILIST: {
    'FINISHED': 'Finished',
    'RELEASING': 'Ongoing',
    'NOT_YET_RELEASED': 'Upcoming',
    'CANCELLED': 'Cancelled',
    'HIATUS': 'Hiatus',
  },
};

// ============================================
// MAPEO DE TEMPORADAS
// ============================================

export const SEASON_MAP = {
  'WINTER': 'Winter',
  'SPRING': 'Spring',
  'SUMMER': 'Summer',
  'FALL': 'Fall',
  'AUTUMN': 'Fall', // Alternativa
};

// ============================================
// MAPEO DE FUENTES
// ============================================

export const SOURCE_MAP = {
  MAL: {
    'original': 'Original',
    'manga': 'Manga',
    'light_novel': 'Light Novel',
    'web_manga': 'Web Manga',
    'novel': 'Novel',
    'game': 'Video Game',
    'visual_novel': 'Visual Novel',
    'web_novel': 'Web Novel',
    '4_koma': '4-koma',
    'music': 'Music',
    'picture_book': 'Picture Book',
    'other': 'Other',
  },
  
  ANILIST: {
    'ORIGINAL': 'Original',
    'MANGA': 'Manga',
    'LIGHT_NOVEL': 'Light Novel',
    'VISUAL_NOVEL': 'Visual Novel',
    'VIDEO_GAME': 'Video Game',
    'OTHER': 'Other',
    'NOVEL': 'Novel',
    'DOUJINSHI': 'Doujinshi',
    'ANIME': 'Anime',
    'WEB_NOVEL': 'Web Novel',
    'LIVE_ACTION': 'Live Action',
    'GAME': 'Video Game',
    'COMIC': 'Comic',
    'MULTIMEDIA_PROJECT': 'Multimedia Project',
    'PICTURE_BOOK': 'Picture Book',
  },
};

// ============================================
// CONFIGURACIÓN DE IMPORTACIÓN
// ============================================

export const IMPORT_CONFIG = {
  // Tablas a importar en orden
  IMPORT_ORDER: [
    'anime',
    'manga',
    'novels',
    'donghua',
    'manhua',
    'manhwa',
  ],
  
  // Prioridad de APIs (en caso de conflicto, usar datos de esta fuente)
  API_PRIORITY: ['ANILIST', 'MAL', 'KITSU'],
  
  // Campos a ignorar al importar (se llenan localmente)
  IGNORE_FIELDS: [
    'created_by',
    'updated_by',
    'created_at',
    'updated_at',
    'is_approved',
    'deleted_at',
    'slug',
    'ranking',
    'popularity',
  ],
  
  // Actualizar datos existentes si la última actualización es mayor a:
  UPDATE_THRESHOLD_DAYS: 7,
};

// ============================================
// PATHS DE CHECKPOINTS
// ============================================

export const CHECKPOINT_CONFIG = {
  DIR: './scripts/import/checkpoints',
  FILE_PATTERN: '{source}_{mediaType}_{date}.json',
};

// ============================================
// LOGGING
// ============================================

export const LOG_CONFIG = {
  DIR: './scripts/import/logs',
  LEVEL: process.env.LOG_LEVEL || 'info',
  FILE_PATTERN: 'import_{date}.log',
};

// ============================================
// COUNTRY CODES
// ============================================

export const COUNTRY_CODES = {
  'JP': 'JP', // Japón (anime, manga)
  'CN': 'CN', // China (donghua, manhua)
  'KR': 'KR', // Corea (manhwa)
};

// ============================================
// VALIDACIÓN
// ============================================

export function validateConfig(): void {
  // Validación simplificada - AniList no requiere credenciales
  console.log('✅ Configuración AniList lista');
}

// Validar al importar
validateConfig();
