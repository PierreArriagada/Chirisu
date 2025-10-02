
'use client';
import TopMediaList from "@/components/top-media-list";
import TopRankingCarousel from "@/components/top-ranking-carousel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMediaListPage } from "@/lib/db";
import { MediaType, TitleInfo } from "@/lib/types";
import { useState, useMemo } from "react";

const popularGenres = ["Acción", "Fantasía", "Romance", "Seinen", "Comedia", "Aventura"];

export default function AnimePage() {
    const mediaType: MediaType = "Anime";
    const { topAllTime } = getMediaListPage(mediaType);
    
    // For "Top Semanal", which now has interactive "show more"
    const [weeklyVisibleCount, setWeeklyVisibleCount] = useState(6);
    const topWeekly = useMemo(() => topAllTime.slice().sort(() => 0.5 - Math.random()), [topAllTime]);

    // For "Recomendado para ti"
    const recommendations = useMemo(() => topAllTime.slice().sort(() => 0.5 - Math.random()).slice(0, 4), [topAllTime]);
    
    // For "Top Diario"
    const topDaily = useMemo(() => topAllTime.slice().sort(() => 0.5 - Math.random()), [topAllTime]);

    const handleShowMoreWeekly = () => {
        setWeeklyVisibleCount(prev => prev + 6);
    };

    return (
        <main className="container mx-auto p-4 sm:p-8 space-y-12">
            
            {/* 1. Carrusel Top Diario */}
            <TopRankingCarousel
                title="Top Diario de Anime"
                items={topDaily}
                viewMoreLink="/anime/top-100"
            />
            
            {/* 2. Top Semanal Interactivo */}
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
                {weeklyVisibleCount >= 12 && (
                    <div className="flex justify-center mt-4">
                        <Button>Ver el ranking completo</Button>
                    </div>
                )}
            </section>

            {/* 3. Top por Géneros */}
            <section>
                <h2 className="text-2xl font-bold font-headline mb-4">Top por Géneros</h2>
                <Card>
                    <CardContent className="p-4">
                         <div className="flex flex-wrap gap-2">
                            {popularGenres.map(genre => (
                                <Button key={genre} variant="secondary">
                                    {genre}
                                </Button>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* 4. Recomendaciones para el Usuario */}
            <section>
                <h2 className="text-2xl font-bold font-headline mb-4">Recomendado para ti</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recommendations.map(item => (
                        <Card key={item.id} className="flex items-center gap-4 p-3 overflow-hidden transition-all duration-200 hover:bg-accent/50 hover:shadow-md">
                           {/* Simplified item card */}
                            <img src={item.imageUrl} alt={item.title} className="w-16 h-24 object-cover rounded-md" />
                            <div className="overflow-hidden">
                                <h4 className="font-semibold leading-tight truncate">{item.title}</h4>
                                <p className="text-sm text-muted-foreground">{item.type}</p>
                            </div>
                        </Card>
                    ))}
                </div>
            </section>
            
        </main>
    );
}
