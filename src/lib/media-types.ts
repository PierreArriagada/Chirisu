// Configuración de tipos de medios y sus estructuras

export const MEDIA_TYPES = {
  ANIME: 'anime',
  MANGA: 'manga',
  NOVEL: 'novel',
  DONGHUA: 'donghua',
  MANHUA: 'manhua',
  MANHWA: 'manhwa',
  FAN_COMIC: 'fan_comic',
} as const;

export type MediaType = typeof MEDIA_TYPES[keyof typeof MEDIA_TYPES];

export const MEDIA_TYPE_LABELS: Record<MediaType, { es: string; en: string }> = {
  anime: { es: 'Anime', en: 'Anime' },
  manga: { es: 'Manga', en: 'Manga' },
  novel: { es: 'Novela', en: 'Novel' },
  donghua: { es: 'Donghua', en: 'Donghua' },
  manhua: { es: 'Manhua', en: 'Manhua' },
  manhwa: { es: 'Manhwa', en: 'Manhwa' },
  fan_comic: { es: 'Fan Comic', en: 'Fan Comic' },
};

// Estructura de campos por tipo de medio
export const MEDIA_FIELDS = {
  // Tipos con episodios (anime y donghua)
  episodic: ['anime', 'donghua'],
  
  // Tipos con capítulos y volúmenes (manga, manhua, manhwa, novela, fan_comic)
  volumetric: ['manga', 'manhua', 'manhwa', 'novel', 'fan_comic'],
  
  // Campos comunes a todos
  common: [
    'title_native',
    'title_romaji',
    'title_english',
    'title_spanish',
    'synopsis',
    'cover_image_url',
    'banner_image_url',
    'start_date',
    'end_date',
    'status_id',
    'source',
    'country_of_origin',
    'is_nsfw',
  ],
  
  // Campos específicos por tipo
  anime: ['episode_count', 'duration', 'season', 'season_year', 'trailer_url', 'type'],
  donghua: ['episode_count', 'duration', 'season', 'season_year', 'trailer_url', 'type'],
  manga: ['chapters', 'volumes', 'type'],
  manhua: ['chapters', 'volumes', 'type'],
  manhwa: ['chapters', 'volumes', 'type'],
  novel: ['chapters', 'volumes', 'type'],
  fan_comic: ['chapters', 'volumes', 'source'], // source = obra original
};

// Tabla de base de datos por tipo
export const MEDIA_TABLE_NAMES: Record<MediaType, string> = {
  anime: 'anime',
  manga: 'manga',
  novel: 'novels',
  donghua: 'donghua',
  manhua: 'manhua',
  manhwa: 'manhwa',
  fan_comic: 'fan_comic',
};

// Tipos polimórficos (para usar en tablas como characterable_characters)
export const POLYMORPHIC_TYPES: Record<MediaType, string> = {
  anime: 'anime',
  manga: 'manga',
  novel: 'novel',
  donghua: 'donghua',
  manhua: 'manhua',
  manhwa: 'manhwa',
  fan_comic: 'fan_comic',
};

// =============================================
// TIPOS DE ENTIDADES (CHARACTERS, STAFF, ETC.)
// =============================================

export const ENTITY_TYPES = {
  CHARACTER: 'character',
  STAFF: 'staff',
  VOICE_ACTOR: 'voice_actor',
  STUDIO: 'studio',
  GENRE: 'genre',
} as const;

export type EntityType = typeof ENTITY_TYPES[keyof typeof ENTITY_TYPES];

export const ENTITY_TYPE_LABELS: Record<EntityType, { es: string; en: string }> = {
  character: { es: 'Personaje', en: 'Character' },
  staff: { es: 'Staff', en: 'Staff' },
  voice_actor: { es: 'Actor de Voz', en: 'Voice Actor' },
  studio: { es: 'Estudio', en: 'Studio' },
  genre: { es: 'Género', en: 'Genre' },
};

export const ENTITY_TABLE_NAMES: Record<EntityType, string> = {
  character: 'characters',
  staff: 'staff',
  voice_actor: 'voice_actors',
  studio: 'studios',
  genre: 'genres',
};

// Campos por tipo de entidad
export const ENTITY_FIELDS = {
  character: [
    'name',           // nombre principal
    'name_romaji',    // nombre en romaji
    'name_native',    // nombre nativo (japonés, chino, etc.)
    'image_url',
    'description',
    'gender',
    'age',
    'blood_type',
    'date_of_birth',
  ],
  staff: [
    'name',           // nombre principal
    'name_romaji',
    'name_native',
    'image_url',
    'bio',
    'primary_occupations', // array: ['Director', 'Producer', etc.]
    'gender',
    'date_of_birth',
    'hometown',
  ],
  voice_actor: [
    'name_romaji',
    'name_native',
    'image_url',
    'language',       // 'Japanese', 'English', 'Spanish', etc.
    'bio',
    'gender',
    'date_of_birth',
    'blood_type',
    'hometown',
  ],
  studio: [
    'name',           // nombre del estudio
  ],
  genre: [
    'code',           // identificador único (ej: 'action', 'romance')
    'name_es',
    'name_en',
    'name_ja',
    'description_es',
    'description_en',
  ],
};

// =============================================
// TODOS LOS TIPOS COMBINADOS
// =============================================

export type ContributableType = MediaType | EntityType;

export const ALL_CONTRIBUTION_TYPES = {
  ...MEDIA_TYPES,
  ...ENTITY_TYPES,
} as const;

export const ALL_TYPE_LABELS: Record<ContributableType, { es: string; en: string }> = {
  ...MEDIA_TYPE_LABELS,
  ...ENTITY_TYPE_LABELS,
};

export const ALL_TABLE_NAMES: Record<ContributableType, string> = {
  ...MEDIA_TABLE_NAMES,
  ...ENTITY_TABLE_NAMES,
};
