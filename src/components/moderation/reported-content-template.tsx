'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Clock, AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface Report {
  id: string;
  reporterUsername: string;
  reportableType: string;
  reportableId: string;
  description: string;
  status: string;
  createdAt: string;
  assignedToUserId?: string;
  assignedToUsername?: string;
  assignedToDisplayName?: string;
}

const STATUS_CONFIG = {
  pending: { label: 'Pendientes', icon: Clock, color: 'bg-yellow-500/10 text-yellow-600' },
  in_review: { label: 'En revisión', icon: AlertCircle, color: 'bg-blue-500/10 text-blue-600' },
  resolved: { label: 'Resueltos', icon: CheckCircle, color: 'bg-green-500/10 text-green-600' },
  dismissed: { label: 'Desestimados', icon: XCircle, color: 'bg-red-500/10 text-red-600' },
};

interface Props {
  status: string;
  contentType: string;
}

export function ReportedContentTemplate({ status, contentType }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (!user.isAdmin && !user.isModerator) {
      router.push('/');
      return;
    }

    loadReports();
    
    // Auto-refresh cada 30 segundos
    const interval = setInterval(loadReports, 30000);
    
    return () => clearInterval(interval);
  }, [user, router, status, contentType]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/content-reports?status=${status}&type=${contentType}&currentUserId=${user?.id}&isAdmin=${user?.isAdmin}`,
        { credentials: 'include' }
      );

      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTakeCase = async (reportId: string) => {
    if (!user) return;

    setAssigningId(reportId);
    try {
      const response = await fetch(`/api/content-reports/${reportId}/assign`, {
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
        if (response.status === 409) {
          toast({
            variant: 'destructive',
            title: 'Caso ocupado',
            description: `Ya está siendo manejado por ${data.assignedTo?.display_name || data.assignedTo?.username}`,
          });
        } else {
          throw new Error(data.error || 'Error al asignar caso');
        }
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo asignar el caso',
      });
    } finally {
      setAssigningId(null);
    }
  };

  const handleReleaseCase = async (reportId: string) => {
    if (!user) return;

    setAssigningId(reportId);
    try {
      const response = await fetch(`/api/content-reports/${reportId}/assign`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast({
          title: 'Caso liberado',
          description: 'El caso está nuevamente disponible',
        });
        loadReports();
      } else {
        throw new Error('Error al liberar caso');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo liberar el caso',
      });
    } finally {
      setAssigningId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            No hay reportes {STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.label.toLowerCase()}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {reports.map((report) => {
        const StatusIcon = STATUS_CONFIG[report.status as keyof typeof STATUS_CONFIG]?.icon || Clock;
        const isAssigned = Boolean(report.assignedToUserId);
        const isAssignedToMe = report.assignedToUserId === user?.id;
        const canTakeCase = !isAssigned && (report.status === 'pending' || report.status === 'in_review');
        const canReleaseCase = isAssignedToMe;
        
        return (
          <Card key={report.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="mb-2">Reporte #{report.id.substring(0, 8)}</CardTitle>
                  <CardDescription className="flex flex-wrap gap-2 items-center">
                    <Badge className={STATUS_CONFIG[report.status as keyof typeof STATUS_CONFIG]?.color}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {STATUS_CONFIG[report.status as keyof typeof STATUS_CONFIG]?.label}
                    </Badge>
                    {isAssigned && (
                      <Badge variant={isAssignedToMe ? "default" : "secondary"}>
                        {isAssignedToMe ? '🔒 Tu caso' : `🔒 ${report.assignedToDisplayName || report.assignedToUsername}`}
                      </Badge>
                    )}
                    <span className="text-sm">
                      por @{report.reporterUsername}
                    </span>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                {report.description}
              </p>
              <div className="flex gap-2 flex-wrap">
                {canTakeCase && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleTakeCase(report.id)}
                    disabled={assigningId === report.id}
                  >
                    {assigningId === report.id ? 'Asignando...' : '🎯 Tomar Caso'}
                  </Button>
                )}
                {canReleaseCase && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReleaseCase(report.id)}
                    disabled={assigningId === report.id}
                  >
                    {assigningId === report.id ? 'Liberando...' : 'Liberar Caso'}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/${contentType}/${report.reportableId}`)}
                >
                  Ver Contenido
                </Button>
                <Button
                  size="sm"
                  onClick={() => router.push(`/dashboard/admin/reports/${report.id}`)}
                >
                  Administrar
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
