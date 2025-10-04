/**
 * @fileoverview Página de inicio de la aplicación.
 * 
 * Esta página es la entrada principal al sitio. Muestra una vista agregada
 * de los rankings más importantes de cada tipo de medio (Anime, Manga, etc.)
 * en un carrusel. En la versión de escritorio, también presenta una barra
 * lateral con rankings de personajes, personas y las últimas publicaciones
 * del foro para fomentar la interacción del usuario.
 */

import { getMediaListPage, getTopCharacters, getTopPeople } from '@/lib/db';
import { MediaType } from '@/lib/types';
import TopRankingCarousel from '@/components/top-ranking-carousel';
import TopCharactersCard from '@/components/top-characters-card';
import TopPeopleCard from '@/components/top-people-card';
import LatestPostsCard from '@/components/latest-posts-card';

export default function Home() {
  const mediaTypes: MediaType[] = ['Anime', 'Manga', 'Manhua', 'Manwha', 'Novela', 'Fan Comic', 'Dougua'];
  const topCharacters = getTopCharacters(5);
  const topPeople = getTopPeople(5);

  const latestPosts = [
    { id: 'post1', title: '¿Qué tan fiel es la adaptación de Honzuki no Gekokujou?', author: 'MangaReader', replies: 45 },
    { id: 'post2', title: 'Mejor momento del último capítulo de The Boxer', author: 'AnimeWatcher', replies: 102 },
    { id: 'post3', title: 'Teorías sobre el final de Berserk', author: 'GutsFan', replies: 234 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 lg:gap-8 my-8">
      <aside className="hidden lg:block lg:col-span-1 space-y-8">
        <TopCharactersCard characters={topCharacters} />
        <TopPeopleCard people={topPeople} />
        <LatestPostsCard posts={latestPosts} />
      </aside>

      <div className="lg:col-span-3 space-y-12">
        {mediaTypes.map(type => {
          const { topAllTime } = getMediaListPage(type);
          
          // Handle multi-word types for path
          const path = `/${type.toLowerCase().replace(' ', '-')}`;

          return (
            <TopRankingCarousel
              key={type}
              title={`${type} - Top Ranking`}
              items={topAllTime}
              viewMoreLink={path}
            />
          );
        })}
      </div>
    </div>
  );
}
