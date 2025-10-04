/**
 * @fileoverview Página de la categoría "Anime".
 * 
 * Esta página actúa como el hub principal para todo el contenido de anime.
 * Muestra diferentes secciones de rankings y recomendaciones, y en la vista de escritorio
 * incluye una barra lateral con rankings de personajes y últimas publicaciones del foro.
 */

import AnimePageClient from "@/components/anime-page-client";
import LatestPostsCard from "@/components/latest-posts-card";
import TopCharactersCard from "@/components/top-characters-card";
import { getTopCharacters } from "@/lib/db";


export default function AnimePage() {
    const topCharacters = getTopCharacters(5);
    const latestPosts = [
        { id: 'post1', title: '¿Qué tan fiel es la adaptación de Honzuki no Gekokujou?', author: 'MangaReader', replies: 45 },
        { id: 'post2', title: 'Mejor momento del último capítulo de The Boxer', author: 'AnimeWatcher', replies: 102 },
        { id: 'post3', title: 'Teorías sobre el final de Berserk', author: 'GutsFan', replies: 234 },
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 lg:gap-8 my-8">
            <div className="lg:col-span-3">
                <AnimePageClient />
            </div>
            <aside className="hidden lg:block lg:col-span-1 space-y-8">
                <TopCharactersCard characters={topCharacters} />
                <LatestPostsCard posts={latestPosts} />
            </aside>
        </div>
    );
}