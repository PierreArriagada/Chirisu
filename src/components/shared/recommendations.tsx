/**
 * @fileoverview Sección de recomendaciones generadas por IA.
 * 
 * Este componente obtiene una lista de títulos similares al que se está viendo.
 * - Renderiza las recomendaciones recibidas utilizando `RecommendationCard`.
 * - Incluye un manejo de errores para mostrar una alerta si la llamada falla.
 * Se muestra en una columna lateral en la página de detalles de un medio.
 */

'use client';

import { useEffect, useState } from 'react';
import type { TitleInfo } from '@/lib/types';
import RecommendationCard from './recommendation-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, ServerCog, Loader2 } from 'lucide-react';

interface RecommendationsProps {
  currentMediaId: string;
  currentMediaType: string;
  currentMediaTitle: string;
}

interface Recommendation {
  title: string;
  type: string;
  reason: string;
}

export default function Recommendations({ currentMediaId, currentMediaType, currentMediaTitle }: RecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRecommendations();
  }, [currentMediaId]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      // Por ahora, mostrar mensaje de que las recomendaciones de IA estarán disponibles pronto
      // En el futuro, esto llamará a la API de recomendaciones
      setRecommendations([]);
    } catch (err: any) {
      console.error('Error loading recommendations:', err);
      setError(err.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recomendaciones</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recomendaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              No se pudieron cargar las recomendaciones en este momento.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recomendaciones</CardTitle>
      </CardHeader>
      <CardContent>
        <Alert variant="default" className="bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200">
          <ServerCog className="h-4 w-4" />
          <AlertTitle>Próximamente</AlertTitle>
          <AlertDescription>
            Las recomendaciones impulsadas por IA estarán disponibles pronto.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
