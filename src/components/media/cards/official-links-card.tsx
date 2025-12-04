/**
 * @fileoverview OfficialLinksCard - Tarjeta para mostrar enlaces oficiales y de fans.
 * 
 * Este componente organiza y muestra una lista de enlaces relacionados con un
 * título, agrupados en tres categorías:
 * - Sitios Oficiales (web, redes sociales).
 * - Plataformas de Streaming (Crunchyroll, Netflix, etc.).
 * - Traducciones de Fans (fansubs, scanlations) con estado del proyecto.
 * Cada enlace se muestra con un icono y es clickeable para abrir en una nueva pestaña.
 * 
 * Los proyectos de scan se cargan automáticamente desde la base de datos
 * usando el mediaId y mediaType.
 * 
 * Los usuarios con rol 'scan' pueden agregar sus traducciones directamente.
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import type { OfficialLinks, OfficialLink, FanTranslationLink } from "@/lib/types";
import { Link as LinkIcon, CheckCircle, Pause, XCircle, Ban, Play, Users, Plus, Edit2, Loader2, Search, Trash2, ShieldCheck, ShieldAlert } from "lucide-react";
import Link from "next/link";

// Tipo para proyectos de scan de la API (usuarios scanlators)
interface ScanProject {
  id: number;
  userId: number;
  mediaType: string;
  mediaId: number;
  groupName: string;
  websiteUrl: string | null;
  projectUrl: string;
  status: 'active' | 'hiatus' | 'completed' | 'dropped' | 'licensed';
  language: string;
  scanUsername: string;
  scanAvatar?: string;
  chapterCount: number;
}

// Tipo para enlaces de grupos de scanlation (registrados en la BD)
interface GroupLink {
  id: number;
  url: string;
  status: 'active' | 'hiatus' | 'completed' | 'dropped' | 'licensed';
  language: string;
  group: {
    id: number;
    name: string;
    slug: string;
    websiteUrl?: string;
    logoUrl?: string;
    isVerified: boolean;
  };
}

interface OfficialLinksCardProps {
  links?: OfficialLinks;
  mediaId?: number;
  mediaType?: string;
  mediaTitle?: string;
}

// Estados disponibles para traducciones
const STATUS_OPTIONS = [
  { value: 'active', label: 'Traduciendo' },
  { value: 'hiatus', label: 'En Pausa' },
  { value: 'completed', label: 'Completado' },
  { value: 'dropped', label: 'Abandonado' },
  { value: 'licensed', label: 'Licenciado' },
];

// Tipo para grupos de scanlation en búsqueda
interface ScanlationGroup {
  id: number;
  name: string;
  slug: string;
  websiteUrl?: string;
  isVerified: boolean;
  projectsCount: number;
}

const LinkItem = ({ name, url }: OfficialLink) => (
  <a
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
  >
    <LinkIcon size={14} />
    <span>{name}</span>
  </a>
);

// Configuración de estados para traducciones de fans
const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode; className: string }> = {
  active: { label: 'Traduciendo', variant: 'default', icon: <Play className="h-3 w-3" />, className: 'bg-green-500/10 text-green-600 border-green-500/30' },
  hiatus: { label: 'En Pausa', variant: 'secondary', icon: <Pause className="h-3 w-3" />, className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30' },
  completed: { label: 'Completado', variant: 'outline', icon: <CheckCircle className="h-3 w-3" />, className: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
  dropped: { label: 'Abandonado', variant: 'destructive', icon: <XCircle className="h-3 w-3" />, className: 'bg-red-500/10 text-red-600 border-red-500/30' },
  licensed: { label: 'Licenciado', variant: 'destructive', icon: <Ban className="h-3 w-3" />, className: 'bg-orange-500/10 text-orange-600 border-orange-500/30' },
};

// Componente para mostrar una traducción de fans con estado (link simple)
const FanTranslationItem = ({ link }: { link: OfficialLink | FanTranslationLink }) => {
  const isFanTranslation = 'status' in link;
  const status = isFanTranslation ? statusConfig[link.status || 'active'] : null;
  
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <LinkIcon size={14} />
        <span>{link.name}</span>
      </a>
      {status && (
        <Badge variant={status.variant} className={`text-xs flex items-center gap-1 h-5 ${status.className}`}>
          {status.icon}
          {status.label}
        </Badge>
      )}
      {isFanTranslation && link.scanUsername && (
        <Link 
          href={`/profile/user/${link.scanUsername}`}
          className="text-xs text-muted-foreground hover:text-primary"
        >
          @{link.scanUsername}
        </Link>
      )}
    </div>
  );
};

// Componente para mostrar un proyecto de scan de la base de datos
const ScanProjectItem = ({ 
  project, 
  currentUserId,
  onDelete,
  onStatusChange
}: { 
  project: ScanProject; 
  currentUserId?: number;
  onDelete?: (projectId: number) => void;
  onStatusChange?: (projectId: number, newStatus: string) => void;
}) => {
  const [updating, setUpdating] = useState(false);
  const status = statusConfig[project.status] || statusConfig.active;
  const isOwner = currentUserId === project.userId;
  
  async function handleStatusChange(newStatus: string) {
    if (newStatus === project.status || !onStatusChange) return;
    setUpdating(true);
    try {
      await onStatusChange(project.id, newStatus);
    } finally {
      setUpdating(false);
    }
  }
  
  return (
    <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <a
            href={project.projectUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
          >
            <LinkIcon size={14} />
            <span>{project.groupName || 'Sin nombre'}</span>
          </a>
          <Badge variant="secondary" className="text-xs h-5 bg-green-500/10 text-green-600 border-green-500/30">
            <ShieldCheck className="h-3 w-3 mr-1" />
            Verificado
          </Badge>
          
          {/* Estado editable para el dueño */}
          {isOwner && onStatusChange ? (
            <Select 
              value={project.status} 
              onValueChange={handleStatusChange}
              disabled={updating}
            >
              <SelectTrigger className="h-6 w-auto text-xs gap-1 px-2 border-0 bg-muted">
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
            <Badge className={`text-xs flex items-center gap-1 h-5 ${status.className}`}>
              {status.icon}
              {status.label}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <Link 
            href={`/profile/user/${project.scanUsername}`}
            className="flex items-center gap-1 hover:text-primary"
          >
            <Users size={12} />
            @{project.scanUsername}
          </Link>
          {project.chapterCount > 0 && (
            <span>{project.chapterCount} capítulos</span>
          )}
          {project.websiteUrl && (
            <a
              href={project.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary"
            >
              Sitio web
            </a>
          )}
        </div>
      </div>
      
      {/* Botón eliminar solo para el dueño */}
      {isOwner && onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => onDelete(project.id)}
          title="Quitar este título de mis traducciones"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

// Componente para mostrar un enlace de grupo de scanlation
const GroupLinkItem = ({ 
  link, 
  currentUserId,
  onDelete 
}: { 
  link: GroupLink; 
  currentUserId?: number;
  onDelete?: (linkId: number) => void;
}) => {
  const status = statusConfig[link.status] || statusConfig.active;
  // Por ahora, no tenemos owner_user_id en GroupLink, así que el delete solo lo puede hacer admin
  // TODO: Agregar owner info al GroupLink si es necesario
  
  return (
    <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
          >
            <LinkIcon size={14} />
            <span>{link.group.name}</span>
          </a>
          {link.group.isVerified ? (
            <Badge variant="secondary" className="text-xs h-5 bg-green-500/10 text-green-600 border-green-500/30">
              <ShieldCheck className="h-3 w-3 mr-1" />
              Verificado
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs h-5 bg-orange-500/10 text-orange-600 border-orange-500/30">
              <ShieldAlert className="h-3 w-3 mr-1" />
              No verificado
            </Badge>
          )}
          <Badge className={`text-xs flex items-center gap-1 h-5 ${status.className}`}>
            {status.icon}
            {status.label}
          </Badge>
        </div>
        
        {link.group.websiteUrl && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <a
              href={link.group.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary"
            >
              Sitio web del grupo
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default function OfficialLinksCard({ links, mediaId, mediaType, mediaTitle }: OfficialLinksCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [scanProjects, setScanProjects] = useState<ScanProject[]>([]);
  const [groupLinks, setGroupLinks] = useState<GroupLink[]>([]);
  const [loadingScans, setLoadingScans] = useState(false);
  
  // Estados para el rol de scan
  const [isScanlator, setIsScanlator] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  
  // Estados para el modal de agregar traducción
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingTranslation, setAddingTranslation] = useState(false);
  const [formData, setFormData] = useState({
    groupName: '',
    groupId: undefined as number | undefined,
    projectUrl: '',
    websiteUrl: '',
    status: 'active',
  });
  
  // Estados para búsqueda de grupos
  const [searchResults, setSearchResults] = useState<ScanlationGroup[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Verificar si el usuario tiene rol scan
  useEffect(() => {
    if (user?.id) {
      checkScanRole();
    } else {
      setCheckingRole(false);
      setIsScanlator(false);
    }
  }, [user?.id]);

  async function checkScanRole() {
    try {
      setCheckingRole(true);
      const response = await fetch(`/api/user/${user?.id}/role`);
      if (response.ok) {
        const data = await response.json();
        setIsScanlator(data.isScanlator || data.roles?.includes('scan') || false);
      }
    } catch (error) {
      console.error('Error verificando rol:', error);
    } finally {
      setCheckingRole(false);
    }
  }

  // Cargar proyectos de scan y enlaces de grupos desde la BD
  useEffect(() => {
    if (mediaId && mediaType) {
      loadScanData();
    }
  }, [mediaId, mediaType]);

  async function loadScanData() {
    try {
      setLoadingScans(true);
      
      // Cargar en paralelo: proyectos de usuarios scan + enlaces de grupos
      const [projectsRes, groupLinksRes] = await Promise.all([
        fetch(`/api/scan/projects?mediaType=${mediaType}&mediaId=${mediaId}`),
        fetch(`/api/scan/groups/links?mediaType=${mediaType}&mediaId=${mediaId}`)
      ]);
      
      if (projectsRes.ok) {
        const data = await projectsRes.json();
        setScanProjects(data.projects || []);
      }
      
      if (groupLinksRes.ok) {
        const data = await groupLinksRes.json();
        setGroupLinks(data.links || []);
      }
    } catch (error) {
      console.error('Error cargando datos de scan:', error);
    } finally {
      setLoadingScans(false);
    }
  }

  // Buscar grupos de scanlation
  async function searchGroups(query: string) {
    if (query.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      setSearchLoading(true);
      const response = await fetch(`/api/scan/groups?search=${encodeURIComponent(query)}&limit=5`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.groups || []);
        setShowSearchResults(true);
      }
    } catch (error) {
      console.error('Error buscando grupos:', error);
    } finally {
      setSearchLoading(false);
    }
  }

  // Manejar selección de grupo
  function handleSelectGroup(group: ScanlationGroup) {
    setFormData(prev => ({
      ...prev,
      groupName: group.name,
      groupId: group.id,
      websiteUrl: group.websiteUrl || prev.websiteUrl,
    }));
    setShowSearchResults(false);
  }

  // Agregar traducción
  async function handleAddTranslation() {
    if (!formData.groupName.trim() || !formData.projectUrl.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'El nombre del grupo y la URL del proyecto son requeridos',
      });
      return;
    }

    try {
      setAddingTranslation(true);

      // Crear proyecto de scan para este usuario
      const response = await fetch('/api/scan/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaType,
          mediaId,
          groupName: formData.groupName.trim(),
          projectUrl: formData.projectUrl.trim(),
          websiteUrl: formData.websiteUrl.trim() || null,
          status: formData.status,
          language: 'es',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al agregar traducción');
      }

      toast({
        title: '✅ Traducción agregada',
        description: 'Tu proyecto de traducción se ha registrado correctamente',
      });

      // Recargar datos
      await loadScanData();
      
      // Cerrar modal y resetear form
      setShowAddModal(false);
      setFormData({
        groupName: '',
        groupId: undefined,
        projectUrl: '',
        websiteUrl: '',
        status: 'active',
      });

    } catch (error: any) {
      console.error('Error agregando traducción:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo agregar la traducción',
      });
    } finally {
      setAddingTranslation(false);
    }
  }

  // Eliminar proyecto de scan (solo el dueño puede eliminar)
  async function handleDeleteProject(projectId: number) {
    if (!confirm('¿Estás seguro de quitar este título de tus traducciones?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/scan/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al eliminar proyecto');
      }

      toast({
        title: '✅ Proyecto eliminado',
        description: 'El título ha sido removido de tus traducciones',
      });

      // Recargar datos
      await loadScanData();
    } catch (error: any) {
      console.error('Error eliminando proyecto:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo eliminar el proyecto',
      });
    }
  }

  // Actualizar estado del proyecto de scan (solo el dueño puede cambiar)
  async function handleStatusChange(projectId: number, newStatus: string) {
    try {
      const response = await fetch(`/api/scan/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al actualizar estado');
      }

      toast({
        title: '✅ Estado actualizado',
        description: `El proyecto ahora está en estado: ${STATUS_OPTIONS.find(s => s.value === newStatus)?.label || newStatus}`,
      });

      // Recargar datos
      await loadScanData();
    } catch (error: any) {
      console.error('Error actualizando estado:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo actualizar el estado',
      });
    }
  }

  // Verificar si el usuario ya tiene un proyecto para este media
  const userHasProject = scanProjects.some(p => p.userId === user?.id);

  const officialSites = links?.officialSites ?? [];
  const streamingPlatforms = links?.streamingPlatforms ?? [];
  const fanTranslations = links?.fanTranslations ?? [];

  // Combinar traducciones de fans estáticas con proyectos de la BD
  const hasScanProjects = scanProjects.length > 0;
  const hasGroupLinks = groupLinks.length > 0;
  const hasFanLinks = fanTranslations.length > 0;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Sitios Oficiales y Fan Translations</CardTitle>
          {/* Botón para agregar traducción (solo scanlators) */}
          {isScanlator && !checkingRole && mediaId && mediaType && (
            <Button 
              size="sm" 
              onClick={() => setShowAddModal(true)}
              disabled={userHasProject}
              title={userHasProject ? 'Ya tienes un proyecto para este título' : 'Agregar mi traducción'}
            >
              <Plus className="h-4 w-4 mr-1" />
              {userHasProject ? 'Ya registrado' : 'Agregar mi traducción'}
            </Button>
          )}
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col gap-3">
            <h4 className="font-semibold text-foreground">Sitios Oficiales</h4>
            <div className="flex flex-col gap-2">
              {officialSites.length > 0 ? officialSites.map(link => <LinkItem key={link.name} {...link} />) : (
                <span className="text-sm text-muted-foreground">Sin enlaces</span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <h4 className="font-semibold text-foreground">Plataformas de Streaming</h4>
            <div className="flex flex-col gap-2">
              {streamingPlatforms.length > 0 ? streamingPlatforms.map(link => <LinkItem key={link.name} {...link} />) : (
                <span className="text-sm text-muted-foreground">Sin enlaces</span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <h4 className="font-semibold text-foreground">Traducciones de Fans</h4>
            <div className="flex flex-col gap-3">
              {loadingScans ? (
                <>
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </>
              ) : (
                <>
                  {/* Enlaces de grupos de scanlation registrados */}
                  {groupLinks.map(link => (
                    <GroupLinkItem 
                      key={`group-${link.id}`} 
                      link={link}
                      currentUserId={user?.id}
                    />
                  ))}
                  
                  {/* Proyectos de usuarios scan */}
                  {scanProjects.map(project => (
                    <ScanProjectItem 
                      key={`project-${project.id}`} 
                      project={project}
                      currentUserId={user?.id}
                      onDelete={handleDeleteProject}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                  
                  {/* Links estáticos de fan translations */}
                  {fanTranslations.map((link, idx) => (
                    <FanTranslationItem key={`static-${link.name}-${idx}`} link={link} />
                  ))}
                  
                  {/* Mensaje si no hay nada */}
                  {!hasScanProjects && !hasGroupLinks && !hasFanLinks && (
                    <span className="text-sm text-muted-foreground">Sin enlaces</span>
                  )}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal para agregar traducción */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5" />
              Agregar mi traducción
            </DialogTitle>
            <DialogDescription>
              {mediaTitle ? `Registra tu proyecto de traducción para "${mediaTitle}"` : 'Registra tu proyecto de traducción para este título'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Nombre del grupo con búsqueda */}
            <div className="space-y-2 relative">
              <Label htmlFor="groupName">Nombre del grupo/scan *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="groupName"
                  value={formData.groupName}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, groupName: e.target.value, groupId: undefined }));
                    searchGroups(e.target.value);
                  }}
                  onFocus={() => formData.groupName.length >= 2 && setShowSearchResults(true)}
                  onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                  placeholder="Buscar o escribir nombre del grupo..."
                  className="pl-9"
                />
                {searchLoading && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />
                )}
                {formData.groupId && !searchLoading && (
                  <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                )}
              </div>
              
              {/* Resultados de búsqueda */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 bg-popover border rounded-md shadow-lg max-h-40 overflow-auto">
                  {searchResults.map((group) => (
                    <button
                      key={group.id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSelectGroup(group)}
                      className="w-full px-3 py-2 text-left hover:bg-accent flex items-center justify-between text-sm"
                    >
                      <span className="flex items-center gap-2">
                        {group.name}
                        {group.isVerified && (
                          <Badge variant="secondary" className="text-xs">Verificado</Badge>
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground">{group.projectsCount} proyectos</span>
                    </button>
                  ))}
                </div>
              )}
              
              {formData.groupId && (
                <p className="text-xs text-green-600">✓ Grupo existente seleccionado</p>
              )}
              {formData.groupName && !formData.groupId && formData.groupName.length >= 2 && !searchLoading && (
                <p className="text-xs text-muted-foreground">Se creará un nuevo grupo con este nombre</p>
              )}
            </div>

            {/* URL del proyecto */}
            <div className="space-y-2">
              <Label htmlFor="projectUrl">URL del proyecto *</Label>
              <Input
                id="projectUrl"
                value={formData.projectUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, projectUrl: e.target.value }))}
                placeholder="https://tumangaonline.com/manga/..."
                type="url"
              />
              <p className="text-xs text-muted-foreground">Link directo a tu traducción de este título</p>
            </div>

            {/* URL del sitio web (opcional) */}
            <div className="space-y-2">
              <Label htmlFor="websiteUrl">Sitio web del grupo (opcional)</Label>
              <Input
                id="websiteUrl"
                value={formData.websiteUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, websiteUrl: e.target.value }))}
                placeholder="https://migrupo.com"
                type="url"
              />
            </div>

            {/* Estado del proyecto */}
            <div className="space-y-2">
              <Label htmlFor="status">Estado del proyecto</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddTranslation} disabled={addingTranslation}>
              {addingTranslation ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar traducción
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
