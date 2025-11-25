'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileWarning, Clock, CheckCircle2, XCircle, AlertTriangle, Loader2, ExternalLink, User, UserCheck } from 'lucide-react';
import Link from 'next/link';

interface Report {
  id: string;
  reporterUsername: string;
  reporterDisplayName: string;
  reportableType: string;
  reportableId: string;
  issueType: string;
  title: string;
  description: string;
  status: 'pending' | 'in_review' | 'resolved' | 'rejected';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  assignedToUsername?: string;
  moderatorNotes?: string;
  createdAt: string;
  updatedAt: string;
  type?: 'report' | 'contribution';
}

interface Contribution {
  id: string;
  contributorUserId: number;
  contributorUsername: string;
  contributorDisplayName?: string;
  contributableType: string;
  contributableId: number;
  proposedChanges: any;
  contributionNotes?: string;
  sources?: string[];
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'needs_changes';
  assignedToUserId?: number;
  assignedToUsername?: string;
  createdAt: string;
  updatedAt: string;
  isNewContent?: boolean;
}

const STATUS_CONFIG = {
  pending: { label: 'Pendiente', icon: Clock, color: 'bg-yellow-500' },
  in_review: { label: 'En revisión', icon: AlertTriangle, color: 'bg-blue-500' },
  resolved: { label: 'Resuelto', icon: CheckCircle2, color: 'bg-green-500' },
  rejected: { label: 'Descartado', icon: XCircle, color: 'bg-red-500' },
  approved: { label: 'Aprobado', icon: CheckCircle2, color: 'bg-green-500' },
  needs_changes: { label: 'Requiere cambios', icon: AlertTriangle, color: 'bg-orange-500' },
};

const PRIORITY_CONFIG = {
  low: { label: 'Baja', color: 'secondary' },
  normal: { label: 'Normal', color: 'default' },
  high: { label: 'Alta', color: 'destructive' },
  urgent: { label: 'Urgente', color: 'destructive' },
};

const TYPE_LABELS: Record<string, string> = {
  anime: 'Anime',
  manga: 'Manga',
  novel: 'Novela',
  donghua: 'Donghua',
  manhua: 'Manhua',
  manhwa: 'Manhwa',
  fan_comic: 'Fan Comic',
};

