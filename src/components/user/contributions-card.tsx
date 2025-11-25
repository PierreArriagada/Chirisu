/**
 * @fileoverview ContributionsCard - Tarjeta que muestra las contribuciones del usuario
 * 
 * Muestra las contribuciones aprobadas del usuario con badges indicando:
 * - FULL: Contribución completa (anime/manga/novela completo)
 * - MOD: Modificación de datos existentes
 * - REPORT: Reporte aprobado
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Edit, Flag, Star } from "lucide-react";

interface Contribution {
  id: string;
  contributionType: 'full' | 'modification' | 'report';
  mediaType: 'anime' | 'manga' | 'novel';
  mediaTitle: string;
  awardedPoints: number;
  approvedAt: string;
}

interface ContributionsCardProps {
  contributions: Contribution[];
}

export default function ContributionsCard({ contributions }: ContributionsCardProps) {
  if (!contributions || contributions.length === 0) {
    return null; // No mostrar la card si no hay contribuciones
  }

  const getContributionIcon = (type: string) => {
    switch (type) {
      case 'full':
        return <Award className="h-4 w-4" />;
      case 'modification':
        return <Edit className="h-4 w-4" />;
      case 'report':
        return <Flag className="h-4 w-4" />;
      default:
        return <Star className="h-4 w-4" />;
    }
  };

  const getContributionLabel = (type: string) => {
    switch (type) {
      case 'full':
        return 'FULL';
      case 'modification':
        return 'MOD';
      case 'report':
        return 'REPORT';
      default:
        return 'CONTRIB';
    }
  };

  const getContributionVariant = (type: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (type) {
      case 'full':
        return 'default'; // Azul/primario
      case 'modification':
        return 'secondary'; // Gris
      case 'report':
        return 'outline'; // Borde
      default:
        return 'outline';
    }
  };

  const getMediaTypeLabel = (type: string) => {
    switch (type) {
      case 'anime':
        return 'Anime';
      case 'manga':
        return 'Manga';
      case 'novel':
        return 'Novela';
      default:
        return type;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <Award className="h-5 w-5 text-primary" />
          Contribuciones
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {contributions.map((contribution) => (
            <div
              key={contribution.id}
              className="flex items-start justify-between gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={getContributionVariant(contribution.contributionType)} className="font-mono text-xs">
                    <span className="flex items-center gap-1">
                      {getContributionIcon(contribution.contributionType)}
                      {getContributionLabel(contribution.contributionType)}
                    </span>
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {getMediaTypeLabel(contribution.mediaType)}
                  </Badge>
                </div>
                <p className="text-sm font-medium truncate">
                  {contribution.mediaTitle}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-xs text-muted-foreground">
                    {formatDate(contribution.approvedAt)}
                  </p>
                  {contribution.awardedPoints > 0 && (
                    <p className="text-xs text-primary font-medium flex items-center gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      +{contribution.awardedPoints} pts
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {contributions.length >= 20 && (
          <p className="text-xs text-muted-foreground text-center mt-4">
            Mostrando las 20 contribuciones más recientes
          </p>
        )}
      </CardContent>
    </Card>
  );
}
