'use client';
import TopMediaList from "@/components/top-media-list";
import TopRankingSlideshow from "@/components/top-ranking-slideshow";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getMediaListPage } from "@/lib/db";
import { MediaType, TitleInfo } from "@/lib/types";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const popularGenres = ["Fantasía", "Acción", "Aventura", "Misterio", "Isekai", "Sobrenatural"];

export default function NovelaPage() {
    const mediaType: MediaType = "Novela";
    const { topAllTime } = getMediaListPage(mediaType);
    
    const [weeklyVisibleCount, setWeeklyVisibleCount] = useState(6);
    const [topWeekly, setTopWeekly] = useState<TitleInfo[]>([]);
    const [recommendations, setRecommendations] = useState<TitleInfo[]>([]);
    const [topDaily, setTopDaily] = useState<TitleInfo[]>([]);

    useEffect(() => {
        // This should only run on the client after hydration
        const shuffled = [...topAllTime].sort(() => 0.5 - Math.random());
        setTopDaily(shuffled.slice(0, 5));
        
        // A different shuffle for weekly to ensure they are not the same
        const shuffledWeekly = [...topAllTime].sort(() => 0.5 - Math.random());
        setTopWeekly(shuffledWeekly);

        // A different shuffle for recommendations
        const shuffledRecs = [...topAllTime].sort(() => 0.5 - Math.random());
        setRecommendations(shuffledRecs.slice(0, 4));
    }, [topAllTime]);

    const handleShowMoreWeekly = () => {
        setWeeklyVisibleCount(prev => prev + 6);
    };

    return (
        <main className="container mx-auto p-2 sm:p-6 space-y-12">
            
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
                <Card>
                    <CardContent className="p-4 space-y-4">
                        <div className="flex flex-wrap gap-2">
                            {popularGenres.map(genre => (
                                <Button key={genre} variant="secondary">
                                    {genre}
                                </Button>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 ss:grid-cols-3 sm:grid-cols-4 gap-4">
                            {topAllTime.slice(0, 4).map(item => (
                                <Link key={item.id} href={`/${item.type.toLowerCase().replace(/ /g, '-')}/${item.slug}`} className="group">
                                    <Card className="overflow-hidden h-full">
                                        <div className="relative aspect-[2/3] w-full">
                                            <Image
                                                src={item.imageUrl}
                                                alt={item.title}
                                                fill
                                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                                                data-ai-hint={item.imageHint}
                                            />
                                        </div>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                        <div className="flex justify-center mt-4">
                            <Button variant="outline">Ver más</Button>
                        </div>
                    </CardContent>
                </Card>
            </section>

            <section>
                <h2 className="text-2xl font-bold font-headline mb-4">Recomendado para ti</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recommendations.map(item => (
                        <Card key={item.id} className="flex items-center gap-4 p-3 overflow-hidden transition-all duration-200 hover:bg-accent/50 hover:shadow-md">
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
