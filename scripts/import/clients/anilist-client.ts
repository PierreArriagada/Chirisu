/**
 * Cliente para AniList GraphQL API
 * Docs: https://anilist.gitbook.io/anilist-apiv2-docs/
 */

import { API_CREDENTIALS, MEDIA_TYPE_MAP, STATUS_MAP, SOURCE_MAP } from '../config';
import { RateLimiter, retryWithBackoff, sanitizeText, parseDate, normalizeRating, extractYear } from '../utils';
import { extractColorDuringImport } from '../utils/color-import-helper';

// ============================================
// HELPERS
// ============================================

/**
 * Genera un slug único a partir de un texto y un ID
 * Formato: texto-slugificado-{id}
 */
function generateSlug(text: string, id: number): string {
  if (!text) return `unknown-${id}`;
  
  return text
    .toLowerCase()
    .normalize('NFD') // Normalizar caracteres unicode
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^a-z0-9\s-]/g, '') // Solo letras, números, espacios y guiones
    .trim()
    .replace(/\s+/g, '-') // Espacios a guiones
    .replace(/-+/g, '-') // Múltiples guiones a uno
    .substring(0, 200) // Limitar longitud
    + `-${id}`; // Agregar ID para unicidad
}

// ============================================
// TIPOS ANILIST
// ============================================

export interface AniListMedia {
  id: number;
  idMal?: number;
  title: {
    romaji?: string;
    english?: string;
    native?: string;
  };
  type: 'ANIME' | 'MANGA';
  format?: string; // TV, MOVIE, MANGA, NOVEL, etc.
  status?: string; // FINISHED, RELEASING, NOT_YET_RELEASED, etc.
  description?: string;
  startDate?: {
    year?: number;
    month?: number;
    day?: number;
  };
  endDate?: {
    year?: number;
    month?: number;
    day?: number;
  };
  season?: string; // WINTER, SPRING, SUMMER, FALL
  seasonYear?: number;
  episodes?: number;
  duration?: number;
  chapters?: number;
  volumes?: number;
  countryOfOrigin?: string; // JP, CN, KR
  isLicensed?: boolean;
  source?: string; // ORIGINAL, MANGA, LIGHT_NOVEL, etc.
  hashtag?: string;
  coverImage?: {
    extraLarge?: string;
    large?: string;
    medium?: string;
    color?: string;
  };
  bannerImage?: string;
  genres?: string[];
  synonyms?: string[];
  averageScore?: number;
  meanScore?: number;
  popularity?: number;
  favourites?: number;
  trending?: number;
  tags?: Array<{
    id: number;
    name: string;
    description: string;
    category: string;
    rank: number;
    isGeneralSpoiler: boolean;
    isMediaSpoiler: boolean;
    isAdult: boolean;
  }>;
  relations?: {
    edges: Array<{
      node: {
        id: number;
        type: string;
      };
      relationType: string;
    }>;
  };
  studios?: {
    nodes: Array<{
      id: number;
      name: string;
      isAnimationStudio: boolean;
    }>;
  };
  characters?: {
    edges: Array<{
      role: string; // MAIN, SUPPORTING, BACKGROUND
      node: {
        id: number;
        name: {
          full?: string;
          native?: string;
        };
        image?: {
          large?: string;
          medium?: string;
        };
        description?: string;
        gender?: string;
        age?: string;
        bloodType?: string;
        dateOfBirth?: {
          year?: number;
          month?: number;
          day?: number;
        };
        favourites?: number;
      };
      voiceActors?: Array<{
        id: number;
        name: {
          full?: string;
          native?: string;
        };
        languageV2?: string; // Japanese, Spanish, English, etc.
        image?: {
          large?: string;
          medium?: string;
        };
        description?: string;
        gender?: string;
        dateOfBirth?: {
          year?: number;
          month?: number;
          day?: number;
        };
        bloodType?: string;
        homeTown?: string;
        favourites?: number;
      }>;
    }>;
  };
  staff?: {
    edges: Array<{
      role: string; // Director, Series Composition, Character Design, etc.
      node: {
        id: number;
        name: {
          full?: string;
          native?: string;
        };
        image?: {
          large?: string;
          medium?: string;
        };
        description?: string;
        gender?: string;
        dateOfBirth?: {
          year?: number;
          month?: number;
          day?: number;
        };
        bloodType?: string;
        homeTown?: string;
        favourites?: number;
      };
    }>;
  };
  isAdult?: boolean;
  nextAiringEpisode?: {
    airingAt: number;
    timeUntilAiring: number;
    episode: number;
  };
}

