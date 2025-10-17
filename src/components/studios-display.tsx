"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { Building2 } from "lucide-react";

interface Studio {
  id: number;
  name: string;
  is_main_studio: boolean;
}

interface StudiosDisplayProps {
  animeId: number;
}

export default function StudiosDisplay({ animeId }: StudiosDisplayProps) {
  const [studios, setStudios] = useState<Studio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStudios() {
      try {
        setLoading(true);
        const response = await fetch(`/api/anime/${animeId}/studios`);
        
        if (!response.ok) {
          throw new Error('Error al cargar estudios');
        }

        const result = await response.json();
        
        if (result.success) {
          setStudios(result.data);
        } else {
          throw new Error(result.error || 'Error desconocido');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar estudios');
        console.error('Error fetching studios:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchStudios();
  }, [animeId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Estudios
          </CardTitle>
          <CardDescription>Cargando información de estudios...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Estudios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (studios.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No hay estudios registrados aún.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {studios.map((studio) => (
        <div 
          key={studio.id}
          className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
        >
          <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded border bg-muted flex items-center justify-center">
            <Building2 className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-base">{studio.name}</h4>
          </div>
          {studio.is_main_studio && (
            <Badge variant="default" className="text-xs flex-shrink-0">
              Principal
            </Badge>
          )}
        </div>
      ))}
    </div>
  );
}
