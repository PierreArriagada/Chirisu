/**
 * @fileoverview Componente de cliente para la página de Anime.
 * 
 * Este componente contiene la lógica del lado del cliente para la página de la categoría "Anime".
 * Se encarga de obtener y mostrar de forma aleatoria diferentes secciones de rankings y recomendaciones:
 * - Un carrusel destacado con el "Top Diario".
 * - Una lista con el "Top Semanal", con opción de cargar más.
 * - Una cuadrícula interactiva de "Top por Géneros".
 */

'use client';
import TopMediaList from "@/components/top-media-list";
import TopRankingSlideshow from "@/components/top-ranking-slideshow";
import { Button } from "@/components/ui/button";
import { getMediaListPage } from "@/lib/db";
import { MediaType, TitleInfo } from "@/lib/types";
import { useState, useEffect } from "react";
import GenreGridCard from "@/components/genre-grid-card";

const popularGenres = ["Acción", "Fantasía", "Romance", "Seinen", "Comedia", "Aventura", "Misterio", "Drama", "Sci-Fi"];

export default function AnimePageClient() {
    const mediaType: MediaType = "Anime";
    
    const [topDaily, setTopDaily] = useState<TitleInfo[]>([]);
    const [topWeekly, setTopWeekly] = useState<TitleInfo[]>([]);
    const [genreItems, setGenreItems] = useState<TitleInfo[]>([]);

    const [weeklyVisibleCount, setWeeklyVisibleCount] = useState(6);


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

    }, []);

    const handleShowMoreWeekly = () => {
        setWeeklyVisibleCount(prev => prev + 6);
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
            
        </main>
    );
}
