'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle, Clock, XCircle, AlertTriangle, MessageSquare, Flag, Star } from 'lucide-react';
import Link from 'next/link';

interface Report {
  id: string;
  reporterUsername: string;
  reporterDisplayName?: string;
  reportableType: string;
  reportableId: string;
  issueType: string;
  title: string;
  description: string;
  status: string;
  priority?: string;
  createdAt: string;
  assignedToUserId?: string;
  assignedToUsername?: string;
  assignedToDisplayName?: string;
  assignedAt?: string;
  moderatorNotes?: string;
  type?: 'report' | 'contribution';
}

const STATUS_CONFIG = {
  pending: { label: 'Pendiente', icon: Clock, color: 'bg-yellow-500' },
  in_review: { label: 'En revisión', icon: AlertCircle, color: 'bg-blue-500' },
  resolved: { label: 'Resuelto', icon: CheckCircle, color: 'bg-green-500' },
  dismissed: { label: 'Descartado', icon: XCircle, color: 'bg-red-500' },
  approved: { label: 'Aprobado', icon: CheckCircle, color: 'bg-green-500' },
  rejected: { label: 'Rechazado', icon: XCircle, color: 'bg-red-500' },
  needs_changes: { label: 'Requiere cambios', icon: AlertTriangle, color: 'bg-orange-500' },
};

const PRIORITY_CONFIG = {
  low: { label: 'Baja', color: 'bg-gray-500' },
  normal: { label: 'Normal', color: 'bg-blue-500' },
  high: { label: 'Alta', color: 'bg-orange-500' },
  urgent: { label: 'Urgente', color: 'bg-red-500' },
};

const TYPE_LABELS: Record<string, string> = {
  anime: 'Anime',
  manga: 'Manga',
  novel: 'Novela',
  novels: 'Novela',
  donghua: 'Donghua',
  manhua: 'Manhua',
  manhwa: 'Manhwa',
  fan_comic: 'Fan Comic',
};

