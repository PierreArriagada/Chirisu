'use client';

/**
 * Página de Perfil Público de Usuario
 * Ruta: /profile/user/[username]
 * 
 * Muestra información pública del usuario:
 * - Avatar, nombre, bio
 * - Estadísticas (reviews, listas, contribuciones)
 * - Reviews recientes
 * - Listas públicas
 * - NO muestra email ni información privada
 */

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Star, 
  ListChecks, 
  PenTool,
  TrendingUp,
  Cake,
  Award,
  Copy,
  Check,
  BookOpen
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { ScanlatorProjectsCard } from '@/components/user';

interface UserProfile {
  id: number;
  username: string;
  trackingId: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  joinedAt: string;
  role: string;
  dateOfBirth: string | null;
  stats: {
    totalReviews: number;
    avgScore: number;
    totalLists: number;
    publicLists: number;
    totalContributions: number;
    approvedContributions: number;
  };
  recentReviews: any[];
  publicLists: any[];
}

export default function UserPublicProfilePage() {
  const params = useParams();
  const username = params?.username as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!username) return;
    loadProfile();
  }, [username]);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/user/profile/${username}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 404) {
          setError('Usuario no encontrado');
        } else {
          setError('Error al cargar el perfil');
        }
        return;
      }

      const data = await response.json();
      setProfile(data.user);
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const copyTrackingId = async () => {
    if (!profile?.trackingId) return;
    
    try {
      await navigator.clipboard.writeText(profile.trackingId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error al copiar ID:', error);
    }
  };

  const getRoleBadge = (role: string) => {
    const roleConfig: Record<string, { label: string; variant: any; icon: any }> = {
      admin: { label: 'Administrador', variant: 'destructive', icon: Award },
      moderator: { label: 'Moderador', variant: 'default', icon: Award },
      user: { label: 'Usuario', variant: 'secondary', icon: null },
    };

    const config = roleConfig[role] || roleConfig.user;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {Icon && <Icon className="h-3 w-3" />}
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-lg text-muted-foreground">{error || 'Usuario no encontrado'}</p>
            <Button asChild className="mt-4">
              <Link href="/">Volver al inicio</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header del perfil */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <Avatar className="h-32 w-32 border-4 border-background">
              <AvatarImage src={profile.avatarUrl || undefined} alt={profile.displayName} />
              <AvatarFallback className="text-3xl">
                {getInitials(profile.displayName)}
              </AvatarFallback>
            </Avatar>

            {/* Información del usuario */}
            <div className="flex-1 space-y-3">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-3xl font-bold">{profile.displayName}</h1>
                  {getRoleBadge(profile.role)}
                </div>
                <p className="text-muted-foreground">@{profile.username}</p>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono text-muted-foreground">
                    ID: {profile.trackingId}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={copyTrackingId}
                    title="Copiar ID de usuario"
                  >
                    {copied ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>

              {profile.bio && (
                <p className="text-sm">{profile.bio}</p>
              )}

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Miembro desde {formatDistanceToNow(new Date(profile.joinedAt), { 
                      addSuffix: true, 
                      locale: es 
                    })}
                  </span>
                </div>

                {profile.dateOfBirth && (
                  <div className="flex items-center gap-1">
                    <Cake className="h-4 w-4" />
                    <span>{new Date(profile.dateOfBirth).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card de Proyectos de Scanlation - primero, prominente para usuarios scan */}
      <ScanlatorProjectsCard userId={profile.id} isOwnProfile={false} />

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Star className="h-4 w-4" />
              Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.stats.totalReviews}</div>
            {profile.stats.avgScore > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Promedio: {profile.stats.avgScore}/10
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ListChecks className="h-4 w-4" />
              Listas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.stats.publicLists}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {profile.stats.totalLists} en total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <PenTool className="h-4 w-4" />
              Contribuciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.stats.totalContributions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {profile.stats.approvedContributions} aprobadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Actividad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {profile.stats.totalReviews + profile.stats.totalContributions}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Acciones totales
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Contenido en tabs */}
      <Tabs defaultValue="reviews" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="lists">Listas Públicas</TabsTrigger>
        </TabsList>

        <TabsContent value="reviews" className="space-y-4">
          {profile.recentReviews.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Este usuario aún no ha escrito reviews
              </CardContent>
            </Card>
          ) : (
            profile.recentReviews.map((review) => (
              <Card key={review.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {review.media?.title || 'Título desconocido'}
                      </CardTitle>
                      <CardDescription>
                        {formatDistanceToNow(new Date(review.created_at), { 
                          addSuffix: true, 
                          locale: es 
                        })}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-bold">{review.overall_score}/10</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap line-clamp-3">
                    {review.content}
                  </p>
                  {review.media?.slug && (
                    <Button asChild variant="link" className="mt-2 px-0">
                      <Link href={`/${review.reviewable_type}/${review.media.slug}`}>
                        Ver en {review.reviewable_type}
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="lists" className="space-y-4">
          {profile.publicLists.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Este usuario no tiene listas públicas
              </CardContent>
            </Card>
          ) : (
            profile.publicLists.map((list) => (
              <Card key={list.id}>
                <CardHeader>
                  <CardTitle>{list.name}</CardTitle>
                  <CardDescription>
                    {list.description || 'Sin descripción'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {list.items_count} {list.items_count === 1 ? 'elemento' : 'elementos'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Actualizado {formatDistanceToNow(new Date(list.updated_at), { 
                        addSuffix: true, 
                        locale: es 
                      })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
