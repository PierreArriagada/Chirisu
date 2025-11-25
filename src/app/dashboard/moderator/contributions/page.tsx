/**
 * ========================================
 * PÁGINA: PANEL DE MODERACIÓN DE CONTRIBUCIONES
 * ========================================
 * Vista para que admins/mods revisen contribuciones pendientes
 */

'use client'; 

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import Link from 'next/link';

interface Contribution {
  id: string;
  userId: string;
  contributableType: string;
  contributionData: any;
  status: string;
  createdAt: string;
  user: {
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
  assignedToUserId?: string;
  assignedToUsername?: string;
  assignedToDisplayName?: string;
  assignedAt?: string;
}

export default function ModerationContributionsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [pendingContributions, setPendingContributions] = useState<Contribution[]>([]);
  const [inReviewContributions, setInReviewContributions] = useState<Contribution[]>([]);
  const [approvedContributions, setApprovedContributions] = useState<Contribution[]>([]);
  const [rejectedContributions, setRejectedContributions] = useState<Contribution[]>([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [tabCounts, setTabCounts] = useState({
    pending: 0,
    in_review: 0,
    approved: 0,
    rejected: 0,
  });

  // Función para cargar solo los counts de todas las pestañas
  const loadTabCounts = useCallback(async () => {
    if (!user || !user.id || authLoading) {
      return;
    }

    try {
      const isAdmin = user.isAdmin || false;
      const statuses = ['pending', 'in_review', 'approved', 'rejected'];
      
      const counts = await Promise.all(
        statuses.map(async (status) => {
          try {
            const [newContentRes, editsRes] = await Promise.all([
              fetch(`/api/moderation/contributions?status=${status}`),
              fetch(`/api/content-contributions?status=${status}&currentUserId=${user.id}&isAdmin=${isAdmin}`)
            ]);

            const newContentData = await newContentRes.json();
            const editsData = await editsRes.json();

            const count = (newContentData.contributions?.length || 0) + (editsData.contributions?.length || 0);
            return { status, count };
          } catch {
            return { status, count: 0 };
          }
        })
      );

      const newCounts = counts.reduce((acc, { status, count }) => {
        acc[status as keyof typeof acc] = count;
        return acc;
      }, { pending: 0, in_review: 0, approved: 0, rejected: 0 });

      setTabCounts(newCounts);
    } catch (error) {
      console.error('Error al cargar counts:', error);
    }
  }, [user, authLoading]);

  // Función para cargar contribuciones de una pestaña específica
  const fetchContributions = useCallback(async (status: string) => {
    if (!user || !user.id || authLoading) {
      return;
    }

    setLoading(true);
    try {
      const isAdmin = user.isAdmin || false;

      // Cargar contribuciones de nuevo contenido
      const newContentResponse = await fetch(`/api/moderation/contributions?status=${status}`);
      const newContentData = await newContentResponse.json();

      // Cargar contribuciones de ediciones (content_contributions)
      const editsResponse = await fetch(
        `/api/content-contributions?status=${status}&currentUserId=${user.id}&isAdmin=${isAdmin}`
      );
      const editsData = await editsResponse.json();

      // Combinar ambos tipos de contribuciones
      let allContributions: Contribution[] = [];

      if (newContentData.success) {
        allContributions = [...newContentData.contributions];
      }

      if (editsData.success && editsData.contributions) {
        const editContributions = editsData.contributions.map((edit: any) => ({
          id: `edit-${edit.id}`,
          userId: edit.contributorUserId,
          contributableType: edit.contributableType,
          contributionData: {
            isEdit: true,
            editId: edit.id,
            title_romaji: `Edición de ${edit.contributableType} #${edit.contributableId}`,
            proposedChanges: edit.proposedChanges,
            contributionNotes: edit.contributionNotes,
            sources: edit.sources,
          },
          status: edit.status,
          createdAt: edit.createdAt,
          user: {
            username: edit.contributorUsername,
            displayName: edit.contributorDisplayName || edit.contributorUsername,
            avatarUrl: undefined,
          },
        }));
        allContributions = [...allContributions, ...editContributions];
      }

      // Ordenar por fecha de creación
      allContributions.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // Actualizar el estado correspondiente
      if (status === 'pending') {
        setPendingContributions(allContributions);
      } else if (status === 'in_review') {
        setInReviewContributions(allContributions);
      } else if (status === 'approved') {
        setApprovedContributions(allContributions);
      } else if (status === 'rejected') {
        setRejectedContributions(allContributions);
      }
      
      // Recargar counts después de cargar datos
      loadTabCounts();
    } catch (error) {
      console.error('Error al cargar contribuciones:', error);
    } finally {
      setLoading(false);
    }
  }, [user, authLoading, loadTabCounts]);

  // useEffect para cargar cuando cambia la pestaña activa
  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/login');
      return;
    }

    // Cargar counts de todas las pestañas
    loadTabCounts();
    
    // Cargar contenido de la pestaña activa
    fetchContributions(activeTab);
  }, [authLoading, user, router, activeTab, fetchContributions, loadTabCounts]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    fetchContributions(value);
  };

  const handleTakeCase = async (contributionId: string) => {
    if (!user || !user.id) {
      console.warn('⚠️ handleTakeCase: user no disponible');
      return;
    }

    // Verificar si es una edición o contribución nueva
    const isEdit = contributionId.startsWith('edit-');
    const actualId = isEdit ? contributionId.replace('edit-', '') : contributionId;
    const endpoint = isEdit 
      ? `/api/content-contributions/${actualId}/assign`
      : `/api/contributions/${actualId}/assign`;

    setAssigningId(contributionId);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await response.json();

      if (response.ok) {
        // Toast success - not showing it since the user will see the update immediately
        fetchContributions(activeTab); // Recargar lista
      } else {
        if (response.status === 409) {
          alert(`Este caso ya está siendo manejado por ${data.assignedTo?.display_name || data.assignedTo?.username}`);
        } else {
          throw new Error(data.error || 'Error al asignar caso');
        }
      }
    } catch (error: any) {
      console.error('Error al asignar caso:', error);
      alert(error.message || 'No se pudo asignar el caso');
    } finally {
      setAssigningId(null);
    }
  };

  const handleReleaseCase = async (contributionId: string) => {
    if (!user || !user.id) {
      console.warn('⚠️ handleReleaseCase: user no disponible');
      return;
    }

    const isEdit = contributionId.startsWith('edit-');
    const actualId = isEdit ? contributionId.replace('edit-', '') : contributionId;
    const endpoint = isEdit 
      ? `/api/content-contributions/${actualId}/assign`
      : `/api/contributions/${actualId}/assign`;

    setAssigningId(contributionId);
    try {
      const response = await fetch(endpoint, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        fetchContributions(activeTab); // Recargar lista
      } else {
        throw new Error('Error al liberar caso');
      }
    } catch (error) {
      console.error('Error al liberar caso:', error);
      alert('No se pudo liberar el caso');
    } finally {
      setAssigningId(null);
    }
  };

  // Mostrar loading mientras se autentica
  if (authLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="ml-3 text-muted-foreground">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Redirigir si no hay usuario después de cargar
  if (!user) {
    return null; // El useEffect ya redirigió a /login
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Panel de Moderación</CardTitle>
          <CardDescription className="text-lg">
            Revisa y gestiona las contribuciones de la comunidad
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pendientes ({tabCounts.pending})
              </TabsTrigger>
              <TabsTrigger value="in_review" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                En Revisión ({tabCounts.in_review})
              </TabsTrigger>
              <TabsTrigger value="approved" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Aprobadas ({tabCounts.approved})
              </TabsTrigger>
              <TabsTrigger value="rejected" className="flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Rechazadas ({tabCounts.rejected})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-6">
              {loading ? (
                <div className="flex justify-center items-center p-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : pendingContributions.length === 0 ? (
                <div className="text-center p-12 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No hay contribuciones pendientes</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingContributions.map((contribution) => (
                    <ContributionCard 
                      key={contribution.id} 
                      contribution={contribution}
                      user={user}
                      onTakeCase={handleTakeCase}
                      onReleaseCase={handleReleaseCase}
                      assigningId={assigningId}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="in_review" className="mt-6">
              {loading ? (
                <div className="flex justify-center items-center p-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : inReviewContributions.length === 0 ? (
                <div className="text-center p-12 text-muted-foreground">
                  <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No hay contribuciones en revisión</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {inReviewContributions.map((contribution) => (
                    <ContributionCard 
                      key={contribution.id} 
                      contribution={contribution}
                      user={user}
                      onTakeCase={handleTakeCase}
                      onReleaseCase={handleReleaseCase}
                      assigningId={assigningId}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="approved" className="mt-6">
              {loading ? (
                <div className="flex justify-center items-center p-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : approvedContributions.length === 0 ? (
                <div className="text-center p-12 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No hay contribuciones aprobadas</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {approvedContributions.map((contribution) => (
                    <ContributionCard 
                      key={contribution.id} 
                      contribution={contribution}
                      user={user}
                      onTakeCase={handleTakeCase}
                      onReleaseCase={handleReleaseCase}
                      assigningId={assigningId}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="rejected" className="mt-6">
              {loading ? (
                <div className="flex justify-center items-center p-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : rejectedContributions.length === 0 ? (
                <div className="text-center p-12 text-muted-foreground">
                  <XCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No hay contribuciones rechazadas</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {rejectedContributions.map((contribution) => (
                    <ContributionCard 
                      key={contribution.id} 
                      contribution={contribution}
                      user={user}
                      onTakeCase={handleTakeCase}
                      onReleaseCase={handleReleaseCase}
                      assigningId={assigningId}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function ContributionCard({ 
  contribution,
  user,
  onTakeCase,
  onReleaseCase,
  assigningId
}: { 
  contribution: Contribution;
  user: any;
  onTakeCase: (id: string) => void;
  onReleaseCase: (id: string) => void;
  assigningId: string | null;
}) {
  const data = contribution.contributionData;
  
  // Mapeo de todos los tipos (MEDIOS + ENTIDADES)
  const typeLabels: Record<string, string> = {
    // Medios
    'anime': 'Anime',
    'manga': 'Manga',
    'novel': 'Novela',
    'donghua': 'Donghua',
    'manhua': 'Manhua',
    'manhwa': 'Manhwa',
    'fan_comic': 'Fan Comic',
    // Entidades
    'character': 'Personaje',
    'staff': 'Staff',
    'voice_actor': 'Actor de Voz',
    'studio': 'Estudio',
    'genre': 'Género',
  };
  
  const mediaTypeLabel = typeLabels[contribution.contributableType] || 'Contenido';

  const statusColors = {
    pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    in_review: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    approved: 'bg-green-500/10 text-green-500 border-green-500/20',
    rejected: 'bg-red-500/10 text-red-500 border-red-500/20',
    needs_changes: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  };

  const statusLabels = {
    pending: 'Pendiente',
    in_review: 'En Revisión',
    approved: 'Aprobada',
    rejected: 'Rechazada',
    needs_changes: 'Requiere Cambios',
  };

  // Verificar si es una edición
  const isEdit = data.isEdit === true;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <Badge variant="outline" className="text-sm">
                {mediaTypeLabel}
              </Badge>
              {isEdit && (
                <Badge variant="secondary" className="text-sm">
                  Edición
                </Badge>
              )}
              <Badge className={statusColors[contribution.status as keyof typeof statusColors]}>
                {statusLabels[contribution.status as keyof typeof statusLabels] || contribution.status}
              </Badge>
            </div>

            <h3 className="text-xl font-semibold mb-2">
              {data.title_romaji || data.title_english || data.name || data.name_romaji || data.code || 'Sin título'}
            </h3>

            {isEdit ? (
              // Mostrar información de edición
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">Campos modificados:</span>
                  <div className="mt-1">
                    {Object.keys(data.proposedChanges || {}).slice(0, 5).map((field) => (
                      <span key={field} className="inline-block bg-muted px-2 py-1 rounded mr-2 mb-1">
                        {field}
                      </span>
                    ))}
                    {Object.keys(data.proposedChanges || {}).length > 5 && (
                      <span className="text-xs">
                        y {Object.keys(data.proposedChanges).length - 5} más...
                      </span>
                    )}
                  </div>
                </div>

                {data.contributionNotes && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    <span className="font-medium">Notas:</span> {data.contributionNotes}
                  </p>
                )}
              </div>
            ) : (
              // Mostrar información de nuevo contenido
              <>
                {/* MEDIOS */}
                {['anime', 'manga', 'novel', 'donghua', 'manhua', 'manhwa', 'fan_comic'].includes(contribution.contributableType) && (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm text-muted-foreground">
                      {data.type && <div><span className="font-medium">Tipo:</span> {data.type}</div>}
                      {data.episode_count && <div><span className="font-medium">Episodios:</span> {data.episode_count}</div>}
                      {data.chapters && <div><span className="font-medium">Capítulos:</span> {data.chapters}</div>}
                      {data.volumes && <div><span className="font-medium">Volúmenes:</span> {data.volumes}</div>}
                      {data.status && <div><span className="font-medium">Estado:</span> {data.status}</div>}
                      {data.season && data.season_year && (
                        <div><span className="font-medium">Temporada:</span> {data.season} {data.season_year}</div>
                      )}
                    </div>

                    {data.synopsis && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {data.synopsis}
                      </p>
                    )}
                  </>
                )}

                {/* PERSONAJES */}
                {contribution.contributableType === 'character' && (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4 text-sm text-muted-foreground">
                      {data.name_romaji && <div><span className="font-medium">Romaji:</span> {data.name_romaji}</div>}
                      {data.gender && <div><span className="font-medium">Género:</span> {data.gender}</div>}
                      {data.age && <div><span className="font-medium">Edad:</span> {data.age}</div>}
                    </div>

                    {data.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {data.description}
                      </p>
                    )}
                  </>
                )}

                {/* STAFF / VOICE ACTOR */}
                {(contribution.contributableType === 'staff' || contribution.contributableType === 'voice_actor') && (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4 text-sm text-muted-foreground">
                      {data.name_native && <div><span className="font-medium">Nativo:</span> {data.name_native}</div>}
                      {data.gender && <div><span className="font-medium">Género:</span> {data.gender}</div>}
                      {data.language && <div><span className="font-medium">Idioma:</span> {data.language}</div>}
                      {data.hometown && <div><span className="font-medium">Origen:</span> {data.hometown}</div>}
                    </div>

                    {data.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {data.bio}
                      </p>
                    )}
                  </>
                )}

                {/* STUDIO */}
                {contribution.contributableType === 'studio' && (
                  <div className="text-sm text-muted-foreground mb-3">
                    Estudio: <span className="font-medium">{data.name}</span>
                  </div>
                )}

                {/* GENRE */}
                {contribution.contributableType === 'genre' && (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4 text-sm text-muted-foreground">
                      {data.name_es && <div><span className="font-medium">ES:</span> {data.name_es}</div>}
                      {data.name_en && <div><span className="font-medium">EN:</span> {data.name_en}</div>}
                      {data.name_ja && <div><span className="font-medium">JA:</span> {data.name_ja}</div>}
                    </div>

                    {data.description_es && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {data.description_es}
                      </p>
                    )}
                  </>
                )}
              </>
            )}

            <div className="flex items-center gap-4 text-sm mt-3">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Por:</span>
                <span className="font-medium">{contribution.user.displayName || contribution.user.username}</span>
              </div>
              <div className="text-muted-foreground">
                {new Date(contribution.createdAt).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {/* Mostrar estado de asignación */}
            {contribution.assignedToUserId && (
              <Badge variant={contribution.assignedToUserId === user?.id ? "default" : "secondary"} className="text-xs">
                {contribution.assignedToUserId === user?.id 
                  ? '🔒 Tu caso' 
                  : `🔒 ${contribution.assignedToDisplayName || contribution.assignedToUsername}`
                }
              </Badge>
            )}
            
            {/* Botones de asignación solo para casos pendientes */}
            {contribution.status === 'pending' && (
              <>
                {!contribution.assignedToUserId && (
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => onTakeCase(contribution.id)}
                    disabled={assigningId === contribution.id}
                  >
                    {assigningId === contribution.id ? 'Asignando...' : '🎯 Tomar Caso'}
                  </Button>
                )}
                {contribution.assignedToUserId === user?.id && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onReleaseCase(contribution.id)}
                    disabled={assigningId === contribution.id}
                  >
                    {assigningId === contribution.id ? 'Liberando...' : 'Liberar Caso'}
                  </Button>
                )}
              </>
            )}
            
            <Link href={
              isEdit 
                ? `/dashboard/moderator/contributions/edit/${data.editId}`
                : `/dashboard/moderator/contributions/${contribution.id}`
            }>
              <Button variant="outline" size="sm" className="w-full">
                <Eye className="h-4 w-4 mr-2" />
                Revisar
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
