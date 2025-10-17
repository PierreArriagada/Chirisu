/**
 * @fileoverview Componente de cliente para la página de Anime.
 * 
 * Este componente contiene la lógica del lado del cliente para la página de la categoría "Anime".
 * Se encarga de obtener y mostrar de forma aleatoria diferentes secciones de rankings y recomendaciones:
 * - Un carrusel destacado con el "Top Diario".
 * - Una lista con el "Top Semanal", con opción de cargar más.
 * - Una cuadrícula interactiva de "Top por Géneros".
 * - Una sección de "Últimos Animes Agregados".
 * - Secciones para "Trailers más Vistos" y "Próximos Estrenos".
 */

'use client';
import TopMediaList from "@/components/top-media-list";
import TopRankingSlideshow from "@/components/top-ranking-slideshow";
import { Button } from "@/components/ui/button";
import { MediaType, TitleInfo } from "@/lib/types";
import { useState, useEffect } from "react";
import GenreGridCard from "@/components/genre-grid-card";
import { Card, CardContent } from "./ui/card";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calendar, PlayCircle, Loader2 } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem } from "./ui/carousel";

const popularGenres: Record<MediaType, string[]> = {
    'Anime': ["Acción", "Fantasía", "Romance", "Seinen", "Comedia", "Aventura", "Misterio", "Drama", "Sci-Fi"],
    'Manga': ["Seinen", "Acción", "Aventura", "Drama", "Fantasía", "Sobrenatural"],
    'Dougua': ["Acción", "Aventura", "Fantasía", "Histórico", "Artes Marciales", "Sobrenatural"],
    'Manhua': ["Acción", "Artes Marciales", "Fantasía", "Histórico", "Aventura", "Romance"],
    'Manwha': ["Acción", "Fantasía", "Drama", "Aventura", "Psicológico", "Deportes"],
    'Novela': ["Fantasía", "Acción", "Aventura", "Misterio", "Isekai", "Sobrenatural"],
    'Fan Comic': ["Acción", "Superhéroes", "Aventura", "Comedia", "Drama", "Fantasía"],
};

interface Trailer {
    id: number;
    title: string;
    url: string;
    thumbnail: string;
    viewsCount: number;
    media?: {
        id: number;
        title: string;
        type: string;
    };
}

