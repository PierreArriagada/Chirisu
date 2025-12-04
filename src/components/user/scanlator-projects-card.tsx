/**
 * ScanlatorProjectsCard - Componente para mostrar proyectos de scanlation en perfil
 * Solo visible para usuarios con rol 'scan'
 * Organizado por los 7 tipos de media con opción de ver más
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  BookOpen, 
  Film, 
  Clock, 
  Link2, 
  Plus, 
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Pause,
  CheckCircle,
  XCircle,
  Ban,
  Play,
  Tv,
  FileText,
  Sparkles,
  Edit2,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// Tipos de media - orden fijo para mostrar
type MediaType = 'anime' | 'manga' | 'manhwa' | 'manhua' | 'novel' | 'donghua' | 'fan_comic';

// Orden de visualización de los tipos
const MEDIA_TYPE_ORDER: MediaType[] = ['anime', 'manga', 'manhwa', 'manhua', 'novel', 'donghua', 'fan_comic'];

interface ScanlationProject {
  id: number;
  mediaType: MediaType;
  mediaId: number;
  mediaTitle: string;
  mediaSlug: string;
  mediaCover?: string;
  groupName: string;
  projectUrl: string;
  websiteUrl: string | null;
  status: 'active' | 'hiatus' | 'completed' | 'dropped' | 'licensed';
  language: string;
  lastChapterAt: string | null;
  chapterCount: number;
  createdAt: string;
}

interface ScanlatorProjectsCardProps {
  userId: number;
  isOwnProfile?: boolean;
}

// Iconos por tipo de media
const mediaTypeIcons: Record<MediaType, React.ReactNode> = {
  anime: <Tv className="h-4 w-4" />,
  manga: <BookOpen className="h-4 w-4" />,
  manhwa: <BookOpen className="h-4 w-4" />,
  manhua: <BookOpen className="h-4 w-4" />,
  novel: <FileText className="h-4 w-4" />,
  donghua: <Film className="h-4 w-4" />,
  fan_comic: <Sparkles className="h-4 w-4" />,
};

// Labels para tipos de media
const mediaTypeLabels: Record<MediaType, string> = {
  anime: 'Anime',
  manga: 'Manga',
  manhwa: 'Manhwa',
  manhua: 'Manhua',
  novel: 'Novela',
  donghua: 'Donghua',
  fan_comic: 'Fan Comic',
};

// Colores por tipo de media
const mediaTypeColors: Record<MediaType, string> = {
  anime: 'text-blue-500',
  manga: 'text-pink-500',
  manhwa: 'text-purple-500',
  manhua: 'text-red-500',
  novel: 'text-amber-500',
  donghua: 'text-cyan-500',
  fan_comic: 'text-green-500',
};

// Estados con sus badges
const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode; color: string }> = {
  active: { label: 'Traduciendo', variant: 'default', icon: <Play className="h-3 w-3" />, color: 'bg-green-500' },
  hiatus: { label: 'En Pausa', variant: 'secondary', icon: <Pause className="h-3 w-3" />, color: 'bg-yellow-500' },
  completed: { label: 'Completado', variant: 'outline', icon: <CheckCircle className="h-3 w-3" />, color: 'bg-blue-500' },
  dropped: { label: 'Abandonado', variant: 'destructive', icon: <XCircle className="h-3 w-3" />, color: 'bg-red-500' },
  licensed: { label: 'Licenciado', variant: 'destructive', icon: <Ban className="h-3 w-3" />, color: 'bg-orange-500' },
};

// Estados disponibles para cambiar
const STATUS_OPTIONS = [
  { value: 'active', label: 'Traduciendo' },
  { value: 'hiatus', label: 'En Pausa' },
  { value: 'completed', label: 'Completado' },
  { value: 'dropped', label: 'Abandonado' },
  { value: 'licensed', label: 'Licenciado' },
];

// Cantidad de proyectos a mostrar por tipo antes de "ver más"
const INITIAL_SHOW_COUNT = 3;

interface ScanlatorProjectsCardProps {
  userId: number;
  isOwnProfile?: boolean;
  onStatusChange?: () => void;
}

export function ScanlatorProjectsCard({ userId, isOwnProfile = false, onStatusChange }: ScanlatorProjectsCardProps) {
  const { toast } = useToast();
  const [projects, setProjects] = useState<ScanlationProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isScanlator, setIsScanlator] = useState(false);
  const [expandedTypes, setExpandedTypes] = useState<Set<MediaType>>(new Set());

  useEffect(() => {
    loadProjects();
  }, [userId]);

  async function loadProjects() {
    try {
      setLoading(true);
      setError(null);

      // Primero verificar si el usuario tiene rol de scanlator
      const roleResponse = await fetch(`/api/user/${userId}/role`);
      if (roleResponse.ok) {
        const roleData = await roleResponse.json();
        console.log('🔍 Role data for user', userId, ':', roleData);
        const hasScanRole = roleData.roles?.includes('scan') || roleData.role === 'scan' || roleData.isScanlator === true;
        console.log('🎯 Has scan role:', hasScanRole);
        setIsScanlator(hasScanRole);

        if (!hasScanRole) {
          setLoading(false);
          return;
        }
      } else {
        console.error('❌ Error fetching role:', roleResponse.status);
        setLoading(false);
        return;
      }

      // Cargar proyectos del usuario
      const response = await fetch(`/api/scan/projects?userId=${userId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setProjects([]);
          return;
        }
        throw new Error('Error al cargar proyectos');
      }

      const data = await response.json();
      setProjects(data.projects || []);
    } catch (err: any) {
      console.error('Error cargando proyectos de scanlation:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const toggleExpanded = (type: MediaType) => {
    setExpandedTypes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  };

  // Si no es scanlator, no mostrar nada
  if (!loading && !isScanlator) {
    return null;
  }

  // Loading skeleton
  if (loading) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="max-w-4xl mx-auto border-destructive">
        <CardContent className="py-8 text-center">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-destructive">{error}</p>
          <Button variant="outline" className="mt-4" onClick={loadProjects}>
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Agrupar proyectos por tipo de media
  const projectsByType = projects.reduce((acc, project) => {
    const type = project.mediaType;
    if (!acc[type]) acc[type] = [];
    acc[type].push(project);
    return acc;
  }, {} as Record<MediaType, ScanlationProject[]>);

  // Ordenar los tipos según el orden predefinido
  const orderedTypes = MEDIA_TYPE_ORDER.filter(type => projectsByType[type]?.length > 0);

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Traducciones
          </CardTitle>
          <CardDescription>
            {isOwnProfile 
              ? 'Tus proyectos de scanlation/fansub' 
              : 'Traducciones de este usuario'}
          </CardDescription>
        </div>
        {isOwnProfile && (
          <Button size="sm" asChild>
            <Link href="/scan/projects/new">
              <Plus className="h-4 w-4 mr-1" />
              Nuevo Proyecto
            </Link>
          </Button>
        )}
      </CardHeader>
      
      <CardContent>
        {projects.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay proyectos de traducción registrados.</p>
            {isOwnProfile && (
              <Button variant="outline" className="mt-4" asChild>
                <Link href="/scan/projects/new">
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar mi primer proyecto
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Estadísticas rápidas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold">{projects.length}</div>
                <div className="text-xs text-muted-foreground">Total Proyectos</div>
              </div>
              <div className="bg-green-500/10 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {projects.filter(p => p.status === 'active').length}
                </div>
                <div className="text-xs text-muted-foreground">Traduciendo</div>
              </div>
              <div className="bg-blue-500/10 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {projects.filter(p => p.status === 'completed').length}
                </div>
                <div className="text-xs text-muted-foreground">Completados</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold">{orderedTypes.length}</div>
                <div className="text-xs text-muted-foreground">Tipos de Media</div>
              </div>
            </div>

            {/* Lista organizada por tipo de media */}
            <div className="space-y-4">
              {orderedTypes.map(type => {
                const typeProjects = projectsByType[type];
                const isExpanded = expandedTypes.has(type);
                const hasMore = typeProjects.length > INITIAL_SHOW_COUNT;
                const displayProjects = isExpanded ? typeProjects : typeProjects.slice(0, INITIAL_SHOW_COUNT);

                return (
                  <div key={type} className="border rounded-lg overflow-hidden">
                    {/* Header del tipo */}
                    <div className={`flex items-center justify-between px-4 py-3 bg-muted/30`}>
                      <h3 className={`font-semibold flex items-center gap-2 ${mediaTypeColors[type]}`}>
                        {mediaTypeIcons[type]}
                        {mediaTypeLabels[type]}
                        <Badge variant="secondary" className="ml-2">
                          {typeProjects.length}
                        </Badge>
                      </h3>
                      {hasMore && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => toggleExpanded(type)}
                          className="text-xs"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="h-4 w-4 mr-1" />
                              Ver menos
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4 mr-1" />
                              Ver más ({typeProjects.length - INITIAL_SHOW_COUNT})
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                    
                    {/* Lista de proyectos */}
                    <div className="divide-y">
                      {displayProjects.map(project => (
                        <ProjectItem 
                          key={project.id} 
                          project={project} 
                          isOwnProfile={isOwnProfile}
                          onStatusChange={async (newStatus) => {
                            try {
                              const response = await fetch(`/api/scan/projects/${project.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ status: newStatus })
                              });
                              if (response.ok) {
                                toast({
                                  title: '✅ Estado actualizado',
                                  description: `El proyecto ahora está "${STATUS_OPTIONS.find(s => s.value === newStatus)?.label}"`
                                });
                                loadProjects();
                                onStatusChange?.();
                              } else {
                                throw new Error('Error al actualizar');
                              }
                            } catch (err) {
                              toast({
                                title: 'Error',
                                description: 'No se pudo actualizar el estado',
                                variant: 'destructive'
                              });
                            }
                          }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Componente para cada proyecto
function ProjectItem({ 
  project, 
  isOwnProfile,
  onStatusChange 
}: { 
  project: ScanlationProject; 
  isOwnProfile: boolean;
  onStatusChange?: (newStatus: string) => void;
}) {
  const [updating, setUpdating] = useState(false);
  const status = statusConfig[project.status] || statusConfig.active;
  
  // Calcular días desde última actualización
  const daysSinceUpdate = project.lastChapterAt 
    ? Math.floor((Date.now() - new Date(project.lastChapterAt).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  async function handleStatusChange(newStatus: string) {
    if (newStatus === project.status) return;
    setUpdating(true);
    try {
      await onStatusChange?.(newStatus);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors">
      {/* Cover del media */}
      {project.mediaCover && (
        <div className="flex-shrink-0 w-12 h-16 rounded overflow-hidden bg-muted">
          <Image
            src={project.mediaCover}
            alt={project.mediaTitle}
            width={48}
            height={64}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Info del proyecto */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Link 
            href={`/${project.mediaType}/${project.mediaSlug}`}
            className="font-medium hover:text-primary truncate"
          >
            {project.mediaTitle}
          </Link>
          
          {/* Estado editable o solo badge */}
          {isOwnProfile && onStatusChange ? (
            <Select 
              value={project.status} 
              onValueChange={handleStatusChange}
              disabled={updating}
            >
              <SelectTrigger className="h-6 w-auto text-xs gap-1 px-2">
                {updating ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    {status.icon}
                    <SelectValue />
                  </>
                )}
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <span className="flex items-center gap-1">
                      {statusConfig[opt.value]?.icon}
                      {opt.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Badge variant={status.variant} className="text-xs flex items-center gap-1 shrink-0">
              {status.icon}
              {status.label}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
          {project.groupName && (
            <span className="font-medium">{project.groupName}</span>
          )}
          
          <span className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            {project.chapterCount} caps
          </span>
          
          {project.lastChapterAt && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {daysSinceUpdate === 0 
                ? 'Hoy' 
                : daysSinceUpdate === 1 
                  ? 'Ayer' 
                  : daysSinceUpdate && daysSinceUpdate < 30
                    ? `Hace ${daysSinceUpdate} días`
                    : daysSinceUpdate && `Hace ${Math.floor(daysSinceUpdate / 30)} meses`}
            </span>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-1">
        {project.projectUrl && (
          <Button variant="ghost" size="sm" asChild>
            <a href={project.projectUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        )}
        
        {isOwnProfile && (
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/scan/projects/${project.id}`}>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

export default ScanlatorProjectsCard;
