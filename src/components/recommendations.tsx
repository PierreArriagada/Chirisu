/**
 * @fileoverview Sección de recomendaciones generadas por IA.
 * 
 * Este componente es un Server Component que invoca una Genkit Flow (`recommendSimilarTitles`)
 * para obtener una lista de títulos similares al que se está viendo.
 * - Pasa el título, tipo y descripción del medio actual a la IA.
 * - Renderiza las recomendaciones recibidas utilizando `RecommendationCard`.
 * - Incluye un manejo de errores para mostrar una alerta si la llamada a la IA falla.
 * Se muestra en una columna lateral en la página de detalles de un medio.
 */

import { recommendSimilarTitles } from '@/ai/flows/recommend-similar-titles';
import type { TitleInfo } from '@/lib/types';
import RecommendationCard from './recommendation-card';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Terminal, ServerCog } from 'lucide-react';

export default async function Recommendations({ titleInfo }: { titleInfo: TitleInfo }) {
  let recommendations = [];
  try {
    recommendations = await recommendSimilarTitles({
      title: titleInfo.title,
      type: titleInfo.type === 'Anime' ? 'anime' : titleInfo.type === 'Manga' ? 'manga' : 'novel',
      description: titleInfo.description,
    });
  } catch (error: any) {
    console.error("Failed to fetch recommendations:", error);

    if (error.message && error.message.includes('503 Service Unavailable')) {
      return (
        <Alert variant="default" className="bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-200 [&>svg]:text-amber-600 dark:[&>svg]:text-amber-400">
            <ServerCog className="h-4 w-4" />
            <AlertTitle>Servicio Ocupado</AlertTitle>
            <AlertDescription>
                El motor de recomendaciones está sobrecargado. Por favor, inténtalo de nuevo más tarde.
            </AlertDescription>
        </Alert>
      );
    }
    
    return (
        <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
                No se pudieron cargar las recomendaciones en este momento.
            </AlertDescription>
        </Alert>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-muted-foreground text-center">No recommendations available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col gap-4">
          {recommendations.slice(0, 5).map((rec, index) => (
            <RecommendationCard key={rec.title} recommendation={rec} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