export default function AnimePageClient({ mediaType = "Anime" }: { mediaType?: MediaType }) {
    
    const [topDaily, setTopDaily] = useState<TitleInfo[]>([]);
    const [topWeekly, setTopWeekly] = useState<TitleInfo[]>([]);
    const [genreItems, setGenreItems] = useState<TitleInfo[]>([]);
    const [latestAdditions, setLatestAdditions] = useState<TitleInfo[]>([]);
    const [upcomingReleases, setUpcomingReleases] = useState<TitleInfo[]>([]);
    const [trailers, setTrailers] = useState<Trailer[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [weeklyVisibleCount, setWeeklyVisibleCount] = useState(6);
    const [latestVisibleCount, setLatestVisibleCount] = useState(6);

    const showVideoSections = mediaType === 'Anime' || mediaType === 'Dougua';

    useEffect(() => {
        loadMediaData();
    }, [mediaType]);

    const loadMediaData = async () => {
        try {
            setLoading(true);
            
            // Mapear MediaType a tipo de API
            const typeMap: Record<MediaType, string> = {
                'Anime': 'anime',
                'Manga': 'manga',
                'Novela': 'novel',
                'Dougua': 'anime',
                'Manhua': 'manga',
                'Manwha': 'manga',
                'Fan Comic': 'manga',
            };
            
            const apiType = typeMap[mediaType] || 'anime';
            
            console.log(`🔍 Cargando datos para ${mediaType} (API type: ${apiType})`);
            
            // Usar API de rankings para top daily
            const responseDailyPromise = fetch(`/api/rankings?type=${apiType}&period=daily&limit=5`).then(r => r.json());
            
            // Usar API de rankings para top weekly
            const responseWeeklyPromise = fetch(`/api/rankings?type=${apiType}&period=weekly&limit=20`).then(r => r.json());
            
            // Obtener all time para géneros
            const responseAllTimePromise = fetch(`/api/rankings?type=${apiType}&period=all_time&limit=30`).then(r => r.json());
            
            const [dataDaily, dataWeekly, dataAllTime] = await Promise.all([
                responseDailyPromise,
                responseWeeklyPromise,
                responseAllTimePromise
            ]);
            
            console.log('📊 Respuesta Daily:', dataDaily);
            console.log('📊 Respuesta Weekly:', dataWeekly);
            console.log('📊 Respuesta AllTime:', dataAllTime);
            
            // Procesar Top Daily
            if (dataDaily.rankings && dataDaily.rankings.length > 0) {
                console.log(`✅ Daily rankings recibidos: ${dataDaily.rankings.length} items`);
                const dailyItems: TitleInfo[] = dataDaily.rankings.map((item: any, index: number) => ({
                    id: item.id.toString(),
                    slug: item.slug || item.id.toString(),
                    title: item.title,
                    type: mediaType,
                    description: '',
                    imageUrl: item.coverImage || 'https://placehold.co/400x600?text=No+Image',
                    imageHint: item.title,
                    rating: item.averageScore || 0,
                    ranking: index + 1, // ✅ FIXED: Usar posición en el array (1-indexed)
                    commentsCount: 0,
                    listsCount: 0,
                }));
                setTopDaily(dailyItems);
            } else {
                console.warn('⚠️ No hay rankings diarios disponibles');
                setTopDaily([]);
            }
            
            // Procesar Top Weekly
            if (dataWeekly.rankings && dataWeekly.rankings.length > 0) {
                console.log(`✅ Weekly rankings recibidos: ${dataWeekly.rankings.length} items`);
                const weeklyItems: TitleInfo[] = dataWeekly.rankings.map((item: any, index: number) => ({
                    id: item.id.toString(),
                    slug: item.slug || item.id.toString(),
                    title: item.title,
                    type: mediaType,
                    description: '',
                    imageUrl: item.coverImage || 'https://placehold.co/400x600?text=No+Image',
                    imageHint: item.title,
                    rating: item.averageScore || 0,
                    ranking: index + 1, // ✅ FIXED: Usar posición en el array (1-indexed)
                    commentsCount: 0,
                    listsCount: 0,
                }));
                setTopWeekly(weeklyItems);
            } else {
                console.warn('⚠️ No hay rankings semanales disponibles');
                setTopWeekly([]);
            }
            
            // Procesar AllTime para géneros
            if (dataAllTime.rankings && dataAllTime.rankings.length > 0) {
                console.log(`✅ AllTime rankings recibidos: ${dataAllTime.rankings.length} items`);
                const allTimeItems: TitleInfo[] = dataAllTime.rankings.map((item: any, index: number) => ({
                    id: item.id.toString(),
                    slug: item.slug || item.id.toString(),
                    title: item.title,
                    type: mediaType,
                    description: '',
                    imageUrl: item.coverImage || 'https://placehold.co/400x600?text=No+Image',
                    imageHint: item.title,
                    rating: item.averageScore || 0,
                    ranking: index + 1, // ✅ FIXED: Usar posición en el array (1-indexed)
                    commentsCount: 0,
                    listsCount: 0,
                }));
                setGenreItems(allTimeItems);
            } else {
                console.warn('⚠️ No hay rankings all-time disponibles');
                setGenreItems([]);
            }
            
            // Obtener últimos agregados (ordenados por fecha)
            const responseLatest = await fetch(`/api/media?type=${apiType}&sort=created_at&order=DESC&limit=12`);
            const dataLatest = await responseLatest.json();
            
            console.log('📊 Respuesta Latest:', dataLatest);
            
            if (dataLatest.success && dataLatest.data) {
                console.log(`✅ Latest data recibida: ${dataLatest.data.length} items`);
                const latest: TitleInfo[] = dataLatest.data.map((item: any) => ({
                    id: item.id,
                    slug: item.slug,
                    title: item.title,
                    type: mediaType,
                    description: item.synopsis || '',
                    imageUrl: item.imageUrl || 'https://placehold.co/400x600?text=No+Image',
                    imageHint: item.title,
                    rating: item.rating || 0,
                    ranking: 0,
                    commentsCount: 0,
                    listsCount: 0,
                }));
                setLatestAdditions(latest);
            } else {
                console.warn('⚠️ No se recibió data en respuesta Latest:', dataLatest);
                setLatestAdditions([]);
            }
            
            // Próximos estrenos - por ahora usar same data que weekly
            if (showVideoSections && dataWeekly.rankings) {
                const upcomingItems: TitleInfo[] = dataWeekly.rankings.slice(0, 5).map((item: any, index: number) => ({
                    id: item.id.toString(),
                    slug: item.slug || item.id.toString(),
                    title: item.title,
                    type: mediaType,
                    description: '',
                    imageUrl: item.coverImage || 'https://placehold.co/400x600?text=No+Image',
                    imageHint: item.title,
                    rating: item.averageScore || 0,
                    ranking: index + 1, // ✅ FIXED: Usar posición en el array (1-indexed)
                    commentsCount: 0,
                    listsCount: 0,
                }));
                setUpcomingReleases(upcomingItems);
                
                // Cargar trailers más vistos del día
                try {
                    const responseTrailers = await fetch('/api/trailers?period=daily&limit=10');
                    const dataTrailers = await responseTrailers.json();
                    console.log('📊 Respuesta Trailers:', dataTrailers);
                    
                    if (dataTrailers.trailers && dataTrailers.trailers.length > 0) {
                        console.log(`✅ Trailers recibidos: ${dataTrailers.trailers.length} items`);
                        setTrailers(dataTrailers.trailers);
                    } else {
                        console.warn('⚠️ No hay trailers disponibles');
                        setTrailers([]);
                    }
                } catch (error) {
                    console.error('Error al cargar trailers:', error);
                    setTrailers([]);
                }
            }
            
        } catch (error) {
            console.error('Error loading media data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleShowMoreWeekly = () => {
        setWeeklyVisibleCount(prev => prev + 6);
    };
    
    const handleShowMoreLatest = () => {
        setLatestVisibleCount(prev => prev + 6);
    };

    return (
        <main className="space-y-12">
            
            {loading ? (
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : (
                <>
                    {topDaily.length > 0 ? (
                        <TopRankingSlideshow items={topDaily} />
                    ) : (
                        <div className="p-8 bg-muted rounded-lg text-center text-muted-foreground">
                            No hay rankings diarios disponibles. Agrega actividad (reviews, favoritos) para generar rankings.
                        </div>
                    )}
                    
                    <section>
                        <h2 className="text-2xl font-bold font-headline mb-4">Top Semanal</h2>
                        {topWeekly.length > 0 ? (
                            <>
                                <TopMediaList items={topWeekly.slice(0, weeklyVisibleCount)} />
                                {weeklyVisibleCount < topWeekly.length && weeklyVisibleCount < 12 && (
                                    <div className="flex justify-center mt-4">
                                        <Button variant="outline" onClick={handleShowMoreWeekly}>
                                            <span className="text-lg">+</span>
                                        </Button>
                                    </div>
                                )}
                                {weeklyVisibleCount >= 12 && topWeekly.length > 0 && (
                                    <div className="flex justify-center mt-4">
                                        <Button>Ver el ranking completo</Button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="p-8 bg-muted rounded-lg text-center text-muted-foreground">
                                No hay rankings semanales disponibles
                            </div>
                        )}
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold font-headline mb-4">Top por Géneros</h2>
                        <GenreGridCard categories={popularGenres[mediaType]} mediaType={mediaType} />
                    </section>
                </>
            )}

            <section>
                <div className="flex items-baseline justify-between mb-4">
                    <h2 className="text-2xl font-bold font-headline">Últimos Agregados</h2>
                    <Button variant="link" asChild className="text-muted-foreground">
                        <Link href="#">
                        Ver más <ArrowRight className="ml-1 w-4 h-4" />
                        </Link>
                    </Button>
                </div>
                {latestAdditions.length > 0 ? (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {latestAdditions.slice(0, latestVisibleCount).map(item => (
                                <Link key={item.id} href={`/${item.type.toLowerCase().replace(/ /g, '-')}/${item.slug}`} className="block group">
                                    <Card className="overflow-hidden h-full flex flex-col hover:shadow-lg transition-shadow duration-300">
                                        <div className="relative aspect-[2/3] w-full">
                                            <Image
                                                src={item.imageUrl}
                                                alt={`Cover for ${item.title}`}
                                                fill
                                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                                                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                                                data-ai-hint={item.imageHint}
                                            />
                                        </div>
                                        <div className="p-2 flex flex-col flex-grow">
                                            <h4 className="font-semibold leading-tight line-clamp-2 text-sm group-hover:text-primary transition-colors">{item.title}</h4>
                                        </div>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                        {latestVisibleCount < latestAdditions.length && (
                            <div className="flex justify-center mt-4">
                                <Button variant="outline" onClick={handleShowMoreLatest}>
                                    <span className="text-lg">+</span>
                                </Button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="p-8 bg-muted rounded-lg text-center text-muted-foreground">
                        No hay contenido agregado recientemente
                    </div>
                )}
            </section>

            {showVideoSections && (
                <>
                    <section>
                        <h2 className="text-2xl font-bold font-headline mb-4">Trailers más Vistos</h2>
                        {trailers.length > 0 ? (
                            <Carousel
                                opts={{
                                    align: "start",
                                    slidesToScroll: 'auto',
                                }}
                                className="w-full"
                            >
                                <CarouselContent className="-ml-2">
                                    {trailers.map((trailer) => (
                                        <CarouselItem key={trailer.id} className="pl-2 pr-2 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                                            <Card className="group overflow-hidden">
                                                <CardContent className="p-0">
                                                    <div className="relative aspect-video">
                                                        <Image 
                                                            src={trailer.thumbnail || 'https://placehold.co/300x169?text=Trailer'} 
                                                            alt={trailer.title} 
                                                            fill 
                                                            className="rounded-t-lg object-cover transition-transform duration-300 group-hover:scale-105" 
                                                        />
                                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-t-lg">
                                                            <a 
                                                                href={trailer.url} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="w-10 h-10 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center cursor-pointer hover:bg-white/50 transition-colors"
                                                            >
                                                                <PlayCircle className="w-6 h-6 text-white" />
                                                            </a>
                                                        </div>
                                                        <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-white">
                                                            {trailer.viewsCount.toLocaleString()} vistas
                                                        </div>
                                                    </div>
                                                    <div className="p-3">
                                                        <h3 className="font-semibold mt-1 text-sm line-clamp-2">{trailer.title}</h3>
                                                        {trailer.media && (
                                                            <p className="text-xs text-muted-foreground mt-1 truncate">
                                                                {trailer.media.title}
                                                            </p>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                            </Carousel>
                        ) : (
                            <div className="p-8 bg-muted rounded-lg text-center text-muted-foreground">
                                No hay trailers disponibles en este momento
                            </div>
                        )}
                    </section>

                    <section>
                        <div className="flex items-baseline justify-between mb-4">
                            <h2 className="text-2xl font-bold font-headline">Próximos Estrenos</h2>
                            <Button variant="link" asChild className="text-muted-foreground">
                                <Link href="#">
                                Ver calendario <ArrowRight className="ml-1 w-4 h-4" />
                                </Link>
                            </Button>
                        </div>
                        {upcomingReleases.length > 0 ? (
                            <div className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4">
                                {upcomingReleases.map(item => (
                                    <Card key={item.id} className="flex-shrink-0 w-64">
                                        <CardContent className="p-0">
                                            <Image src={item.imageUrl} alt={item.title} width={260} height={146} className="w-full h-36 object-cover rounded-t-lg" data-ai-hint={item.imageHint} />
                                            <div className="p-3">
                                                <h4 className="font-semibold truncate">{item.title}</h4>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                                    <Calendar size={14} />
                                                    <span>Próximamente</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 bg-muted rounded-lg text-center text-muted-foreground">
                                No hay próximos estrenos anunciados
                            </div>
                        )}
                    </section>
                </>
            )}
        </main>
    );
}