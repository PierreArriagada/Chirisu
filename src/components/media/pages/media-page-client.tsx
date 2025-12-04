'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { 
  CoreInfoCard, 
  SynopsisCard, 
  DetailsCard, 
  OfficialLinksCard, 
  SocialsCard, 
  EpisodesCard, 
  ReviewsSection, 
  StatsCard, 
  MediaGallery, 
  RelatedCard,
  CharactersDisplay,
  StaffDisplay,
  EpisodesDisplay,
  StudiosDisplay,
  ChaptersDisplay
} from '@/components/media';
import { Recommendations } from '@/components/shared';
import { DynamicTheme } from '@/components/layout';
import { CommentsSection } from '@/components/comments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { MediaType, OfficialLinks, RelatedTitle } from '@/lib/types';

interface MediaPageClientProps {
  id: string;
  type: MediaType;
}

export default function MediaPageClient({ id, type }: MediaPageClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mediaData, setMediaData] = useState<any>(null);

  useEffect(() => {
    loadMediaData();
  }, [id, type]);

  const loadMediaData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mapear MediaType a tipo de API
      const typeMap: Record<string, string> = {
        'Anime': 'anime',
        'Manga': 'manga',
        'Novela': 'novel',
        'Donghua': 'donghua',
        'Manhua': 'manhua',
        'Manhwa': 'manhwa',
        'Fan Comic': 'fan_comic',
      };

      const apiType = typeMap[type] || 'anime';
      const url = `/api/media/details/${id}?type=${apiType}`;
      
      console.log(`🔍 MediaPageClient - Cargando: ${url}`);
      console.log(`   ID: ${id}, Type: ${type}, API Type: ${apiType}`);

      const response = await fetch(url);

      console.log(`📊 Response status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        console.error('❌ Error response:', errorData);
        
        if (response.status === 404) {
          router.push('/404');
          return;
        }
        throw new Error(errorData.error || 'Error al cargar el medio');
      }

      const data = await response.json();
      console.log('✅ Data recibida:', data);

      if (data.success && data.data) {
        setMediaData(data.data);
      } else {
        throw new Error('Datos inválidos en la respuesta');
      }
    } catch (err) {
      console.error('❌ Error loading media:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  if (error || !mediaData) {
    return (
      <Card className="max-w-2xl mx-auto mt-8">
        <CardContent className="pt-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Error al cargar</h2>
            <p className="text-muted-foreground mb-6">{error || 'No se pudo cargar el contenido'}</p>
            <button
              onClick={loadMediaData}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Reintentar
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Transformar datos de la API al formato que esperan los componentes
  const createFallbackId = (prefix: string, seed?: string | number) =>
    `${prefix}-${seed ?? Math.random().toString(36).slice(2, 10)}`;
  const streamingIdentifiers = ['crunchyroll', 'netflix', 'hidive', 'disney', 'youtube', 'amazon', 'prime', 'hulu', 'max'];
  const fanIdentifiers = ['fansub', 'scan', 'fan', 'reddit', 'discord'];
  const placeholderCharacterImage = 'https://placehold.co/120x180?text=Character';
  const placeholderVoiceActorImage = 'https://placehold.co/80x120?text=VA';
  const placeholderUserAvatar = 'https://placehold.co/64x64?text=User';

  const releaseDateDisplay = mediaData.startDate
    ? new Date(mediaData.startDate).toLocaleDateString('es-CL')
    : 'Por confirmar';
  const endDateDisplay = mediaData.endDate
    ? new Date(mediaData.endDate).toLocaleDateString('es-CL')
    : null;

  const mainStudio = mediaData.studios?.find((studio: any) => studio.isMain);
  const supportingStudios = (mediaData.studios || []).filter((studio: any) => !studio.isMain);

  const languageMeta = (language: string = '') => {
    const normalized = language.toLowerCase();
    if (normalized.startsWith('ja')) {
      return { flag: '🇯🇵', label: 'Japonés' };
    }
    if (normalized.startsWith('ko')) {
      return { flag: '🇰🇷', label: 'Coreano' };
    }
    if (normalized.startsWith('zh') || normalized.startsWith('cn')) {
      return { flag: '🇨🇳', label: 'Chino' };
    }
    if (normalized.startsWith('en')) {
      return { flag: '🇺🇸', label: 'Inglés' };
    }
    if (normalized.startsWith('es')) {
      return { flag: '🇪🇸', label: 'Español' };
    }
    if (normalized.startsWith('pt')) {
      return { flag: '🇧🇷', label: 'Portugués' };
    }
    if (normalized.includes('synonym')) {
      return { flag: '🔁', label: 'Sinónimo' };
    }
    return { flag: '🌐', label: language ? language.toUpperCase() : 'Otro' };
  };

  // Determinar el idioma nativo basándose en el país de origen o tipo de media
  const getNativeLanguageInfo = () => {
    const country = mediaData.countryOfOrigin?.toUpperCase();
    if (country === 'KR' || type === 'Manhwa') {
      return { flag: '🇰🇷', label: 'Coreano' };
    }
    if (country === 'CN' || type === 'Manhua' || type === 'Donghua') {
      return { flag: '🇨🇳', label: 'Chino' };
    }
    // Por defecto, japonés para anime/manga/novel
    return { flag: '🇯🇵', label: 'Japonés' };
  };

  const nativeLanguageInfo = getNativeLanguageInfo();

  const baseAlternativeTitles = [
    mediaData.titleNative && { lang: nativeLanguageInfo.label, flag: nativeLanguageInfo.flag, title: mediaData.titleNative },
    mediaData.titleRomaji && { lang: 'Romaji', flag: '🈶', title: mediaData.titleRomaji },
    mediaData.titleEnglish && { lang: 'Inglés', flag: '🇺🇸', title: mediaData.titleEnglish },
  ].filter(Boolean);

  const additionalAlternativeTitles = (mediaData.alternativeTitles || []).map((alt: any) => {
    const meta = languageMeta(alt.language);
    return {
      lang: meta.label,
      flag: meta.flag,
      title: alt.text,
    };
  });

  const alternativeTitles = [...baseAlternativeTitles, ...additionalAlternativeTitles];

  const characters = (mediaData.characters || []).map((character: any, index: number) => {
    const roleLabel = character.role === 'main' ? 'Principal' : 'Secundario';
    return {
      id: character.id?.toString() ?? createFallbackId('character', index),
      slug: character.slug ?? '',
      name: character.name ?? 'Personaje sin nombre',
      imageUrl: character.imageUrl || placeholderCharacterImage,
      imageHint: 'Retrato de personaje',
      role: roleLabel,
      voiceActors: {
        japanese: {
          id: createFallbackId('va', character.id ?? index),
          slug: character.voiceActorSlug ?? '',
          name: character.voiceActorName ?? 'Por asignar',
          imageUrl: character.voiceActorImage ?? placeholderVoiceActorImage,
          imageHint: 'Retrato de actor de voz',
        },
        spanish: {
          id: createFallbackId('va-es', character.id ?? index),
          slug: '',
          name: 'Por asignar',
          imageUrl: placeholderVoiceActorImage,
          imageHint: 'Retrato de actor de voz',
        },
      },
    };
  });

  const episodes = (mediaData.episodesList || []).map((episode: any, index: number) => ({
    id: episode.id?.toString() ?? `episode-${index}`,
    name: episode.name ?? `Episodio ${episode.number ?? index + 1}`,
    imageUrl: episode.imageUrl || 'https://placehold.co/320x180?text=Episode',
    imageHint: episode.imageHint || 'Imagen de episodio',
    duration: episode.duration || 'Por confirmar',
    comments: episode.comments ?? 0,
    releaseDate: episode.releaseDate,
    watchLinks: episode.watchLinks,
  }));

  // Nota: Reviews ahora se cargan directamente en el componente ReviewsCard desde la API

  const initialLinks: OfficialLinks = {
    officialSites: [],
    streamingPlatforms: [],
    fanTranslations: [],
  };

  const categorizedLinks = (mediaData.externalLinks || []).reduce((acc: OfficialLinks, link: any) => {
    if (!link?.url) {
      return acc;
    }

    const name = link.site || 'Sitio oficial';
    const url = link.url;
    const normalizedSite = (link.site || '').toLowerCase();
    const normalizedUrl = url.toLowerCase();

    if (streamingIdentifiers.some(identifier => normalizedSite.includes(identifier) || normalizedUrl.includes(identifier))) {
      acc.streamingPlatforms.push({ name, url });
      return acc;
    }

    if (fanIdentifiers.some(identifier => normalizedSite.includes(identifier) || normalizedUrl.includes(identifier))) {
      acc.fanTranslations.push({ name, url });
      return acc;
    }

    acc.officialSites.push({ name, url });
    return acc;
  }, initialLinks);

  const hasLinks =
    categorizedLinks.officialSites.length > 0 ||
    categorizedLinks.streamingPlatforms.length > 0 ||
    categorizedLinks.fanTranslations.length > 0;

  const officialLinks = hasLinks ? categorizedLinks : undefined;

  const titleInfo = {
    id: mediaData.id,
    title: mediaData.title,
    imageUrl: mediaData.imageUrl || 'https://placehold.co/400x600?text=No+Image',
    rating: mediaData.rating,
    type: type,
    description: mediaData.synopsis || 'Sin descripción disponible',
    slug: mediaData.slug || mediaData.id,
    imageHint: mediaData.imageUrl ? 'Imagen de portada del medio' : 'Imagen de portada no disponible',
  ranking: mediaData.ranking ?? mediaData.rank ?? undefined,
    commentsCount: mediaData.commentsCount || 0,
    listsCount: mediaData.stats?.totalUsers || 0,
  };

  const details = {
    // Usar el type de la BD directamente (TV, Movie, OVA para anime; Manhwa, Manhua, Manga para manga/manhwa/manhua; Novel, Light_Novel para novels)
    type: mediaData.type || 'Desconocido',
    status: mediaData.status || 'Desconocido',
    releaseDate: releaseDateDisplay,
    endDate: endDateDisplay,
    episodes: mediaData.episodes ?? mediaData.episodeCount ?? 0,
    duration: mediaData.duration || 'Desconocido',
    rating: mediaData.rating > 0 ? `${mediaData.rating.toFixed(1)}` : 'N/A',
    studio: mainStudio?.name || 'Desconocido',
    genres: mediaData.genres?.map((g: any) => g.nameEs) || [],
    alternativeTitles,
    volumes: mediaData.volumes,
    chapters: mediaData.chapters,
    season: mediaData.season,
    source: mediaData.source || 'Desconocido',
    countryOfOrigin: mediaData.countryOfOrigin || 'Desconocido',
    promotion: null,
    producer: mainStudio?.name || 'Desconocido',
    licensors: supportingStudios.map((studio: any) => studio.name),
    studios: mediaData.studios || [],
    authors: mediaData.authors || [],
    serialization: mediaData.serialization || 'Desconocido',
  } as any;

  const showEpisodes = type === 'Anime' || type === 'Donghua';

  // Mapear MediaType a tipo de DB para reviews
  // Tipo para ReviewsCard (usa 'novel' singular)
  const reviewableType = (() => {
    const typeMap: Record<string, 'anime' | 'manga' | 'novel' | 'donghua' | 'manhua' | 'manhwa' | 'fan_comic'> = {
      'Anime': 'anime',
      'Donghua': 'donghua',
      'Manga': 'manga',
      'Manhua': 'manhua',
      'Manhwa': 'manhwa',
      'Fan Comic': 'fan_comic',
      'Novela': 'novel',
    };
    return typeMap[type] || 'anime';
  })();

  // Tipo para CommentsSection (usa 'novels' plural)
  const commentableType = (() => {
    const typeMap: Record<string, 'anime' | 'manga' | 'novels' | 'donghua' | 'manhua' | 'manhwa' | 'fan_comic'> = {
      'Anime': 'anime',
      'Donghua': 'donghua',
      'Manga': 'manga',
      'Manhua': 'manhua',
      'Manhwa': 'manhwa',
      'Fan Comic': 'fan_comic',
      'Novela': 'novels',
    };
    return typeMap[type] || 'anime';
  })();

  // Preparar datos para StatsCard
  const stats = {
    score: mediaData.rating || 0,
    popularity: mediaData.rankPopularity || mediaData.ranking || 0,
    favorites: mediaData.stats?.favoritesCount || 0,
    completed: mediaData.stats?.completedCount || 0,
    watching: mediaData.stats?.watchingCount || 0,
    planToWatch: mediaData.stats?.planToCount || 0,
  };

  // Preparar datos para MediaGallery
  const mediaGallery = {
    trailers: mediaData.trailers || [],
    videos: mediaData.videos || [],
    images: mediaData.images || [],
  };

  // Preparar datos para RelatedCard
  const relatedMedia: RelatedTitle[] = (mediaData.relations || []).map((relation: any) => ({
    id: relation.targetId?.toString() || '',
    slug: relation.slug || '',
    title: relation.title || '',
    type: relation.targetType || 'anime', // Usar targetType (anime/manga/novel) en vez de relation_type (adaptation)
    imageUrl: relation.coverImageUrl || '',
    imageHint: relation.title || '',
  }));

  return (
    <div className="bg-background min-h-screen">
      <DynamicTheme 
        imageUrl={titleInfo.imageUrl} 
        dominantColor={mediaData.dominantColor} 
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-8">
        {/* Columna Principal */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Tarjetas principales - SIEMPRE VISIBLES */}
          <CoreInfoCard titleInfo={titleInfo} />
          <SocialsCard titleInfo={titleInfo} />
          <SynopsisCard description={titleInfo.description} />
          <DetailsCard details={details} />
          <OfficialLinksCard 
            links={officialLinks} 
            mediaId={mediaData.id}
            mediaType={reviewableType}
            mediaTitle={titleInfo.title}
          />

          {/* Acordeones - SIEMPRE VISIBLES */}
          <Accordion type="multiple" className="w-full space-y-4">
            {/* Acordeón de Personajes con Actores de Voz - DE BASE DE DATOS */}
            <Card>
              <AccordionItem value="characters" className="border-0">
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <span className="text-xl font-semibold">Personajes &amp; Actores de Voz</span>
                </AccordionTrigger>
                <AccordionContent className="px-6">
                  <CharactersDisplay 
                    mediaId={mediaData.id} 
                    mediaType={reviewableType} 
                  />
                </AccordionContent>
              </AccordionItem>
            </Card>

            {/* Acordeón de Staff & Producción */}
            <Card>
              <AccordionItem value="staff" className="border-0">
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <span className="text-xl font-semibold">Staff &amp; Producción</span>
                </AccordionTrigger>
                <AccordionContent className="px-6">
                  <StaffDisplay 
                    mediaId={mediaData.id} 
                    mediaType={reviewableType} 
                  />
                </AccordionContent>
              </AccordionItem>
            </Card>

            {/* Acordeón de Estudios - SOLO PARA ANIME */}
            {showEpisodes && (
              <Card>
                <AccordionItem value="studios" className="border-0">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <span className="text-xl font-semibold">Estudios de Animación</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6">
                    <StudiosDisplay animeId={mediaData.id} />
                  </AccordionContent>
                </AccordionItem>
              </Card>
            )}

            {/* Acordeón de Episodios Reales - DE BASE DE DATOS - SOLO ANIME/DONGHUA */}
            {showEpisodes && (
              <Card>
                <AccordionItem value="episodes-real" className="border-0">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <span className="text-xl font-semibold">Lista de Episodios</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6">
                    <EpisodesDisplay 
                      animeId={mediaData.id} 
                      mediaType={type === 'Donghua' ? 'donghua' : 'anime'}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Card>
            )}

            {/* Acordeón de Capítulos - SOLO PARA MANGA/LECTURAS */}
            {!showEpisodes && (
              <Card>
                <AccordionItem value="chapters" className="border-0">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <span className="text-xl font-semibold">Capítulos</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-6">
                    <ChaptersDisplay 
                      mediaId={parseInt(id)}
                      chapters={mediaData.chapters}
                      volumes={mediaData.volumes}
                      mediaType={reviewableType as 'manga' | 'novel' | 'manhua' | 'manhwa' | 'fan_comic'}
                      status={mediaData.status}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Card>
            )}

            {/* Acordeón de Estadísticas - SIEMPRE VISIBLE */}
            <Card>
              <AccordionItem value="stats" className="border-0">
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <span className="text-xl font-semibold">Estadísticas</span>
                </AccordionTrigger>
                <AccordionContent className="px-6">
                  <StatsCard stats={stats} />
                </AccordionContent>
              </AccordionItem>
            </Card>

            {/* Acordeón de Reseñas - SIEMPRE VISIBLE */}
            <Card>
              <AccordionItem value="reviews" className="border-0">
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <span className="text-xl font-semibold">Reseñas</span>
                </AccordionTrigger>
                <AccordionContent className="px-6">
                  <ReviewsSection 
                    mediaId={mediaData.id.toString()} 
                    mediaType={reviewableType} 
                    mediaTitle={titleInfo.title}
                  />
                </AccordionContent>
              </AccordionItem>
            </Card>

            {/* Acordeón de Multimedia - SIEMPRE VISIBLE */}
            <Card>
              <AccordionItem value="media" className="border-0">
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <span className="text-xl font-semibold">Multimedia</span>
                </AccordionTrigger>
                <AccordionContent className="px-6">
                  <MediaGallery 
                    trailers={mediaGallery.trailers}
                    videos={mediaGallery.videos}
                    images={mediaGallery.images}
                  />
                </AccordionContent>
              </AccordionItem>
            </Card>
          </Accordion>

          {/* Tarjeta de Relacionados - SIEMPRE VISIBLE */}
          <RelatedCard relatedTitles={relatedMedia} />

          {/* Sección de Comentarios */}
          <CommentsSection 
            commentableType={commentableType}
            commentableId={mediaData.id.toString()}
          />
        </div>

        {/* Columna Lateral - Recomendaciones - SIEMPRE VISIBLE */}
        <div className="lg:col-span-1 flex flex-col gap-8">
          <Recommendations 
            currentMediaId={id}
            currentMediaType={type}
            currentMediaTitle={titleInfo.title}
          />
        </div>
      </div>
    </div>
  );
}