export interface AniListPageResponse {
  Page: {
    pageInfo: {
      total: number;
      currentPage: number;
      lastPage: number;
      hasNextPage: boolean;
      perPage: number;
    };
    media: AniListMedia[];
  };
}

// ============================================
// CLIENTE ANILIST
// ============================================

export class AniListClient {
  private baseUrl: string;
  private rateLimiter: RateLimiter;

  constructor() {
    this.baseUrl = API_CREDENTIALS.ANILIST.BASE_URL;
    this.rateLimiter = new RateLimiter('ANILIST');
  }

  /**
   * Query de medios con paginación
   */
  async queryMedia(
    page: number = 1,
    perPage: number = 50,
    type?: 'ANIME' | 'MANGA',
    format?: string
  ): Promise<AniListPageResponse> {
    const query = `
      query ($page: Int, $perPage: Int, $type: MediaType, $format: MediaFormat) {
        Page(page: $page, perPage: $perPage) {
          pageInfo {
            total
            currentPage
            lastPage
            hasNextPage
            perPage
          }
          media(type: $type, format: $format, sort: ID) {
            id
            idMal
            title {
              romaji
              english
              native
            }
            type
            format
            status
            description
            startDate {
              year
              month
              day
            }
            endDate {
              year
              month
              day
            }
            season
            seasonYear
            episodes
            duration
            chapters
            volumes
            countryOfOrigin
            isLicensed
            source
            hashtag
            coverImage {
              extraLarge
              large
              medium
              color
            }
            bannerImage
            genres
            synonyms
            popularity
            favourites
            trending
            tags {
              id
              name
              description
              category
              rank
              isGeneralSpoiler
              isMediaSpoiler
              isAdult
            }
            relations {
              edges {
                node {
                  id
                  type
                }
                relationType
              }
            }
            studios {
              nodes {
                id
                name
                isAnimationStudio
              }
            }
            characters(sort: ROLE) {
              edges {
                role
                node {
                  id
                  name {
                    full
                    native
                  }
                  image {
                    large
                    medium
                  }
                  description
                  gender
                  age
                  bloodType
                  dateOfBirth {
                    year
                    month
                    day
                  }
                  favourites
                }
                voiceActors {
                  id
                  name {
                    full
                    native
                  }
                  languageV2
                  image {
                    large
                    medium
                  }
                  description
                  gender
                  dateOfBirth {
                    year
                    month
                    day
                  }
                  bloodType
                  homeTown
                  favourites
                }
              }
            }
            staff(sort: RELEVANCE) {
              edges {
                role
                node {
                  id
                  name {
                    full
                    native
                  }
                  image {
                    large
                    medium
                  }
                  description
                  gender
                  dateOfBirth {
                    year
                    month
                    day
                  }
                  bloodType
                  homeTown
                  favourites
                }
              }
            }
            isAdult
            nextAiringEpisode {
              airingAt
              timeUntilAiring
              episode
            }
          }
        }
      }
    `;

    const variables = {
      page,
      perPage,
      type,
      format,
    };

    return await this.rateLimiter.schedule(async () => {
      return await retryWithBackoff(
        async () => await this.graphql<AniListPageResponse>(query, variables),
        `AniList queryMedia (page: ${page}, type: ${type || 'ALL'})`
      );
    });
  }

