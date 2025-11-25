'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { UserX, Lock, Loader2, X, CheckCircle, Eye, Ban, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ReportedUser {
  id: string;
  reason: string;
  description: string;
  status: string;
  createdAt: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  actionTaken?: string;
  assignedToUserId?: string;
  assignedToUsername?: string;
  assignedToDisplayName?: string;
  assignedAt?: string;
  reportedUser: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    level: number;
  };
  reporter: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
  };
  resolvedBy?: string;
}

interface Props {
  status: 'pending' | 'reviewing' | 'resolved' | 'rejected';
}

const REASON_LABELS: Record<string, string> = {
  spam: 'Spam',
  harassment: 'Acoso',
  inappropriate_content: 'Contenido inapropiado',
  impersonation: 'Suplantación de identidad',
  offensive_username: 'Nombre ofensivo',
  offensive_profile: 'Perfil ofensivo',
  suspicious_activity: 'Actividad sospechosa',
  other: 'Otro',
};

const ACTION_LABELS: Record<string, string> = {
  no_action: 'Sin acción',
  warning_sent: 'Advertencia enviada',
  content_removed: 'Contenido eliminado',
  user_warned: 'Usuario advertido',
  user_suspended: 'Usuario suspendido',
  user_banned: 'Usuario baneado',
};

export function ReportedUsersContent({ status }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reports, setReports] = useState<ReportedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    reportId: string | null;
    actionType: 'resolve' | 'reject' | null;
  }>({ open: false, reportId: null, actionType: null });
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [actionTaken, setActionTaken] = useState('no_action');

  useEffect(() => {
    loadReports();
    const interval = setInterval(loadReports, 30000);
    return () => clearInterval(interval);
  }, [status]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/user-reports?status=${status}`);
      const data = await response.json();

      if (response.ok) {
        setReports(data.reports || []);
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

  const handleTakeCase = async (reportId: string) => {
    if (!user) return;

    setAssigningId(reportId);
    try {
      const response = await fetch(`/api/user-reports/${reportId}/assign`, {
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

  const handleReleaseCase = async (reportId: string) => {
    if (!user) return;

    setAssigningId(reportId);
    try {
      const response = await fetch(`/api/user-reports/${reportId}/assign`, {
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

  const handleResolveReport = async () => {
    if (!actionDialog.reportId || !actionDialog.actionType) return;

    try {
      const response = await fetch('/api/user-reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId: actionDialog.reportId,
          status: actionDialog.actionType === 'resolve' ? 'resolved' : 'rejected',
          actionTaken,
          resolutionNotes,
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

      loadReports();
      setActionDialog({ open: false, reportId: null, actionType: null });
      setResolutionNotes('');
      setActionTaken('no_action');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Cargando reportes...</div>;
  }

  if (reports.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No hay reportes de usuarios {status === 'pending' ? 'pendientes' : status === 'resolved' ? 'resueltos' : 'desestimados'}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {reports.map((report) => (
          <Card key={report.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <UserX className="h-5 w-5 text-destructive mt-1" />
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">Reporte #{report.id}</span>
                      <Badge variant="outline">{REASON_LABELS[report.reason] || report.reason}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Reportado {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true, locale: es })}
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
              {/* Usuario reportado */}
              <div className="border rounded-md p-4 bg-muted/50">
                <p className="text-sm font-semibold mb-2">Usuario reportado:</p>
                <div className="flex items-center gap-3">
                  <UserAvatar
                    avatarUrl={report.reportedUser.avatarUrl}
                    displayName={report.reportedUser.displayName}
                    size={40}
                  />
                  <div>
                    <p className="font-semibold">{report.reportedUser.displayName}</p>
                    <p className="text-sm text-muted-foreground">@{report.reportedUser.username} · Nivel {report.reportedUser.level}</p>
                  </div>
                </div>
              </div>

              {/* Descripción del reporte */}
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm font-semibold mb-1">Razón del reporte:</p>
                <p className="text-sm whitespace-pre-wrap">{report.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <UserAvatar
                    avatarUrl={report.reporter.avatarUrl}
                    displayName={report.reporter.displayName}
                    size={20}
                  />
                  <span className="text-xs text-muted-foreground">
                    por {report.reporter.displayName}
                  </span>
                </div>
              </div>

              {/* Resolución */}
              {report.resolutionNotes && (
                <div className="border-t pt-3">
                  <p className="text-sm font-semibold">Resolución:</p>
                  <p className="text-sm text-muted-foreground">{report.resolutionNotes}</p>
                  {report.actionTaken && (
                    <Badge variant="secondary" className="mt-2">
                      {ACTION_LABELS[report.actionTaken] || report.actionTaken}
                    </Badge>
                  )}
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

              {/* Acciones */}
              {(status === 'pending' || status === 'reviewing') && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {!report.assignedToUserId && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTakeCase(report.id)}
                      disabled={assigningId === report.id}
                    >
                      {assigningId === report.id ? (
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
                        onClick={() => handleReleaseCase(report.id)}
                        disabled={assigningId === report.id}
                      >
                        {assigningId === report.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <X className="h-4 w-4 mr-2" />
                        )}
                        Liberar Caso
                      </Button>

                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => setActionDialog({ open: true, reportId: report.id, actionType: 'resolve' })}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Resolver
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActionDialog({ open: true, reportId: report.id, actionType: 'reject' })}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Desestimar
                      </Button>
                    </>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(`/profile/user/${report.reportedUser.username}`, '_blank')}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver perfil
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Diálogo de resolución */}
      <AlertDialog open={actionDialog.open} onOpenChange={(open) => !open && setActionDialog({ open: false, reportId: null, actionType: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionDialog.actionType === 'resolve' ? 'Resolver reporte' : 'Desestimar reporte'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionDialog.actionType === 'resolve'
                ? 'Indica la acción tomada y agrega notas sobre la resolución'
                : 'El reporte se marcará como desestimado'}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            {actionDialog.actionType === 'resolve' && (
              <div className="space-y-2">
                <Label htmlFor="action">Acción tomada</Label>
                <Select value={actionTaken} onValueChange={setActionTaken}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ACTION_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notas de resolución</Label>
              <Textarea
                id="notes"
                placeholder="Agrega detalles sobre la decisión tomada..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleResolveReport}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
