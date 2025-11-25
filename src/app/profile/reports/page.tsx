'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle, Clock, XCircle, ExternalLink, MessageSquare } from 'lucide-react';

// Reportes de contenido (anime, manga, etc.)
interface ContentReport {
  id: string;
  reportable_type: string;
  reportable_id: string;
  report_reason: string;
  status: string;
  moderator_notes?: string;
  created_at: string;
  resolved_at?: string;
  reviewed_by_username?: string;
  reviewed_by_display_name?: string;
  content_title: string;
  type: 'content';
}

// Reportes de comentarios
interface CommentReport {
  id: string;
  reason: string;
  description: string;
  status: string;
  resolution_notes?: string;
  action_taken?: string;
  created_at: string;
  resolved_at?: string;
  resolved_by_username?: string;
  resolved_by_display_name?: string;
  comment_id: number;
  comment_content: string;
  comment_deleted: string | null;
  commentable_type: string;
  commentable_id: number;
  content_title: string;
  type: 'comment';
}

type Report = ContentReport | CommentReport;

const STATUS_CONFIG = {
  pending: { label: 'Pendiente', icon: Clock, color: 'bg-yellow-500' },
  reviewing: { label: 'En revisión', icon: AlertCircle, color: 'bg-blue-500' },
  in_review: { label: 'En revisión', icon: AlertCircle, color: 'bg-blue-500' }, // Compatibilidad
  resolved: { label: 'Resuelto', icon: CheckCircle, color: 'bg-green-500' },
  rejected: { label: 'Descartado', icon: XCircle, color: 'bg-gray-500' },
  dismissed: { label: 'Descartado', icon: XCircle, color: 'bg-gray-500' }, // Compatibilidad
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

const TYPE_URLS: Record<string, string> = {
  anime: 'anime',
  manga: 'manga',
  novel: 'novela',
  novels: 'novela',
  donghua: 'dougua',
  manhua: 'manhua',
  manhwa: 'manwha',
  fan_comic: 'fan-comic',
};

export default function UserReportsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [allReports, setAllReports] = useState<Report[]>([]); // Guardar TODOS los reportes
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadReports();
  }, [user, router]);

  const loadReports = async () => {
    setLoading(true);
    try {
      // SIEMPRE cargar TODOS los reportes sin filtro
      const [contentResponse, commentResponse] = await Promise.all([
        fetch(`/api/user/reports?limit=100`, { credentials: 'include' }),
        fetch(`/api/user/comment-reports?limit=100`, { credentials: 'include' }),
      ]);

      const contentData = contentResponse.ok ? await contentResponse.json() : { reports: [] };
      const commentData = commentResponse.ok ? await commentResponse.json() : { reports: [] };

      // Marcar tipo de reporte
      const contentReports: ContentReport[] = (contentData.reports || []).map((r: any) => ({
        ...r,
        type: 'content' as const,
      }));

      const commentReports: CommentReport[] = (commentData.reports || []).map((r: any) => ({
        ...r,
        type: 'comment' as const,
      }));

      // Combinar y ordenar por fecha
      const combined = [...contentReports, ...commentReports].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setAllReports(combined);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const getContentUrl = (report: Report) => {
    if (report.type === 'comment') {
      const typeMap: Record<string, string> = {
        anime: 'anime',
        manga: 'manga',
        novels: 'novela',
        donghua: 'dougua',
        manhua: 'manhua',
        manhwa: 'manwha',
        fan_comic: 'fan-comic',
      };
      return `/${typeMap[report.commentable_type] || 'anime'}/${report.commentable_id}`;
    } else {
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
      return `/${typeMap[report.reportable_type] || 'anime'}/${report.reportable_id}`;
    }
  };

  // Normalizar estados para compatibilidad
  const normalizeStatus = (status: string): string => {
    if (status === 'in_review') return 'reviewing';
    if (status === 'dismissed') return 'rejected';
    return status;
  };

  // Filtrar reportes según la pestaña activa (del estado completo)
  const filteredReports = activeTab === 'all' 
    ? allReports 
    : allReports.filter(r => normalizeStatus(r.status) === activeTab);

  // Contar por estado normalizado (SIEMPRE del estado completo)
  const countByStatus = (status: string) => 
    allReports.filter(r => normalizeStatus(r.status) === status).length;

  if (loading && allReports.length === 0) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p>Cargando reportes...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Mis Reportes</h1>
        <p className="text-muted-foreground">
          Historial de todos los reportes que has enviado (contenido y comentarios)
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            Todos ({allReports.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pendientes ({countByStatus('pending')})
          </TabsTrigger>
          <TabsTrigger value="reviewing">
            En revisión ({countByStatus('reviewing')})
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Resueltos ({countByStatus('resolved')})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Descartados ({countByStatus('rejected')})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredReports.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No tienes reportes en esta categoría
              </CardContent>
            </Card>
          ) : (
            filteredReports.map((report) => {
              const normalizedStatus = normalizeStatus(report.status);
              const StatusIcon = STATUS_CONFIG[normalizedStatus as keyof typeof STATUS_CONFIG]?.icon || Clock;
              const isCommentReport = report.type === 'comment';
              
              return (
                <Card key={`${report.type}-${report.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2 flex items-center gap-2">
                          {isCommentReport && <MessageSquare className="h-4 w-4" />}
                          {report.content_title}
                        </CardTitle>
                        <CardDescription className="flex flex-wrap gap-2 items-center">
                          <Badge variant="outline">
                            {isCommentReport ? 'Comentario reportado' : TYPE_LABELS[report.type === 'content' ? report.reportable_type : ''] || 'Contenido'}
                          </Badge>
                          <Badge className={STATUS_CONFIG[normalizedStatus as keyof typeof STATUS_CONFIG]?.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {STATUS_CONFIG[normalizedStatus as keyof typeof STATUS_CONFIG]?.label}
                          </Badge>
                          <span className="text-xs">
                            Reportado el {new Date(report.created_at).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Mostrar comentario reportado si es reporte de comentario */}
                    {isCommentReport && (
                      <div className="bg-muted/50 p-3 rounded-md">
                        <p className="text-xs font-semibold mb-1 text-muted-foreground">Comentario reportado:</p>
                        <p className="text-sm italic">
                          {report.comment_deleted 
                            ? '(Comentario eliminado por moderación)' 
                            : report.comment_content
                          }
                        </p>
                      </div>
                    )}

                    <div>
                      <p className="text-sm font-medium mb-1">Tu reporte:</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {report.type === 'comment' ? `${report.reason}\n${report.description}` : report.report_reason}
                      </p>
                    </div>

                    {/* Respuesta del moderador */}
                    {((report.type === 'content' && report.moderator_notes) || 
                      (report.type === 'comment' && report.resolution_notes)) && (
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm font-medium mb-1">
                          Respuesta del moderador:
                        </p>
                        <p className="text-sm whitespace-pre-wrap">
                          {report.type === 'comment' ? report.resolution_notes : report.moderator_notes}
                        </p>
                        {report.type === 'comment' && report.action_taken && report.action_taken !== 'no_action' && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Acción tomada: {report.action_taken === 'comment_deleted' ? 'Comentario eliminado' : report.action_taken}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Por @{report.type === 'comment' ? report.resolved_by_username : report.reviewed_by_username}
                          {report.resolved_at && (
                            <> · {new Date(report.resolved_at).toLocaleDateString('es-ES')}</>
                          )}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(getContentUrl(report))}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Ver Contenido
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