  /**
   * Obtener anime específico por ID
   */
  async getAnimeById(id: number): Promise<AniListMedia> {
    const query = `
      query ($id: Int) {
        Media(id: $id, type: ANIME) {
          id
          idMal
          title {
            romaji
            english
            native
          }
          type
          format
          status
          description
          startDate { year month day }
          endDate { year month day }
          season
          seasonYear
          episodes
          duration
          countryOfOrigin
          isLicensed
          source
          hashtag
          coverImage { extraLarge large medium color }
          bannerImage
          genres
          synonyms
          popularity
          favourites
          trending
          tags { id name description category rank isGeneralSpoiler isMediaSpoiler isAdult }
          relations { edges { node { id type } relationType } }
          studios { nodes { id name isAnimationStudio } }
          isAdult
          nextAiringEpisode { airingAt timeUntilAiring episode }
        }
      }
    `;

    return await this.rateLimiter.schedule(async () => {
      return await retryWithBackoff(
        async () => {
          const result = await this.graphql<{ Media: AniListMedia }>(query, { id });
          return result.Media;
        },
        `AniList getAnimeById (id: ${id})`
      );
    });
  }

  /**
   * Obtener manga específico por ID
   */
  async getMangaById(id: number): Promise<AniListMedia> {
    const query = `
      query ($id: Int) {
        Media(id: $id, type: MANGA) {
          id
          idMal
          title {
            romaji
            english
            native
          }
          type
          format
          status
          description
          startDate { year month day }
          endDate { year month day }
          chapters
          volumes
          countryOfOrigin
          isLicensed
          source
          coverImage { extraLarge large medium color }
          bannerImage
          genres
          synonyms
          popularity
          favourites
          trending
          tags { id name description category rank isGeneralSpoiler isMediaSpoiler isAdult }
          isAdult
        }
      }
    `;

    return await this.rateLimiter.schedule(async () => {
      return await retryWithBackoff(
        async () => {
          const result = await this.graphql<{ Media: AniListMedia }>(query, { id });
          return result.Media;
        },
        `AniList getMangaById (id: ${id})`
      );
    });
  }

  /**
   * Ejecutar query GraphQL
   */
  private async graphql<T>(query: string, variables: any = {}): Promise<T> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    const json = await response.json();

    if (!response.ok || json.errors) {
      const errorMessage = json.errors
        ? json.errors.map((e: any) => e.message).join(', ')
        : `${response.status} ${response.statusText}`;
      
      const error: any = new Error(`AniList API Error: ${errorMessage}`);
      error.statusCode = response.status;
      error.details = json.errors;
      throw error;
    }

    return json.data as T;
  }

  /**
   * Obtener estadísticas del rate limiter
   */
  getStats() {
    return this.rateLimiter.getStats();
  }
}

// ============================================
// MAPPERS ANILIST → BD
// ============================================

