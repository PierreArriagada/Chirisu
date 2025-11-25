/**
 * @fileoverview Página de la categoría "Anime".
 * 
 * Esta página actúa como el hub principal para todo el contenido de anime.
 * Muestra diferentes secciones de rankings y recomendaciones con datos reales de la API.
 */

import { AnimePageClient, RecommendationsCard } from "@/components/media";
import { AllMediaCatalog } from '@/components/catalog';
import { LatestPostsCard, Recommendations } from "@/components/shared";
import { TopCharactersCard } from "@/components/rankings";

async function getTopCharacters() {
  try {
    // En SSR, usar URL completa con el puerto correcto
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || `http://localhost:${process.env.PORT || 9002}`;
    const res = await fetch(`${baseUrl}/api/characters?top=true&limit=5`, {
      next: { revalidate: 3600 }, // Cache por 1 hora
      cache: 'no-store' // Temporal para development
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.characters || [];
  } catch (error) {
    console.error('Error al obtener top characters:', error);
    return [];
  }
}

async function getRecommendations() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || `http://localhost:${process.env.PORT || 9002}`;
    const res = await fetch(`${baseUrl}/api/rankings?type=anime&period=all_time&limit=4`, {
      next: { revalidate: 3600 },
      cache: 'no-store'
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.rankings || [];
  } catch (error) {
    console.error('Error al obtener recommendations:', error);
    return [];
  }
}

export default async function AnimePage() {
  const [topCharacters, recommendations] = await Promise.all([
    getTopCharacters(),
    getRecommendations()
  ]);

  // Datos mock para posts hasta implementar el API de foro
  const latestPosts = [
    { id: 'post1', title: '¿Qué tan fiel es la adaptación de Jujutsu Kaisen?', author: 'AnimeReviewer', replies: 45 },
    { id: 'post2', title: 'Mejores peleas del arco de Shibuya', author: 'JJKFan', replies: 102 },
    { id: 'post3', title: 'Teorías sobre la temporada 3', author: 'SatoruGojo', replies: 234 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 lg:gap-8 my-8">
      <div className="lg:col-span-3">
        <AnimePageClient mediaType="Anime" />
        
        {/* Nueva sección: Catálogo completo de anime */}
        <AllMediaCatalog mediaType="anime" title="Todos los Anime" />
      </div>
      <aside className="hidden lg:block lg:col-span-1 space-y-8">
        {recommendations.length > 0 ? (
          <RecommendationsCard items={recommendations.map((r: any) => ({
            id: r.id,
            slug: r.slug || r.id.toString(),
            title: r.title,
            imageUrl: r.coverImage,
            rating: r.averageScore,
            type: 'Anime'
          }))} />
        ) : (
          <div className="p-4 bg-muted rounded-lg text-center text-muted-foreground">
            No hay recomendaciones disponibles
          </div>
        )}
        
        {topCharacters.length > 0 ? (
          <TopCharactersCard characters={topCharacters.map((c: any) => ({
            id: c.id,
            name: c.name,
            imageUrl: c.image,
            slug: c.slug,
            role: 'Main',
            voiceActors: { japanese: { name: '', imageUrl: '', slug: '' }, spanish: { name: '', imageUrl: '', slug: '' } }
          }))} />
        ) : (
          <div className="p-4 bg-muted rounded-lg text-center text-muted-foreground">
            No hay personajes destacados disponibles
          </div>
        )}
        
        <LatestPostsCard posts={latestPosts} />
      </aside>
    </div>
  );
}
