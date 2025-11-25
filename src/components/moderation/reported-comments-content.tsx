'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Flag, Trash2, X, Eye, CheckCircle, Loader2, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { UserAvatar } from '@/components/user';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ReportedComment {
  reportId: number;
  reason: string;
  description?: string;
  status: string;
  reportedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  assignedToUserId?: string;
  assignedToUsername?: string;
  assignedToDisplayName?: string;
  assignedAt?: string;
  comment: {
    id: number;
    content: string;
    isSpoiler: boolean;
    commentableType: string;
    commentableId: number;
    createdAt: string;
    deletedAt?: string | null; // Incluir campo deleted_at
    author: {
      id: number;
      displayName: string;
      username?: string; // Agregado para fallback
      avatarUrl: string;
      level: number;
    };
  };
  reporter: {
    id: number;
    displayName: string;
    username?: string; // Agregado para fallback
    avatarUrl: string;
  };
}

interface ReportedCommentsContentProps {
  status: 'pending' | 'reviewing' | 'resolved' | 'rejected';
  onUpdate?: () => void; // Callback para actualizar contadores
}

export function ReportedCommentsContent({ status, onUpdate }: ReportedCommentsContentProps) {
  const { user } = useAuth();
  const [reports, setReports] = useState<ReportedComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<number | null>(null);
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    reportId: number | null;
    action: 'delete' | 'dismiss' | null;
  }>({ open: false, reportId: null, action: null });
  const [resolutionNotes, setResolutionNotes] = useState('');
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
      // Incluir currentUserId e isAdmin para lógica de visibilidad
      const response = await fetch(
        `/api/admin/reported-comments?status=${status}&currentUserId=${user?.id}&isAdmin=${user?.isAdmin}`
      );
      const data = await response.json();

      if (response.ok) {
        setReports(data.reports);
      } else {
        throw new Error(data.error || 'Error al cargar reportes');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTakeCase = async (reportId: number) => {
    if (!user) return;

    setAssigningId(reportId);
    try {
      const response = await fetch(`/api/comment-reports/${reportId}/assign`, {
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
        onUpdate?.(); // Actualizar contadores
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
      const response = await fetch(`/api/comment-reports/${reportId}/assign`, {
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
        onUpdate?.(); // Actualizar contadores
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

  const handleAction = async (reportId: number, newStatus: 'resolved' | 'rejected', deleteComment: boolean = false) => {
    // Validar notas de resolución
    if (!resolutionNotes || resolutionNotes.trim().length < 10) {
      toast({
        title: 'Error',
        description: 'Debes explicar la razón de tu decisión (mínimo 10 caracteres)',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/admin/reported-comments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId,
          status: newStatus,
          action: deleteComment ? 'comment_deleted' : 'no_action',
          resolutionNotes: resolutionNotes.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar acción');
      }

      toast({
        title: 'Éxito',
        description: data.message,
      });

      // Limpiar y recargar
      setResolutionNotes('');
      loadReports();
      onUpdate?.(); // Actualizar contadores
      setActionDialog({ open: false, reportId: null, action: null });

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getCommentableLabel = (type: string) => {
    const labels: Record<string, string> = {
      anime: 'Anime',
      manga: 'Manga',
      novels: 'Novela',
      donghua: 'Donghua',
      manhua: 'Manhua',
      manhwa: 'Manhwa',
      fan_comic: 'Fan Comic',
      character: 'Personaje',
      voice_actor: 'Actor de Voz',
      staff: 'Staff',
    };
    return labels[type] || type;
  };

  if (loading) {
    return <div className="text-center py-8">Cargando reportes...</div>;
  }

  if (reports.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
            No hay reportes {status === 'pending' ? 'pendientes' : status === 'resolved' ? 'resueltos' : 'descartados'}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {reports.map((report) => (
          <Card key={report.reportId} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Flag className="h-5 w-5 text-destructive mt-1" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Reporte #{report.reportId}</span>
                      <Badge variant="outline">
                        {getCommentableLabel(report.comment.commentableType)}
                      </Badge>
                      {report.comment.isSpoiler && (
                        <Badge variant="destructive">Spoiler</Badge>
                      )}
                      {report.comment.deletedAt && (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          Comentario eliminado
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Reportado {formatDistanceToNow(new Date(report.reportedAt), { addSuffix: true, locale: es })}
                    </p>
                    {report.resolvedAt && report.resolvedBy && (
                      <p className="text-sm text-muted-foreground">
                        Resuelto por {report.resolvedBy} {formatDistanceToNow(new Date(report.resolvedAt), { addSuffix: true, locale: es })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Razón del reporte */}
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm font-semibold mb-1">Razón del reporte:</p>
                <p className="text-sm">{report.reason}</p>
                <div className="flex items-center gap-2 mt-2">
                  <UserAvatar
                    avatarUrl={report.reporter.avatarUrl}
                    displayName={report.reporter.displayName}
                    username={report.reporter.username}
                    size={20}
                  />
                  <span className="text-xs text-muted-foreground">
                    por {report.reporter.displayName}
                  </span>
                </div>
              </div>

              {/* Comentario reportado */}
              <div className="border rounded-md p-3">
                <div className="flex items-center gap-2 mb-2">
                  <UserAvatar
                    avatarUrl={report.comment.author.avatarUrl}
                    displayName={report.comment.author.displayName}
                    username={report.comment.author.username}
                    size={32}
                  />
                  <div>
                    <p className="font-semibold text-sm">{report.comment.author.displayName}</p>
                    <p className="text-xs text-muted-foreground">
                      Nv.{report.comment.author.level} · {formatDistanceToNow(new Date(report.comment.createdAt), { addSuffix: true, locale: es })}
                    </p>
                  </div>
                </div>
                <p className="text-sm whitespace-pre-wrap">{report.comment.content}</p>
              </div>

              {/* Badge de asignación */}
              {report.assignedToUserId && (
                <div className="flex items-center gap-2">
                  {report.assignedToUserId === user?.id?.toString() ? (
                    <Badge variant="secondary" className="gap-1">
                      <Lock className="h-3 w-3" />
                      Tu caso
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1 bg-blue-50 text-blue-700 border-blue-200">
                      <Lock className="h-3 w-3" />
                      Asignado a: {report.assignedToDisplayName || report.assignedToUsername}
                    </Badge>
                  )}
                  {report.assignedAt && (
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(report.assignedAt), { addSuffix: true, locale: es })}
                    </span>
                  )}
                </div>
              )}

              {/* Acciones */}
              {(status === 'pending' || status === 'reviewing') && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {/* Botones de asignación */}
                  {!report.assignedToUserId && (
                    <Button
                      variant="outline"
                      size="sm"
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
                        variant="outline"
                        size="sm"
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
                        variant="destructive"
                        size="sm"
                        onClick={() => setActionDialog({ open: true, reportId: report.reportId, action: 'delete' })}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar comentario
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActionDialog({ open: true, reportId: report.reportId, action: 'dismiss' })}
                      >
                        <X className="h-4 w-4 mr-2" />
                          Descartar reporte
                      </Button>
                    </>
                  )}

                  {/* Botón ver contexto siempre visible */}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => window.open(`/${report.comment.commentableType}/${report.comment.commentableId}`, '_blank')}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver contexto
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Diálogo de confirmación con campo de notas obligatorio */}
      <AlertDialog 
        open={actionDialog.open} 
        onOpenChange={(open) => {
          if (!open) {
            setActionDialog({ open: false, reportId: null, action: null });
            setResolutionNotes('');
          }
        }}
      >
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionDialog.action === 'delete' ? '¿Eliminar comentario?' : '¿Rechazar reporte?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionDialog.action === 'delete'
                ? 'El comentario será eliminado permanentemente y se notificará al autor. El reporte se marcará como resuelto.'
                : 'El reporte se marcará como rechazado (sin violación) y se notificará al reportante. El comentario permanecerá visible.'}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Campo obligatorio de notas de resolución */}
          <div className="space-y-2 py-4">
            <label className="text-sm font-semibold">
              Explicación de tu decisión <span className="text-red-500">*</span>
            </label>
            <Textarea
              placeholder={
                actionDialog.action === 'delete'
                  ? 'Ejemplo: "El comentario contiene lenguaje ofensivo que viola nuestras normas de comunidad..."'
                  : 'Ejemplo: "El comentario es una opinión personal válida y no viola ninguna norma..."'
              }
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              rows={4}
              maxLength={500}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {resolutionNotes.length}/500 caracteres (mínimo 10)
              {resolutionNotes.length < 10 && (
                <span className="text-red-500 ml-2">
                  Faltan {10 - resolutionNotes.length} caracteres
                </span>
              )}
            </p>
            <p className="text-xs text-muted-foreground italic">
              Esta explicación se enviará al {actionDialog.action === 'delete' ? 'autor del comentario' : 'usuario que reportó'}.
            </p>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setResolutionNotes('')}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={resolutionNotes.trim().length < 10}
              onClick={() => {
                if (actionDialog.reportId) {
                  handleAction(
                    actionDialog.reportId,
                    actionDialog.action === 'delete' ? 'resolved' : 'rejected',
                    actionDialog.action === 'delete'
                  );
                }
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