export async function mapAniListToAnime(anilist: AniListMedia) {
  const format = anilist.format?.toUpperCase() || 'TV';
  const dbType = (MEDIA_TYPE_MAP.ANILIST as any)[format] || 'TV';
  
  const status = anilist.status?.toUpperCase() || 'UNKNOWN';
  const dbStatus = (STATUS_MAP.ANILIST as any)[status] || 'Unknown';
  
  const source = anilist.source?.toLowerCase().replace(/_/g, ' ') || 'unknown';
  const dbSource = (SOURCE_MAP.ANILIST as any)[source] || 'Unknown';
  
  // ============================================================================
  // INFERIR PAÍS DE ORIGEN - Para anime y donghua
  // ============================================================================
  // Si AniList provee el país, usarlo. Si no, inferirlo de la tabla destino.
  const table = getTableForAniListMedia(anilist);
  let country: string;
  if (anilist.countryOfOrigin) {
    country = anilist.countryOfOrigin;
  } else {
    // Inferir país según tabla destino
    if (table === 'donghua') {
      country = 'CN';  // Donghua es chino
    } else {
      country = 'JP';  // Anime default japonés
    }
  }

  // Construir fecha completa
  const startDate = anilist.startDate?.year
    ? new Date(
        anilist.startDate.year,
        (anilist.startDate.month || 1) - 1,
        anilist.startDate.day || 1
      )
    : null;

  const endDate = anilist.endDate?.year
    ? new Date(
        anilist.endDate.year,
        (anilist.endDate.month || 1) - 1,
        anilist.endDate.day || 1
      )
    : null;

  // Construir season string
  const season = anilist.season && anilist.seasonYear
    ? `${anilist.season} ${anilist.seasonYear}`
    : null;

  return {
    // IDs
    anilist_id: anilist.id,
    mal_id: anilist.idMal || null,
    
    // Títulos (anime NO tiene columna 'title', solo title_native, title_romaji, title_english, title_spanish)
    title_native: sanitizeText(anilist.title.native),
    title_romaji: sanitizeText(anilist.title.romaji),
    title_english: sanitizeText(anilist.title.english),
    title_spanish: null, // AniList no provee título en español
    
    // Metadata básica
    type: dbType,
    synopsis: sanitizeText(anilist.description),
    
    // Imágenes (usar cover_image_url según BD, NO image_url)
    cover_image_url: anilist.coverImage?.extraLarge || anilist.coverImage?.large || anilist.coverImage?.medium || null,
    banner_image_url: anilist.bannerImage || null,
    // ✨ Extracción automática de color: usa AniList si existe, sino extrae
    dominant_color: await extractColorDuringImport(
      anilist.coverImage?.extraLarge || anilist.coverImage?.large || anilist.coverImage?.medium || null,
      anilist.coverImage?.color || null,
      anilist.title.romaji || anilist.title.english || `ID:${anilist.id}`
    ),
    
    // Fechas
    start_date: startDate,
    end_date: endDate,
    
    // Episodios y temporada
    episode_count: anilist.episodes || null,
    duration: anilist.duration || null,
    season: anilist.season || null,
    season_year: anilist.seasonYear || null,
    
    // NO importar ratings - la puntuación debe ser interna de Chirisu
    // average_score: null,
    // mean_score: null,
    
    // Popularidad
    popularity: anilist.popularity || null,
    favourites: anilist.favourites || null,
    
    // Fuente
    source: dbSource,
    
    // País de origen (usar el inferido, no el fallback genérico)
    country_of_origin: country,
    
    // NSFW (usar is_nsfw según BD, NO nsfw)
    is_nsfw: anilist.isAdult || false,
    
    // Publicación automática para medios importados de AniList
    is_published: true,
    
    // Datos completos en JSON
    external_payload: {
      anilist: anilist,
    },
  };
}