export default function ModeratorReportsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [tabCounts, setTabCounts] = useState({
    pending: 0,
    in_review: 0,
    resolved: 0,
    rejected: 0,
    approved: 0,
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const allowedRoles = ['admin', 'moderator'];
    if (!allowedRoles.includes(user.role || 'user')) {
      router.push('/');
      return;
    }

    loadReports(activeTab);
    loadAllCounts();
  }, [user, router, activeTab]);

  const loadAllCounts = async () => {
    if (!user || !user.id) return;

    try {
      const isAdmin = user.isAdmin || false;
      const statuses = ['pending', 'in_review', 'resolved', 'rejected', 'approved'];
      
      const counts = await Promise.all(
        statuses.map(async (status) => {
          try {
            const [reportsRes, newContentRes, editsRes] = await Promise.all([
              fetch(`/api/content-reports?status=${status}`),
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
      }, { pending: 0, in_review: 0, resolved: 0, rejected: 0, approved: 0 });

      setTabCounts(newCounts);
    } catch (error) {
      console.error('Error al cargar counts:', error);
    }
  };

  const loadReports = async (status: string) => {
    setLoading(true);
    try {
      const isAdmin = user.isAdmin || false;
      
      // Cargar reportes de contenido
      const reportsResponse = await fetch(`/api/content-reports?status=${status}`, {
        credentials: 'include',
      });

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
          updatedAt: contrib.updatedAt,
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
          updatedAt: edit.updatedAt,
          type: 'contribution',
        }));
        allReports.push(...formattedEdits);
      }

      // Ordenar por fecha de creación
      allReports.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setReports(allReports);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMediaUrl = (type: string, id: string) => {
    const typeMap: Record<string, string> = {
      anime: 'anime',
      manga: 'manga',
      novel: 'novela',
      donghua: 'donghua',
      manhua: 'manhua',
      manhwa: 'manhwa',
      fan_comic: 'fan-comic',
    };
    return `/${typeMap[type] || 'anime'}/${id}`;
  };

  const getEditUrl = (report: Report) => {
    if (report.type === 'contribution') {
      if (report.id.startsWith('edit-')) {
        const editId = report.id.replace('edit-', '');
        return `/dashboard/moderator/contributions/edit/${editId}`;
      } else if (report.id.startsWith('new-')) {
        const newId = report.id.replace('new-', '');
        return `/dashboard/moderator/contributions/new/${newId}`;
      }
    }
    return `/dashboard/moderator/reports/${report.id}`;
  };

  const handleTakeCase = async (report: Report) => {
    if (!user) return;

    setAssigningId(report.id);
    try {
      let endpoint = '';
      
      // Determinar el endpoint según el tipo
      if (report.type === 'contribution') {
        if (report.id.startsWith('edit-')) {
          const editId = report.id.replace('edit-', '');
          endpoint = `/api/content-contributions/${editId}/assign`;
        } else if (report.id.startsWith('new-')) {
          const newId = report.id.replace('new-', '');
          endpoint = `/api/moderation/contributions/${newId}/assign`;
        }
      } else {
        endpoint = `/api/content-reports/${report.id}/assign`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        // Recargar reportes y counts
        await Promise.all([
          loadReports(activeTab),
          loadAllCounts()
        ]);
      } else {
        console.error('Error al tomar caso');
      }
    } catch (error) {
      console.error('Error al tomar caso:', error);
    } finally {
      setAssigningId(null);
    }
  };

  const handleReleaseCase = async (report: Report) => {
    if (!user) return;

    setAssigningId(report.id);
    try {
      let endpoint = '';
      
      // Determinar el endpoint según el tipo
      if (report.type === 'contribution') {
        if (report.id.startsWith('edit-')) {
          const editId = report.id.replace('edit-', '');
          endpoint = `/api/content-contributions/${editId}/assign`;
        } else if (report.id.startsWith('new-')) {
          const newId = report.id.replace('new-', '');
          endpoint = `/api/moderation/contributions/${newId}/assign`;
        }
      } else {
        endpoint = `/api/content-reports/${report.id}/assign`;
      }

      const response = await fetch(endpoint, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        // Recargar reportes y counts
        await Promise.all([
          loadReports(activeTab),
          loadAllCounts()
        ]);
      } else {
        console.error('Error al liberar caso');
      }
    } catch (error) {
      console.error('Error al liberar caso:', error);
    } finally {
      setAssigningId(null);
    }
  };

  if (!user || !['admin', 'moderator'].includes(user.role || 'user')) {
    return null;
  }

  return (
    <main className="container mx-auto p-2 sm:p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Reportes de Contenido</h1>
        <p className="text-muted-foreground">
          Gestiona los reportes de información incorrecta o faltante
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            <Clock className="mr-2 h-4 w-4" />
            Pendientes ({tabCounts.pending})
          </TabsTrigger>
          <TabsTrigger value="in_review">
            <AlertTriangle className="mr-2 h-4 w-4" />
            En revisión ({tabCounts.in_review})
          </TabsTrigger>
          <TabsTrigger value="resolved">
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Resueltos ({tabCounts.resolved})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            <XCircle className="mr-2 h-4 w-4" />
            Descartados ({tabCounts.rejected})
          </TabsTrigger>
        </TabsList>

        {['pending', 'in_review', 'resolved', 'rejected'].map((status) => (
          <TabsContent key={status} value={status} className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : reports.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileWarning className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No hay reportes {STATUS_CONFIG[status as keyof typeof STATUS_CONFIG].label.toLowerCase()}</p>
                  <p className="text-sm text-muted-foreground">
                    Los reportes aparecerán aquí cuando los usuarios reporten problemas
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {reports.map((report) => {
                  const StatusIcon = STATUS_CONFIG[report.status].icon;
                  const isAssignedToMe = report.assignedToUsername === user?.username;
                  const isAssignedToOther = report.assignedToUsername && !isAssignedToMe;
                  
                  return (
                    <Card 
                      key={report.id} 
                      className={`transition-all ${
                        isAssignedToMe 
                          ? 'border-primary border-2 shadow-md' 
                          : isAssignedToOther 
                          ? 'border-muted opacity-70' 
                          : 'hover:border-primary/50'
                      }`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <StatusIcon className="h-4 w-4" />
                              <CardTitle className="text-lg">{report.title}</CardTitle>
                            </div>
                            <CardDescription className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline">
                                {TYPE_LABELS[report.reportableType] || report.reportableType}
                              </Badge>
                              {report.type === 'contribution' ? (
                                <Badge className="bg-purple-500 text-white">
                                  <span className="mr-1">✨</span> Contribución
                                </Badge>
                              ) : (
                                <Badge variant={PRIORITY_CONFIG[report.priority].color as any}>
                                  {PRIORITY_CONFIG[report.priority].label}
                                </Badge>
                              )}
                              <span className="text-xs">
                                Por <strong>{report.reporterDisplayName || report.reporterUsername}</strong>
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(report.createdAt).toLocaleDateString('es-ES', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </CardDescription>
                          </div>
                          {report.assignedToUsername && (
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md ${
                              isAssignedToMe 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted'
                            }`}>
                              {isAssignedToMe ? (
                                <>
                                  <UserCheck className="h-4 w-4" />
                                  <span className="text-sm font-medium">Tu caso</span>
                                </>
                              ) : (
                                <>
                                  <User className="h-4 w-4" />
                                  <span className="text-sm">
                                    {report.assignedToUsername}
                                  </span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="text-sm whitespace-pre-wrap">{report.description}</p>
                        </div>

                        {report.moderatorNotes && (
                          <div className="border-l-4 border-primary pl-4 bg-primary/5 p-3 rounded-r">
                            <p className="text-xs font-semibold mb-1 text-primary">Notas del moderador:</p>
                            <p className="text-sm">{report.moderatorNotes}</p>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2">
                          {/* Botón Tomar Caso - Solo si no está asignado */}
                          {!report.assignedToUsername && (
                            <Button 
                              size="sm" 
                              variant="default"
                              onClick={() => handleTakeCase(report)}
                              disabled={assigningId === report.id}
                            >
                              {assigningId === report.id ? '⏳ Asignando...' : '🎯 Tomar Caso'}
                            </Button>
                          )}
                          
                          {/* Botón Liberar Caso - Solo si está asignado a ti */}
                          {isAssignedToMe && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleReleaseCase(report)}
                              disabled={assigningId === report.id}
                            >
                              {assigningId === report.id ? '⏳ Liberando...' : '🔓 Liberar Caso'}
                            </Button>
                          )}

                          {report.type !== 'contribution' && report.reportableId !== '0' && (
                            <Button asChild size="sm" variant="outline">
                              <Link href={getMediaUrl(report.reportableType, report.reportableId)} target="_blank">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Ver contenido
                              </Link>
                            </Button>
                          )}
                          
                          <Button 
                            asChild 
                            size="sm"
                            variant={isAssignedToMe ? "default" : "secondary"}
                          >
                            <Link href={getEditUrl(report)}>
                              {report.type === 'contribution' ? 'Revisar contribución' : 'Gestionar reporte'}
                            </Link>
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
    </main>
  );
}
