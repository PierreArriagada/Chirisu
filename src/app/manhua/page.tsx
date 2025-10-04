/**
 * @fileoverview Página de la categoría "Manhua".
 * 
 * Hub principal para todo el contenido de manhua (cómics chinos). Sigue la misma
 * estructura que las otras páginas de categoría, mostrando rankings
 * diarios, semanales, por género y recomendaciones.
 */

'use client';
import TopMediaList from "@/components/top-media-list";
import TopRankingSlideshow from "@/components/top-ranking-slideshow";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getMediaListPage } from "@/lib/db";
import { MediaType, TitleInfo } from "@/lib/types";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import GenreGridCard from "@/components/genre-grid-card";

const popularGenres = ["Acción", "Artes Marciales", "Fantasía", "Histórico", "Aventura", "Romance"];

export default function ManhuaPage() {
    const mediaType: MediaType = "Manhua";
    
    const [topDaily, setTopDaily] = useState<TitleInfo[]>([]);
    const [topWeekly, setTopWeekly] = useState<TitleInfo[]>([]);
    const [recommendations, setRecommendations] = useState<TitleInfo[]>([]);
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

        // A different shuffle for recommendations
        const shuffledRecs = [...allItems].sort(() => 0.5 - Math.random());
        setRecommendations(shuffledRecs.slice(0, 4));

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

            <section>
                <h2 className="text-2xl font-bold font-headline mb-4">Recomendado para ti</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recommendations.map(item => (
                        <Card key={item.id} className="flex items-center gap-4 p-3 overflow-hidden transition-all duration-200 hover:bg-accent/50 hover:shadow-md">
                           <Link href={`/${item.type.toLowerCase().replace(/ /g, '-')}/${item.slug}`} className="flex items-center gap-4 w-full group">
                                <div className="flex-shrink-0">
                                     <Image src={item.imageUrl} alt={item.title} width={60} height={90} className="w-16 h-24 object-cover rounded-md" data-ai-hint={item.imageHint} />
                                </div>
                                <div className="overflow-hidden">
                                    <h4 className="font-semibold leading-tight truncate group-hover:text-primary transition-colors">{item.title}</h4>
                                    <p className="text-sm text-muted-foreground capitalize">{item.type}</p>
                                </div>
                            </Link>
                        </Card>
                    ))}
                </div>
            </section>
            
        </main>
    );
}