export async function mapAniListToManga(anilist: AniListMedia) {
  const format = anilist.format?.toUpperCase() || 'MANGA';
  
  // Determinar tabla destino
  const table = getTableForAniListMedia(anilist);
  
  // ============================================================================
  // INFERIR PAÍS DE ORIGEN - Basado en la tabla destino
  // ============================================================================
  // Si AniList provee el país, usarlo. Si no, inferirlo de la tabla destino.
  let country: string;
  if (anilist.countryOfOrigin) {
    country = anilist.countryOfOrigin;
  } else {
    // Inferir país según tabla destino
    if (table === 'manhwa') {
      country = 'KR';  // Manhwa es coreano
    } else if (table === 'manhua') {
      country = 'CN';  // Manhua es chino
    } else {
      country = 'JP';  // Manga y novels default japonés
    }
  }
  
  // ============================================================================
  // MAPEAR TIPO - Según la tabla destino y formato
  // ============================================================================
  let dbType: string;
  
  if (table === 'manhwa') {
    // Manhwa solo acepta: 'Manhwa', 'Webtoon', 'One-shot'
    if (format === 'ONE_SHOT') {
      dbType = 'One-shot';
    } else {
      dbType = 'Manhwa'; // Default para manhwa coreano
    }
  } else if (table === 'manhua') {
    // Manhua solo acepta: 'Manhua', 'Web Manhua', 'One-shot'
    if (format === 'ONE_SHOT') {
      dbType = 'One-shot';
    } else {
      dbType = 'Manhua'; // Default para manhua chino
    }
  } else if (table === 'novels') {
    // Novels solo acepta: 'Light_Novel', 'Web_Novel', 'Novel'
    if (format === 'NOVEL') {
      dbType = 'Novel';
    } else {
      dbType = 'Light_Novel'; // Default para light novels
    }
  } else {
    // Manga acepta: 'Manga', 'Manhwa', 'Manhua', 'One-shot'
    if (format === 'ONE_SHOT') {
      dbType = 'One-shot';
    } else if (country === 'KR') {
      dbType = 'Manhwa';
    } else if (country === 'CN') {
      dbType = 'Manhua';
    } else {
      dbType = 'Manga'; // Default para manga japonés
    }
  }
  
  const status = anilist.status?.toUpperCase() || 'UNKNOWN';
  const dbStatus = (STATUS_MAP.ANILIST as any)[status] || 'Unknown';
  
  const source = anilist.source?.toLowerCase().replace(/_/g, ' ') || 'unknown';
  const dbSource = (SOURCE_MAP.ANILIST as any)[source] || 'Unknown';

  // Construir fecha completa
  const startDate = anilist.startDate?.year
    ? new Date(
        anilist.startDate.year,
        (anilist.startDate.month || 1) - 1,
        anilist.startDate.day || 1
      )
    : null;

  const endDate = anilist.endDate?.year
    ? new Date(
        anilist.endDate.year,
        (anilist.endDate.month || 1) - 1,
        anilist.endDate.day || 1
      )
    : null;

  return {
    // IDs
    anilist_id: anilist.id,
    mal_id: anilist.idMal || null,
    
    // Títulos (manga tampoco tiene columna 'title')
    title_native: sanitizeText(anilist.title.native),
    title_romaji: sanitizeText(anilist.title.romaji),
    title_english: sanitizeText(anilist.title.english),
    title_spanish: null, // AniList no provee título en español
    
    // Metadata básica
    type: dbType,
    synopsis: sanitizeText(anilist.description),
    
    // Imágenes (usar cover_image_url, NO image_url)
    cover_image_url: anilist.coverImage?.extraLarge || anilist.coverImage?.large || anilist.coverImage?.medium || null,
    banner_image_url: anilist.bannerImage || null,
    // ✨ Extracción automática de color: usa AniList si existe, sino extrae
    dominant_color: await extractColorDuringImport(
      anilist.coverImage?.extraLarge || anilist.coverImage?.large || anilist.coverImage?.medium || null,
      anilist.coverImage?.color || null,
      anilist.title.romaji || anilist.title.english || `ID:${anilist.id}`
    ),
    
    // Fechas
    start_date: startDate,
    end_date: endDate,
    
    // Volumes y chapters
    volumes: anilist.volumes || null,
    chapters: anilist.chapters || null,
    
    // NO importar ratings - la puntuación debe ser interna de Chirisu
    // average_score: null,
    // mean_score: null,
    
    // Popularidad
    popularity: anilist.popularity || null,
    favourites: anilist.favourites || null,
    
    // Fuente
    source: dbSource,
    
    // País de origen (usar el inferido, no el fallback genérico)
    country_of_origin: country,
    
    // NSFW (usar is_nsfw, NO nsfw)
    is_nsfw: anilist.isAdult || false,
    
    // Aprobación automática para medios importados de AniList
    is_approved: true,
    
    // Datos completos en JSON
    external_payload: {
      anilist: anilist,
    },
  };
}

/**
 * Determinar tabla de destino según tipo y país de AniList
 */