export default function AdminReportsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('pending');
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [tabCounts, setTabCounts] = useState({
    pending: 0,
    in_review: 0,
    resolved: 0,
    dismissed: 0,
    approved: 0,
    rejected: 0,
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (!user.isAdmin && !user.isModerator) {
      router.push('/');
      return;
    }

    loadReports(activeTab);
    loadAllCounts();
    
    // Auto-refresh cada 30 segundos
    const interval = setInterval(() => {
      loadReports(activeTab);
      loadAllCounts();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [user, router, activeTab]);

  const loadReports = async (status: string) => {
    setLoading(true);
    try {
      if (!user) return;

      const isAdmin = user.isAdmin || false;
      
      // Cargar reportes de contenido
      const reportsResponse = await fetch(
        `/api/content-reports?status=${status}&limit=50&currentUserId=${user.id}&isAdmin=${isAdmin}`,
        { credentials: 'include' }
      );

      // Cargar contribuciones de nuevo contenido
      const newContentResponse = await fetch(`/api/moderation/contributions?status=${status}`);
      
      // Cargar contribuciones de ediciones
      const editsResponse = await fetch(
        `/api/content-contributions?status=${status}&currentUserId=${user.id}&isAdmin=${isAdmin}`
      );

      const allReports: Report[] = [];

      // Procesar reportes normales
      if (reportsResponse.ok) {
        const reportsData = await reportsResponse.json();
        const formattedReports = (reportsData.reports || []).map((report: any) => ({
          ...report,
          type: 'report',
        }));
        allReports.push(...formattedReports);
      }

      // Procesar contribuciones de nuevo contenido
      if (newContentResponse.ok) {
        const newContentData = await newContentResponse.json();
        const formattedContributions = (newContentData.contributions || []).map((contrib: any) => ({
          id: `new-${contrib.id}`,
          reporterUsername: contrib.user?.username || 'Usuario',
          reporterDisplayName: contrib.user?.displayName || contrib.user?.username || 'Usuario',
          reportableType: contrib.contributableType,
          reportableId: '0',
          issueType: 'contribution',
          title: contrib.contributionData?.title_romaji || `Nueva contribución de ${contrib.contributableType}`,
          description: contrib.contributionData?.contributionNotes || 'Sin notas',
          status: contrib.status,
          priority: 'normal',
          assignedToUsername: contrib.assignedToUsername,
          moderatorNotes: contrib.moderatorNotes,
          createdAt: contrib.createdAt,
          type: 'contribution',
        }));
        allReports.push(...formattedContributions);
      }

      // Procesar contribuciones de ediciones
      if (editsResponse.ok) {
        const editsData = await editsResponse.json();
        const formattedEdits = (editsData.contributions || []).map((edit: any) => ({
          id: `edit-${edit.id}`,
          reporterUsername: edit.contributorUsername,
          reporterDisplayName: edit.contributorDisplayName || edit.contributorUsername,
          reportableType: edit.contributableType,
          reportableId: edit.contributableId?.toString() || '0',
          issueType: 'contribution',
          title: `Edición de ${edit.contributableType} #${edit.contributableId}`,
          description: edit.contributionNotes || 'Sin notas',
          status: edit.status,
          priority: 'normal',
          assignedToUsername: edit.assignedToUsername,
          moderatorNotes: edit.moderatorNotes,
          createdAt: edit.createdAt,
          type: 'contribution',
        }));
        allReports.push(...formattedEdits);
      }

      // Ordenar por fecha de creación
      allReports.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      console.log(`📊 Total de reportes y contribuciones cargados (${status}):`, allReports.length);
      setReports(allReports);
    } catch (error) {
      console.error('Error loading reports:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Error al cargar los reportes',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAllCounts = async () => {
    if (!user) return;

    try {
      const isAdmin = user.isAdmin || false;
      const statuses = ['pending', 'in_review', 'resolved', 'dismissed', 'approved', 'rejected'];
      
      const counts = await Promise.all(
        statuses.map(async (status) => {
          try {
            const [reportsRes, newContentRes, editsRes] = await Promise.all([
              fetch(`/api/content-reports?status=${status}&currentUserId=${user.id}&isAdmin=${isAdmin}`),
              fetch(`/api/moderation/contributions?status=${status}`),
              fetch(`/api/content-contributions?status=${status}&currentUserId=${user.id}&isAdmin=${isAdmin}`)
            ]);

            const reportsData = await reportsRes.json();
            const newContentData = await newContentRes.json();
            const editsData = await editsRes.json();

            const count = (reportsData.reports?.length || 0) + 
                         (newContentData.contributions?.length || 0) + 
                         (editsData.contributions?.length || 0);
            return { status, count };
          } catch {
            return { status, count: 0 };
          }
        })
      );

      const newCounts = counts.reduce((acc, { status, count }) => {
        acc[status as keyof typeof acc] = count;
        return acc;
      }, { pending: 0, in_review: 0, resolved: 0, dismissed: 0, approved: 0, rejected: 0 });

      setTabCounts(newCounts);
    } catch (error) {
      console.error('Error al cargar counts:', error);
    }
  };

  const getMediaUrl = (type: string, id: string) => {
    const typeMap: Record<string, string> = {
      anime: 'anime',
      manga: 'manga',
      novel: 'novela',
      novels: 'novela',
      donghua: 'dougua',
      manhua: 'manhua',
      manhwa: 'manwha',
      fan_comic: 'fan-comic',
    };
    return `/${typeMap[type] || 'anime'}/${id}`;
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
        loadReports(activeTab); // Recargar lista
      } else {
        if (response.status === 409) {
          toast({
            variant: 'destructive',
            title: 'Caso ocupado',
            description: `Este caso ya está siendo manejado por ${data.assignedTo?.display_name || data.assignedTo?.username}`,
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
        loadReports(activeTab); // Recargar lista
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

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Sistema de Reportes</h1>
        <p className="text-muted-foreground">
          Administra todos los reportes enviados por los usuarios
        </p>
      </div>

      {/* Navegación rápida a diferentes tipos de reportes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="hover:bg-accent transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5" />
              Reportes de Contenido
            </CardTitle>
            <CardDescription>
              Información incorrecta o faltante en anime, manga, etc.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Gestiona los reportes sobre datos incorrectos, información faltante o problemas con el contenido.
            </p>
          </CardContent>
        </Card>

        <Card className="hover:bg-accent transition-colors cursor-pointer" onClick={() => router.push('/dashboard/admin/reported-reviews')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Reportes de Reviews
            </CardTitle>
            <CardDescription>
              Reviews reportadas por violaciones de normas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Gestiona reviews reportadas por spam, spoilers, contenido ofensivo, etc.
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/admin/reported-reviews">
                Ver Reportes de Reviews →
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:bg-accent transition-colors cursor-pointer" onClick={() => router.push('/dashboard/admin/reported-comments')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Reportes de Comentarios
            </CardTitle>
            <CardDescription>
              Comentarios reportados por violaciones de normas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Gestiona comentarios reportados por spam, lenguaje ofensivo, spoilers, etc.
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/admin/reported-comments">
                Ver Reportes de Comentarios →
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="border-t pt-6">
        <h2 className="text-2xl font-bold mb-4">Reportes de Contenido</h2>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pendientes ({tabCounts.pending})
            </TabsTrigger>
            <TabsTrigger value="in_review" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              En revisión ({tabCounts.in_review})
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Aprobados ({tabCounts.approved})
            </TabsTrigger>
            <TabsTrigger value="resolved" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Resueltos ({tabCounts.resolved})
            </TabsTrigger>
            <TabsTrigger value="dismissed" className="flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Descartados ({tabCounts.dismissed})
            </TabsTrigger>
          </TabsList>

        {['pending', 'in_review', 'approved', 'resolved', 'dismissed'].map((status) => (
          <TabsContent key={status} value={status}>
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Cargando reportes...</p>
              </div>
            ) : reports.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No hay reportes {STATUS_CONFIG[status as keyof typeof STATUS_CONFIG].label.toLowerCase()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
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
                            <CardTitle className="mb-2">{report.title}</CardTitle>
                            <CardDescription className="flex flex-wrap gap-2 items-center">
                              <Badge variant="outline">
                                {TYPE_LABELS[report.reportableType] || report.reportableType}
                              </Badge>
                              {report.type === 'contribution' ? (
                                <Badge className="bg-purple-500">Contribución</Badge>
                              ) : null}
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
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
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
                          {report.type !== 'contribution' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(getMediaUrl(report.reportableType, report.reportableId))}
                              >
                                Ver Contenido
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => {
                                  const normalizedType = report.reportableType === 'novel' ? 'novels' : report.reportableType;
                                  router.push(`/dashboard/admin/edit/${normalizedType}/${report.reportableId}`);
                                }}
                              >
                                Editar Contenido
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            onClick={() => {
                              if (report.type === 'contribution') {
                                if (report.id.startsWith('edit-')) {
                                  const editId = report.id.replace('edit-', '');
                                  router.push(`/dashboard/admin/contributions/edit/${editId}`);
                                } else if (report.id.startsWith('new-')) {
                                  const newId = report.id.replace('new-', '');
                                  router.push(`/dashboard/admin/contributions/new/${newId}`);
                                }
                              } else {
                                router.push(`/dashboard/admin/reports/${report.id}`);
                              }
                            }}
                          >
                            {report.type === 'contribution' ? 'Revisar Contribución' : 'Administrar Reporte'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
      </div>
    </div>
  );
}
