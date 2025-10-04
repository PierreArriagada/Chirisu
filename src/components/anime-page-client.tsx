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
import { getMediaListPage, getUpcomingReleases, getLatestAdditions } from "@/lib/db";
import { MediaType, TitleInfo } from "@/lib/types";
import { useState, useEffect } from "react";
import GenreGridCard from "@/components/genre-grid-card";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import Image from "next/image";
import { Badge } from "./ui/badge";
import Link from "next/link";
import { ArrowRight, Calendar, PlayCircle } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem } from "./ui/carousel";

const popularGenres = ["Acción", "Fantasía", "Romance", "Seinen", "Comedia", "Aventura", "Misterio", "Drama", "Sci-Fi"];

const mostViewedTrailers = [
    { title: "Jujutsu Kaisen Temporada 3", imageSeed: "trailer-main" },
    { title: "Frieren: Beyond Journey's End", imageSeed: "trailer-second" },
    { title: "Attack on Titan The Final Season", imageSeed: "trailer-aot" },
    { title: "Chainsaw Man Movie: Reze Arc", imageSeed: "trailer-csm" },
    { title: "Oshi no Ko Season 2", imageSeed: "trailer-onk" },
    { title: "Dandadan First Trailer", imageSeed: "trailer-dnd" },
    { title: "Bleach: Thousand-Year Blood War", imageSeed: "trailer-bleach" },
    { title: "One Piece: Egghead Arc", imageSeed: "trailer-op" },
    { title: "Solo Leveling Season 2", imageSeed: "trailer-sl" },
    { title: "Vinland Saga Season 3", imageSeed: "trailer-vs" },
];

export default function AnimePageClient() {
    const mediaType: MediaType = "Anime";
    
    const [topDaily, setTopDaily] = useState<TitleInfo[]>([]);
    const [topWeekly, setTopWeekly] = useState<TitleInfo[]>([]);
    const [genreItems, setGenreItems] = useState<TitleInfo[]>([]);
    const [latestAdditions, setLatestAdditions] = useState<TitleInfo[]>([]);
    const [upcomingReleases, setUpcomingReleases] = useState<TitleInfo[]>([]);
    
    const [weeklyVisibleCount, setWeeklyVisibleCount] = useState(6);
    const [latestVisibleCount, setLatestVisibleCount] = useState(6);


    useEffect(() => {
        const allItems = getMediaListPage(mediaType).topAllTime;
        // This should only run on the client after hydration
        const shuffled = [...allItems].sort(() => 0.5 - Math.random());
        setTopDaily(shuffled.slice(0, 5));
        
        // A different shuffle for weekly to ensure they are not the same
        const shuffledWeekly = [...allItems].sort(() => 0.5 - Math.random());
        setTopWeekly(shuffledWeekly);

        const shuffledGenres = [...allItems].sort(() => 0.5 - Math.random());
        setGenreItems(shuffledGenres);

        setLatestAdditions(getLatestAdditions(12, 'Anime'));
        setUpcomingReleases(getUpcomingReleases(5, 'Anime'));

    }, []);

    const handleShowMoreWeekly = () => {
        setWeeklyVisibleCount(prev => prev + 6);
    };
    
    const handleShowMoreLatest = () => {
        setLatestVisibleCount(prev => prev + 6);
    };

    return (
        <main className="space-y-12">
            
            <TopRankingSlideshow items={topDaily} />
            
            <section>
                <h2 className="text-2xl font-bold font-headline mb-4">Top Semanal</h2>
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
            </section>

            <section>
                <h2 className="text-2xl font-bold font-headline mb-4">Top por Géneros</h2>
                <GenreGridCard categories={popularGenres} items={genreItems} />
            </section>

            <section>
                <div className="flex items-baseline justify-between mb-4">
                    <h2 className="text-2xl font-bold font-headline">Últimos Animes Agregados</h2>
                    <Button variant="link" asChild className="text-muted-foreground">
                        <Link href="#">
                        Ver más <ArrowRight className="ml-1 w-4 h-4" />
                        </Link>
                    </Button>
                </div>
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
            </section>

            <section>
                <h2 className="text-2xl font-bold font-headline mb-4">Trailers más Vistos</h2>
                <Carousel
                    opts={{
                        align: "start",
                        slidesToScroll: 'auto',
                    }}
                    className="w-full"
                >
                    <CarouselContent className="-ml-2">
                        {mostViewedTrailers.map((trailer, index) => (
                            <CarouselItem key={index} className="pl-2 pr-2 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                                <Card className="group overflow-hidden">
                                    <CardContent className="p-0">
                                        <div className="relative aspect-video">
                                            <Image src={`https://picsum.photos/seed/${trailer.imageSeed}/300/169`} alt={trailer.title} fill className="rounded-t-lg object-cover transition-transform duration-300 group-hover:scale-105" />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-t-lg">
                                                <div className="w-10 h-10 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center cursor-pointer hover:bg-white/50 transition-colors">
                                                    <PlayCircle className="w-6 h-6 text-white" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-3">
                                            <h3 className="font-semibold mt-1 text-sm line-clamp-2">{trailer.title}</h3>
                                        </div>
                                    </CardContent>
                                </Card>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                </Carousel>
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
                 <div className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4">
                    {upcomingReleases.map(item => (
                         <Card key={item.id} className="flex-shrink-0 w-64">
                            <CardContent className="p-0">
                                <Image src={item.imageUrl} alt={item.title} width={260} height={146} className="w-full h-36 object-cover rounded-t-lg" data-ai-hint={item.imageHint} />
                                <div className="p-3">
                                    <h4 className="font-semibold truncate">{item.title}</h4>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                        <Calendar size={14} />
                                        <span>Invierno 2025</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                 </div>
            </section>
            
        </main>
    );
}
