/**
 * @fileoverview Página de inicio de la aplicación.
 * 
 * Esta página es la entrada principal al sitio. Muestra una vista agregada
 * de los rankings más importantes de cada tipo de medio (Anime, Manga, etc.)
 * en un carrusel. En la versión de escritorio, también presenta una barra
 * lateral con rankings de:
 * - Personajes más populares (basado en favoritos)
 * - Usuarios más activos (basado en contribuciones, listas y reviews)
 * - Últimas publicaciones del foro
 */

import { TopCharactersCard, TopActiveUsersCard } from '@/components/rankings';
import { LatestPostsCard } from '@/components/shared';
import { HomePageClient } from '@/components/media';

async function getTopCharacters() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || `http://localhost:${process.env.PORT || 9002}`;
    const res = await fetch(`${baseUrl}/api/characters?top=true&limit=5`, {
      next: { revalidate: 3600 }, // Cache por 1 hora
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.characters || [];
  } catch (error) {
    console.error('Error al obtener top characters:', error);
    return [];
  }
}

async function getTopActiveUsers() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || `http://localhost:${process.env.PORT || 9002}`;
    const res = await fetch(`${baseUrl}/api/users/top-active?limit=5`, {
      next: { revalidate: 3600 }, // Cache por 1 hora
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.users || [];
  } catch (error) {
    console.error('Error al obtener usuarios activos:', error);
    return [];
  }
}

export default async function Home() {
  const [topCharactersData, topActiveUsers] = await Promise.all([
    getTopCharacters(),
    getTopActiveUsers()
  ]);
  
  // Transformar data para que coincida con el formato esperado
  const topCharacters = topCharactersData.map((c: any) => ({
    id: c.id,
    name: c.name,
    imageUrl: c.image,
    slug: c.slug,
    role: 'Main',
    voiceActors: {
      japanese: { name: '', imageUrl: '', slug: '' },
      spanish: { name: '', imageUrl: '', slug: '' }
    }
  }));

  // Mock data para posts hasta implementar APIs
  const latestPosts = [
    { id: 'post1', title: '¿Cuál es tu personaje favorito de Jujutsu Kaisen?', author: 'AnimeReviewer', replies: 89 },
    { id: 'post2', title: 'Reseña: Jujutsu Kaisen 0 Movie', author: 'MovieBuff', replies: 156 },
    { id: 'post3', title: 'Top 10 peleas del arco de Shibuya', author: 'FightAnalyst', replies: 203 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 lg:gap-8 my-8">
      <aside className="hidden lg:block lg:col-span-1 space-y-8">
        {topCharacters.length > 0 ? (
          <TopCharactersCard characters={topCharacters} />
        ) : (
          <div className="p-4 bg-muted rounded-lg text-center text-muted-foreground text-sm">
            No hay personajes destacados disponibles
          </div>
        )}
        
        {topActiveUsers.length > 0 ? (
          <TopActiveUsersCard users={topActiveUsers} />
        ) : (
          <div className="p-4 bg-muted rounded-lg text-center text-muted-foreground text-sm">
            No hay usuarios activos disponibles
          </div>
        )}
        
        <LatestPostsCard posts={latestPosts} />
      </aside>

      <div className="lg:col-span-3">
        <HomePageClient />
      </div>
    </div>
  );
}