export function getTableForAniListMedia(media: AniListMedia): string {
  const format = media.format?.toUpperCase();
  const country = media.countryOfOrigin;

  // ============================================================================
  // ANIME TYPES - Separar por PAÍS
  // ============================================================================
  if (media.type === 'ANIME') {
    // Donghua: Anime chino
    if (country === 'CN') return 'donghua';
    
    // Anime: Anime japonés (default) y coreano
    return 'anime';
  }

  // ============================================================================
  // MANGA TYPES - Separar primero por FORMATO, luego por PAÍS
  // ============================================================================
  if (media.type === 'MANGA') {
    // PRIORIDAD 1: FORMATO - Las novelas van a su propia tabla sin importar el país
    if (format === 'NOVEL' || format === 'LIGHT_NOVEL') {
      return 'novels';
    }
    
    // PRIORIDAD 2: PAÍS - Separar manga por origen
    if (country === 'KR') return 'manhwa';  // Coreano → Manhwa
    if (country === 'CN') return 'manhua';  // Chino → Manhua
    
    // Default: Manga japonés
    return 'manga';
  }

  // ============================================================================
  // DEFAULT - Si no es ANIME ni MANGA, clasificar como manga
  // ============================================================================
  return 'manga';
}

/**
 * Mapear personajes de AniList a estructura de BD
 */
export function mapAniListCharacters(anilist: AniListMedia) {
  if (!anilist.characters?.edges || anilist.characters.edges.length === 0) {
    return [];
  }

  // Mapa de roles de AniList a roles de BD (minúsculas)
  const roleMap: Record<string, string> = {
    'MAIN': 'main',
    'SUPPORTING': 'supporting',
    'BACKGROUND': 'supporting', // BD solo tiene main y supporting
  };

  return anilist.characters.edges.map(edge => {
    const character = edge.node;
    const dateOfBirth = character.dateOfBirth?.year
      ? new Date(
          character.dateOfBirth.year,
          (character.dateOfBirth.month || 1) - 1,
          character.dateOfBirth.day || 1
        )
      : null;

    return {
      // ID externo de AniList (lo usamos como referencia única)
      anilist_id: character.id,
      
      // Nombres
      name: sanitizeText(character.name.full, 100), // Límite de 100 caracteres
      name_romaji: sanitizeText(character.name.full, 255),
      name_native: sanitizeText(character.name.native, 255),
      
      // Slug único (nombre-id)
      slug: generateSlug(character.name.full || character.name.native || 'character', character.id),
      
      // Imágenes
      image_url: character.image?.large || character.image?.medium || null,
      
      // Descripción (truncar a límite de BD)
      description: sanitizeText(character.description, 2000),
      
      // Datos personales (truncar a límites de BD actualizados)
      gender: character.gender ? sanitizeText(character.gender, 50) : null,
      age: character.age ? sanitizeText(character.age, 50) : null,
      blood_type: character.bloodType ? sanitizeText(character.bloodType, 10) : null,
      date_of_birth: dateOfBirth,
      
      // Popularidad
      favorites_count: character.favourites || 0,
      
      // Rol en el anime/manga (convertido al formato de BD - minúsculas)
      role: roleMap[edge.role] || 'supporting',
      
      // Actores de voz
      voiceActors: edge.voiceActors || [],
    };
  });
}

/**
 * Mapear actores de voz de AniList a estructura de BD
 */
