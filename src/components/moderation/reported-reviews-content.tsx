'use client';

/**
 * @fileoverview ReportedReviewsContent - Muestra reviews reportadas para moderación
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertCircle, 
  CheckCircle, 
  X, 
  Trash2, 
  Eye,
  Star,
  Calendar,
  User,
  FileText,
  Lock,
  Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ReportedReview {
  reportId: number;
  reason: string;
  description: string;
  status: string;
  reportedAt: string;
  resolvedAt: string | null;
  resolutionNote: string | null;
  assignedToUserId?: string;
  assignedToUsername?: string;
  assignedToDisplayName?: string;
  assignedAt?: string;
  review: {
    id: number;
    rating: number;
    content: string;
    createdAt: string;
    likesCount: number;
    reviewableType: string;
    reviewableId: number;
    author: {
      id: number;
      username: string;
      displayName: string;
      avatarUrl: string | null;
    };
    media: {
      title: string;
      slug: string;
      type: string;
    };
  };
  reporter: {
    id: number;
    username: string;
    displayName: string;
  };
  moderator: {
    username: string;
    displayName: string;
  } | null;
}

interface ReportedReviewsContentProps {
  status: 'pending' | 'reviewing' | 'resolved' | 'rejected' | 'dismissed';
}

export function ReportedReviewsContent({ status }: ReportedReviewsContentProps) {
  const { user } = useAuth();
  const [reports, setReports] = useState<ReportedReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [assigningId, setAssigningId] = useState<number | null>(null);
  const [selectedReport, setSelectedReport] = useState<ReportedReview | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [actionType, setActionType] = useState<'resolve' | 'dismiss' | 'delete_review' | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadReports();
    // Auto-refresh cada 30 segundos
    const interval = setInterval(loadReports, 30000);
    return () => clearInterval(interval);
  }, [status]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/moderation/reported-reviews?status=${status}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Error al cargar reportes');
      }

      const data = await response.json();
      setReports(data.reports);
    } catch (error) {
      console.error('Error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar los reportes',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTakeCase = async (reportId: number) => {
    if (!user) return;

    setAssigningId(reportId);
    try {
      const response = await fetch(`/api/review-reports/${reportId}/assign`, {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: '¡Caso asignado!',
          description: 'Este caso ahora está asignado a ti',
        });
        loadReports();
      } else {
        throw new Error(data.error || 'Error al asignar caso');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setAssigningId(null);
    }
  };

  const handleReleaseCase = async (reportId: number) => {
    if (!user) return;

    setAssigningId(reportId);
    try {
      const response = await fetch(`/api/review-reports/${reportId}/assign`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Caso liberado',
          description: 'El caso está disponible para otros moderadores',
        });
        loadReports();
      } else {
        throw new Error(data.error || 'Error al liberar caso');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setAssigningId(null);
    }
  };

  const handleAction = async () => {
    if (!selectedReport || !actionType) return;

    setActionLoading(selectedReport.reportId);

    try {
      const response = await fetch('/api/moderation/reported-reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          reportId: selectedReport.reportId,
          action: actionType,
          resolutionNote,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al procesar acción');
      }

      toast({
        title: 'Acción completada',
        description: 'El reporte ha sido actualizado correctamente',
      });

      // Cerrar diálogo y recargar
      setSelectedReport(null);
      setResolutionNote('');
      setActionType(null);
      loadReports();

    } catch (error) {
      console.error('Error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo completar la acción',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const openActionDialog = (report: ReportedReview, action: 'resolve' | 'dismiss' | 'delete_review') => {
    setSelectedReport(report);
    setActionType(action);
    setResolutionNote('');
  };

  const getReasonLabel = (reason: string) => {
    const reasons: Record<string, string> = {
      spam: 'Spam',
      offensive: 'Contenido Ofensivo',
      spoiler: 'Spoiler sin marcar',
      irrelevant: 'Irrelevante',
      harassment: 'Acoso',
      misinformation: 'Información Falsa',
      other: 'Otro',
    };
    return reasons[reason] || reason;
  };

  const getReasonColor = (reason: string) => {
    const colors: Record<string, 'destructive' | 'secondary' | 'default' | 'outline'> = {
      spam: 'destructive',
      offensive: 'destructive',
      harassment: 'destructive',
      spoiler: 'secondary',
      irrelevant: 'outline',
      misinformation: 'secondary',
      other: 'default',
    };
    return colors[reason] || 'default';
  };

  if (loading) {
    return <div className="text-center py-8">Cargando reportes...</div>;
  }

  if (reports.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No hay reviews reportadas con estado "{status}"
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {reports.map((report) => (
          <Card key={report.reportId}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  {/* Título: Review de [Media] */}
                  <CardTitle className="text-base">
                    Review de{' '}
                    <Link 
                      href={`/${report.review.media.type}/${report.review.media.slug}`}
                      className="text-primary hover:underline"
                    >
                      {report.review.media.title || 'Sin título'}
                    </Link>
                  </CardTitle>
                  
                  {/* Información del reporte */}
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={getReasonColor(report.reason)}>
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {getReasonLabel(report.reason)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Reportado {formatDistanceToNow(new Date(report.reportedAt), { addSuffix: true, locale: es })}
                      </span>
                    </div>
                    
                    {/* Quién reportó */}
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>
                        Reportado por: <strong className="text-foreground">@{report.reporter.username || report.reporter.displayName}</strong>
                      </span>
                    </div>
                    
                    {/* Motivo detallado del reporte */}
                    {report.description && (
                      <div className="text-sm">
                        <span className="font-medium">Motivo:</span>
                        <p className="text-muted-foreground mt-1 whitespace-pre-wrap">{report.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Contenido de la review reportada */}
              <div className="border rounded-lg p-4 bg-muted/50">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={report.review.author.avatarUrl || undefined} />
                    <AvatarFallback>{(report.review.author.displayName || report.review.author.username || 'U')[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{report.review.author.displayName || report.review.author.username || 'Usuario'}</span>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < report.review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(report.review.createdAt), { addSuffix: true, locale: es })}
                    </p>
                  </div>
                </div>
                <p className="text-sm whitespace-pre-wrap">{report.review.content}</p>
              </div>

              {/* Información de resolución (si aplica) */}
              {report.moderator && report.resolutionNote && (
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-start gap-2 text-sm">
                    <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="font-semibold">Resolución:</p>
                      <p className="text-muted-foreground">{report.resolutionNote}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Por {report.moderator.displayName || 'Moderador'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Badge de asignación */}
              {report.assignedToUserId && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <Lock className="h-3 w-3" />
                    {report.assignedToUserId === user?.id?.toString()
                      ? '🔒 Tu caso'
                      : `🔒 ${report.assignedToDisplayName || report.assignedToUsername}`}
                  </Badge>
                  {report.assignedAt && (
                    <span className="text-xs text-muted-foreground">
                      asignado {formatDistanceToNow(new Date(report.assignedAt), { addSuffix: true, locale: es })}
                    </span>
                  )}
                </div>
              )}
            </CardContent>

            {/* Acciones */}
            {(status === 'pending' || status === 'reviewing') && (
              <CardFooter className="flex gap-2 flex-wrap">
                {/* Botones de asignación */}
                {!report.assignedToUserId && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTakeCase(report.reportId)}
                    disabled={assigningId === report.reportId}
                  >
                    {assigningId === report.reportId ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Lock className="h-4 w-4 mr-2" />
                    )}
                    Tomar Caso
                  </Button>
                )}

                {report.assignedToUserId === user?.id?.toString() && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReleaseCase(report.reportId)}
                      disabled={assigningId === report.reportId}
                    >
                      {assigningId === report.reportId ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <X className="h-4 w-4 mr-2" />
                      )}
                      Liberar Caso
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openActionDialog(report, 'resolve')}
                      disabled={actionLoading === report.reportId}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Resolver
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openActionDialog(report, 'dismiss')}
                      disabled={actionLoading === report.reportId}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Desestimar
                    </Button>

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => openActionDialog(report, 'delete_review')}
                      disabled={actionLoading === report.reportId}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar Review
                    </Button>
                  </>
                )}

                {/* Botón ver contexto siempre visible */}
                <Button
                  size="sm"
                  variant="ghost"
                  asChild
                >
                  <Link href={`/${report.review.media.type}/${report.review.media.slug}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    Ver en Contexto
                  </Link>
                </Button>
              </CardFooter>
            )}
          </Card>
        ))}
      </div>

      {/* Diálogo de confirmación */}
      <Dialog open={!!selectedReport} onOpenChange={() => {
        setSelectedReport(null);
        setResolutionNote('');
        setActionType(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'delete_review' && 'Eliminar Review'}
              {actionType === 'resolve' && 'Resolver Reporte'}
              {actionType === 'dismiss' && 'Desestimar Reporte'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'delete_review' && 'La review será eliminada permanentemente y el reporte marcado como resuelto.'}
              {actionType === 'resolve' && 'El reporte será marcado como resuelto. La review permanecerá visible.'}
              {actionType === 'dismiss' && 'El reporte será desestimado. La review permanecerá visible.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="note">Nota de resolución</Label>
              <Textarea
                id="note"
                placeholder="Agrega una nota explicando la decisión..."
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedReport(null);
                setResolutionNote('');
                setActionType(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant={actionType === 'delete_review' ? 'destructive' : 'default'}
              onClick={handleAction}
              disabled={!!actionLoading}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
