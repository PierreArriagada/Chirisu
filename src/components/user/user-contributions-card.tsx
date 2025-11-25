/**
 * ========================================
 * COMPONENTE: MIS CONTRIBUCIONES
 * ========================================
 * Muestra todas las contribuciones del usuario con sus estados
 * - Pendiente (amarillo)
 * - Aprobada (verde)
 * - Rechazada (rojo) con motivo
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, XCircle, Award, Edit, Flag, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Contribution {
  id: string;
  contributionType: 'full' | 'modification' | 'report';
  mediaType: 'anime' | 'manga' | 'novel';
  mediaTitle?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  awardedPoints?: number;
  contributionData?: any;
}

interface UserContributionsCardProps {
  contributions: Contribution[];
}

export default function UserContributionsCard({ contributions }: UserContributionsCardProps) {
  if (!contributions || contributions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline">
            <Award className="h-5 w-5 text-primary" />
            Mis Contribuciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Award className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>Aún no has enviado ninguna contribución</p>
            <Link href="/contribution-center">
              <Button variant="outline" size="sm" className="mt-4">
                Contribuir Ahora
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'approved':
        return 'Aprobada';
      case 'rejected':
        return 'Rechazada';
      default:
        return status;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" => {
    switch (status) {
      case 'pending':
        return 'secondary'; // Amarillo/gris
      case 'approved':
        return 'default'; // Verde/azul
      case 'rejected':
        return 'destructive'; // Rojo
      default:
        return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'approved':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'rejected':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      default:
        return 'bg-muted';
    }
  };

  const getContributionIcon = (type: string) => {
    switch (type) {
      case 'full':
        return <Award className="h-4 w-4" />;
      case 'modification':
        return <Edit className="h-4 w-4" />;
      case 'report':
        return <Flag className="h-4 w-4" />;
      default:
        return <Award className="h-4 w-4" />;
    }
  };

  const getContributionLabel = (type: string) => {
    switch (type) {
      case 'full':
        return 'Completo';
      case 'modification':
        return 'Modificación';
      case 'report':
        return 'Reporte';
      default:
        return type;
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

  const getTitleFromContribution = (contribution: Contribution) => {
    if (contribution.mediaTitle) {
      return contribution.mediaTitle;
    }
    if (contribution.contributionData) {
      return contribution.contributionData.title_romaji || 
             contribution.contributionData.title_english || 
             'Sin título';
    }
    return 'Sin título';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Ordenar por fecha de creación (más reciente primero)
  const sortedContributions = [...contributions].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 font-headline">
            <Award className="h-5 w-5 text-primary" />
            Mis Contribuciones
          </CardTitle>
          <Badge variant="outline" className="font-normal">
            {contributions.length} Total
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedContributions.map((contribution) => (
            <div
              key={contribution.id}
              className={`flex flex-col gap-3 p-4 rounded-lg border transition-all ${
                contribution.status === 'pending' ? 'border-yellow-500/30 bg-yellow-500/5' :
                contribution.status === 'approved' ? 'border-green-500/30 bg-green-500/5' :
                'border-red-500/30 bg-red-500/5'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Badges superiores */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge className={`${getStatusColor(contribution.status)} font-medium`}>
                      <span className="flex items-center gap-1.5">
                        {getStatusIcon(contribution.status)}
                        {getStatusLabel(contribution.status)}
                      </span>
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {getContributionIcon(contribution.contributionType)}
                      <span className="ml-1">{getContributionLabel(contribution.contributionType)}</span>
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {getMediaTypeLabel(contribution.mediaType)}
                    </Badge>
                  </div>

                  {/* Título */}
                  <p className="text-sm font-semibold mb-1">
                    {getTitleFromContribution(contribution)}
                  </p>

                  {/* Fecha */}
                  <p className="text-xs text-muted-foreground">
                    Enviado: {formatDate(contribution.createdAt)}
                  </p>

                  {/* Puntos si está aprobada */}
                  {contribution.status === 'approved' && contribution.awardedPoints && contribution.awardedPoints > 0 && (
                    <p className="text-xs text-green-600 font-medium mt-1">
                      ✨ +{contribution.awardedPoints} puntos otorgados
                    </p>
                  )}

                  {/* Fecha de revisión si está aprobada o rechazada */}
                  {contribution.reviewedAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Revisado: {formatDate(contribution.reviewedAt)}
                    </p>
                  )}

                  {/* Motivo de rechazo si está rechazada */}
                  {contribution.status === 'rejected' && contribution.rejectionReason && (
                    <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                      <p className="text-xs font-medium text-red-600 mb-1">Motivo del rechazo:</p>
                      <p className="text-xs text-red-800 dark:text-red-300">
                        {contribution.rejectionReason}
                      </p>
                    </div>
                  )}

                  {/* Mensaje para pendientes */}
                  {contribution.status === 'pending' && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-2">
                      ⏳ Tu contribución está siendo revisada por un moderador
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {contributions.length >= 20 && (
          <p className="text-xs text-muted-foreground text-center mt-4 pt-4 border-t">
            Mostrando las 20 contribuciones más recientes
          </p>
        )}

        {/* Botón para contribuir más */}
        <div className="mt-4 pt-4 border-t">
          <Link href="/contribution-center">
            <Button variant="outline" className="w-full" size="sm">
              <Award className="h-4 w-4 mr-2" />
              Hacer una nueva contribución
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