export function mapAniListVoiceActors(characters: any[]) {
  const voiceActors: any[] = [];
  const seen = new Set<number>();

  for (const character of characters) {
    if (!character.voiceActors || character.voiceActors.length === 0) continue;

    for (const va of character.voiceActors) {
      // Evitar duplicados
      if (seen.has(va.id)) continue;
      seen.add(va.id);

      // Solo japonés y español
      const lang = va.languageV2?.toLowerCase();
      if (lang !== 'japanese' && lang !== 'spanish') continue;

      const dateOfBirth = va.dateOfBirth?.year
        ? new Date(
            va.dateOfBirth.year,
            (va.dateOfBirth.month || 1) - 1,
            va.dateOfBirth.day || 1
          )
        : null;

      voiceActors.push({
        anilist_id: va.id,
        name_romaji: sanitizeText(va.name.full, 255),
        name_native: sanitizeText(va.name.native, 255),
        slug: generateSlug(va.name.full || va.name.native || 'voice-actor', va.id),
        image_url: va.image?.large || va.image?.medium || null,
        language: lang === 'japanese' ? 'ja' : 'es',
        bio: sanitizeText(va.description, 2000),
        gender: va.gender ? sanitizeText(va.gender, 50) : null,
        date_of_birth: dateOfBirth,
        blood_type: va.bloodType ? sanitizeText(va.bloodType, 10) : null,
        hometown: va.homeTown ? sanitizeText(va.homeTown, 255) : null,
        favorites_count: va.favourites || 0,
      });
    }
  }

  return voiceActors;
}

/**
 * Mapear staff de AniList a estructura de BD
 */
export function mapAniListStaff(anilist: AniListMedia) {
  if (!anilist.staff?.edges || anilist.staff.edges.length === 0) {
    return [];
  }

  return anilist.staff.edges.map(edge => {
    const staff = edge.node;
    const dateOfBirth = staff.dateOfBirth?.year
      ? new Date(
          staff.dateOfBirth.year,
          (staff.dateOfBirth.month || 1) - 1,
          staff.dateOfBirth.day || 1
        )
      : null;

    return {
      anilist_id: staff.id,
      name: sanitizeText(staff.name.full, 255),
      slug: generateSlug(staff.name.full || 'staff', staff.id),
      image_url: staff.image?.large || staff.image?.medium || null,
      bio: sanitizeText(staff.description, 2000),
      gender: staff.gender || null,
      date_of_birth: dateOfBirth,
      blood_type: staff.bloodType || null,
      hometown: staff.homeTown || null,
      role: edge.role || 'Unknown', // Director, Writer, Character Design, etc.
    };
  });
}

/**
 * Mapear studios de AniList
 */
export function mapAniListStudios(anilist: AniListMedia) {
  if (!anilist.studios?.nodes || anilist.studios.nodes.length === 0) {
    return [];
  }

  // Filtrar solo estudios de animación (isAnimationStudio = true)
  return anilist.studios.nodes
    .filter(studio => studio.isAnimationStudio)
    .map(studio => ({
      name: sanitizeText(studio.name, 255),
      isMainStudio: true, // Por defecto marcar como main studio
    }));
}

/**
 * Mapear relaciones entre medios (anime-manga, sequels, prequels, etc.)
 */
export function mapAniListRelations(anilist: AniListMedia) {
  if (!anilist.relations?.edges || anilist.relations.edges.length === 0) {
    return [];
  }

  // Mapeo de tipos de relación de AniList a BD
  const relationTypeMap: Record<string, string> = {
    'ADAPTATION': 'adaptation',      // Adaptación (manga -> anime o viceversa)
    'SOURCE': 'source',              // Fuente original
    'SEQUEL': 'sequel',              // Secuela
    'PREQUEL': 'prequel',            // Precuela
    'SIDE_STORY': 'side_story',      // Historia paralela
    'SPIN_OFF': 'spin_off',          // Spin-off
    'ALTERNATIVE': 'alternative',     // Versión alternativa
    'SUMMARY': 'summary',            // Resumen
    'OTHER': 'other',                // Otra relación
    'CHARACTER': 'character',        // Comparte personajes
    'COMPILATION': 'compilation',    // Compilación
    'CONTAINS': 'contains',          // Contiene
    'PARENT': 'parent',              // Padre
  };

  return anilist.relations.edges.map(edge => ({
    related_anilist_id: edge.node.id,
    related_type: edge.node.type.toLowerCase(), // 'anime' o 'manga'
    relation_type: relationTypeMap[edge.relationType] || 'other',
  }));
}

// Instancia singleton
export const anilistClient = new AniListClient();
