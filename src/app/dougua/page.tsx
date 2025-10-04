/**
 * @fileoverview Página de la categoría "Dougua".
 * 
 * Esta página actúa como el hub principal para todo el contenido de dougua (animación china).
 * Muestra diferentes secciones de rankings y recomendaciones, y en la vista de escritorio
 * incluye una barra lateral con rankings de personajes y últimas publicaciones del foro.
 * Su estructura es idéntica a la de la página de Anime.
 */

import AnimePageClient from "@/components/anime-page-client";
import LatestPostsCard from "@/components/latest-posts-card";
import RecommendationsCard from "@/components/recommendations-card";
import TopCharactersCard from "@/components/top-characters-card";
import { getMediaListPage, getTopCharacters } from "@/lib/db";


export default function DouguaPage() {
    const topCharacters = getTopCharacters(5);
    const recommendations = getMediaListPage("Dougua").topAllTime.sort(() => 0.5 - Math.random()).slice(0, 4);
    const latestPosts = [
        { id: 'post1', title: '¿Cuál es la mejor novela de cultivación adaptada a dougua?', author: 'Cultivator', replies: 88 },
        { id: 'post2', title: 'La animación de Link Click es de otro nivel', author: 'TimeTraveler', replies: 150 },
        { id: 'post3', title: '¿Mo Dao Zu Shi o Tian Guan Ci Fu?', author: 'MXTXFan', replies: 301 },
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 lg:gap-8 my-8">
            <div className="lg:col-span-3">
                <AnimePageClient mediaType="Dougua" />
            </div>
            <aside className="hidden lg:block lg:col-span-1 space-y-8">
                <RecommendationsCard items={recommendations} />
                <TopCharactersCard characters={topCharacters} />
                <LatestPostsCard posts={latestPosts} />
            </aside>
        </div>
    );
}