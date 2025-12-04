/**
 * @fileoverview Dashboard Principal del Administrador
 * 
 * Muestra estadísticas completas del sistema:
 * - Usuarios (totales, activos, nuevos, verificados, con 2FA)
 * - Contenido media (7 tipos con distribución)
 * - Personajes, actores de voz, staff, estudios
 * - Interacciones (reviews, comentarios, favoritos, listas)
 * - Contribuciones y reportes
 * - Actividad reciente y crecimiento
 */
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  UserPlus,
  UserCheck,
  Shield,
  FileText, 
  TrendingUp,
  Activity,
  Database,
  Clock,
  Star,
  MessageSquare,
  Heart,
  ListTodo,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Film,
  BookOpen,
  Tv,
  Palette,
  UserCircle,
  Mic,
  Building2,
  Award
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface DashboardStats {
  users: {
    total: number;
    active: number;
    newToday: number;
    newThisWeek: number;
    newThisMonth: number;
    verified: number;
    with2FA: number;
    activityByDay: { date: string; count: number }[];
    monthlyGrowth: { month: string; count: number }[];
  };
  media: {
    anime: number;
    manga: number;
    novels: number;
    donghua: number;
    manhua: number;
    manhwa: number;
    fanComics: number;
    total: number;
    animeByStatus: { status: string; count: number }[];
    animeByFormat: { format: string; count: number }[];
  };
  characters: {
    total: number;
    voiceActors: number;
    staff: number;
    studios: number;
  };
  interactions: {
    reviews: { total: number; thisWeek: number };
    comments: { total: number; thisWeek: number };
    favorites: number;
    lists: number;
    listItems: number;
    follows: number;
    ratingsDistribution: { rating: number; count: number }[];
  };
  contributions: {
    pending: number;
    approved: number;
    rejected: number;
    total: number;
    thisWeek: number;
    topContributors: {
      username: string;
      displayName: string;
      avatarUrl: string | null;
      total: number;
      approved: number;
    }[];
  };
  reports: {
    contentReports: { pending: number; total: number };
    reviewReports: { pending: number; total: number };
  };
  topGenres: { name: string; count: number }[];
  recentActivity: { type: string; description: string; date: string }[];
}

const mediaTypeIcons: { [key: string]: React.ElementType } = {
  anime: Tv,
  manga: BookOpen,
  novels: BookOpen,
  donghua: Film,
  manhua: Palette,
  manhwa: Palette,
  fanComics: Palette,
};

const mediaTypeColors: { [key: string]: string } = {
  anime: 'bg-blue-500',
  manga: 'bg-purple-500',
  novels: 'bg-amber-500',
  donghua: 'bg-red-500',
  manhua: 'bg-green-500',
  manhwa: 'bg-pink-500',
  fanComics: 'bg-orange-500',
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard-stats');
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.details || 'Error al cargar estadísticas');
      }
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Error al cargar estadísticas</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <button 
          onClick={() => { setLoading(true); setError(null); fetchStats(); }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const verifiedPercent = stats.users.total > 0 
    ? Math.round((stats.users.verified / stats.users.total) * 100) 
    : 0;

  const activePercent = stats.users.total > 0 
    ? Math.round((stats.users.active / stats.users.total) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard de Administración</h1>
        <p className="text-muted-foreground mt-1">
          Visión general completa del sistema y estadísticas en tiempo real
        </p>
      </div>

      {/* ========== USUARIOS ========== */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Usuarios
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.users.total.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.users.active} activos ({activePercent}%)
              </p>
              <Progress value={activePercent} className="mt-2 h-1" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nuevos Usuarios</CardTitle>
              <UserPlus className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.users.newThisWeek}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.users.newToday} hoy • {stats.users.newThisMonth} este mes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verificados</CardTitle>
              <UserCheck className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.users.verified.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {verifiedPercent}% del total
              </p>
              <Progress value={verifiedPercent} className="mt-2 h-1" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Con 2FA</CardTitle>
              <Shield className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.users.with2FA}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Autenticación en dos pasos
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ========== CONTENIDO MEDIA ========== */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Database className="h-5 w-5" />
          Contenido Media ({stats.media.total.toLocaleString()} títulos)
        </h2>
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          {[
            { key: 'anime', label: 'Anime', count: stats.media.anime },
            { key: 'manga', label: 'Manga', count: stats.media.manga },
            { key: 'novels', label: 'Novelas', count: stats.media.novels },
            { key: 'donghua', label: 'Donghua', count: stats.media.donghua },
            { key: 'manhua', label: 'Manhua', count: stats.media.manhua },
            { key: 'manhwa', label: 'Manhwa', count: stats.media.manhwa },
            { key: 'fanComics', label: 'Fan Comics', count: stats.media.fanComics },
          ].map((item) => {
            const Icon = mediaTypeIcons[item.key] || Film;
            return (
              <Card key={item.key}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${mediaTypeColors[item.key]} text-white`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className="text-xl font-bold">{item.count.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Anime stats breakdown */}
        <div className="grid gap-4 md:grid-cols-2 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Anime por Estado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.media.animeByStatus.slice(0, 5).map((item) => (
                  <div key={item.status} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{item.status.replace(/_/g, ' ')}</span>
                    <Badge variant="secondary">{item.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Anime por Formato</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.media.animeByFormat.slice(0, 5).map((item) => (
                  <div key={item.format} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{item.format.replace(/_/g, ' ')}</span>
                    <Badge variant="secondary">{item.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ========== PERSONAJES Y STAFF ========== */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <UserCircle className="h-5 w-5" />
          Personajes y Staff
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500 text-white">
                  <UserCircle className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Personajes</p>
                  <p className="text-xl font-bold">{stats.characters.total.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-rose-500 text-white">
                  <Mic className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Actores de Voz</p>
                  <p className="text-xl font-bold">{stats.characters.voiceActors.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-teal-500 text-white">
                  <Award className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Staff</p>
                  <p className="text-xl font-bold">{stats.characters.staff.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500 text-white">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Estudios</p>
                  <p className="text-xl font-bold">{stats.characters.studios.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ========== INTERACCIONES ========== */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Interacciones de Usuarios
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reviews</CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.interactions.reviews.total.toLocaleString()}</div>
              <p className="text-xs text-green-600 mt-1">
                +{stats.interactions.reviews.thisWeek} esta semana
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comentarios</CardTitle>
              <MessageSquare className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.interactions.comments.total.toLocaleString()}</div>
              <p className="text-xs text-green-600 mt-1">
                +{stats.interactions.comments.thisWeek} esta semana
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Favoritos</CardTitle>
              <Heart className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.interactions.favorites.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.interactions.follows} follows entre usuarios
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Listas</CardTitle>
              <ListTodo className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.interactions.lists.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.interactions.listItems.toLocaleString()} items en listas
              </p>
            </CardContent>
          </Card>

          {/* Ratings Distribution */}
          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Distribución de Ratings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-1 h-20">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => {
                  const ratingData = stats.interactions.ratingsDistribution.find(r => r.rating === rating);
                  const count = ratingData?.count || 0;
                  const maxCount = Math.max(...stats.interactions.ratingsDistribution.map(r => r.count), 1);
                  const height = (count / maxCount) * 100;
                  return (
                    <div key={rating} className="flex-1 flex flex-col items-center gap-1">
                      <div 
                        className="w-full bg-yellow-400 rounded-t transition-all"
                        style={{ height: `${Math.max(height, 2)}%` }}
                        title={`${rating}: ${count} reviews`}
                      />
                      <span className="text-xs text-muted-foreground">{rating}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ========== CONTRIBUCIONES Y REPORTES ========== */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Contribuciones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Contribuciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Clock className="h-5 w-5 mx-auto text-yellow-600 mb-1" />
                <p className="text-xl font-bold">{stats.contributions.pending}</p>
                <p className="text-xs text-muted-foreground">Pendientes</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="h-5 w-5 mx-auto text-green-600 mb-1" />
                <p className="text-xl font-bold">{stats.contributions.approved}</p>
                <p className="text-xs text-muted-foreground">Aprobadas</p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <XCircle className="h-5 w-5 mx-auto text-red-600 mb-1" />
                <p className="text-xl font-bold">{stats.contributions.rejected}</p>
                <p className="text-xs text-muted-foreground">Rechazadas</p>
              </div>
            </div>

            <div className="pt-2">
              <p className="text-sm font-medium mb-2">Top Contribuidores</p>
              <div className="space-y-2">
                {stats.contributions.topContributors.map((user, index) => (
                  <div key={user.username} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-4">{index + 1}</span>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatarUrl || undefined} />
                      <AvatarFallback>{(user.displayName || user.username)[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.displayName || user.username}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.approved}/{user.total} aprobadas
                      </p>
                    </div>
                  </div>
                ))}
                {stats.contributions.topContributors.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    No hay contribuidores aún
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reportes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Reportes Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Contenido</span>
                  {stats.reports.contentReports.pending > 0 && (
                    <Badge variant="destructive">{stats.reports.contentReports.pending}</Badge>
                  )}
                </div>
                <p className="text-2xl font-bold">{stats.reports.contentReports.pending}</p>
                <p className="text-xs text-muted-foreground">
                  de {stats.reports.contentReports.total} totales
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Reviews</span>
                  {stats.reports.reviewReports.pending > 0 && (
                    <Badge variant="destructive">{stats.reports.reviewReports.pending}</Badge>
                  )}
                </div>
                <p className="text-2xl font-bold">{stats.reports.reviewReports.pending}</p>
                <p className="text-xs text-muted-foreground">
                  de {stats.reports.reviewReports.total} totales
                </p>
              </div>
            </div>

            <div className="pt-2">
              <p className="text-sm font-medium mb-2">Top Géneros</p>
              <div className="flex flex-wrap gap-2">
                {stats.topGenres.slice(0, 8).map((genre) => (
                  <Badge key={genre.name} variant="outline">
                    {genre.name} ({genre.count})
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ========== ACTIVIDAD RECIENTE ========== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Actividad Reciente
          </CardTitle>
          <CardDescription>
            Últimas acciones en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay actividad reciente
            </p>
          ) : (
            <div className="space-y-3">
              {stats.recentActivity.map((activity, index) => {
                const getIcon = () => {
                  switch (activity.type) {
                    case 'user': return <UserPlus className="h-4 w-4 text-green-500" />;
                    case 'review': return <Star className="h-4 w-4 text-yellow-500" />;
                    case 'comment': return <MessageSquare className="h-4 w-4 text-blue-500" />;
                    default: return <Activity className="h-4 w-4 text-muted-foreground" />;
                  }
                };
                return (
                  <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                    {getIcon()}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{activity.description}</p>
                      <span className="text-xs text-muted-foreground">
                        {new Date(activity.date).toLocaleString('es-ES')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ========== CRECIMIENTO MENSUAL ========== */}
      {stats.users.monthlyGrowth.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Crecimiento de Usuarios (Últimos 6 meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-32">
              {stats.users.monthlyGrowth.map((month) => {
                const maxCount = Math.max(...stats.users.monthlyGrowth.map(m => m.count), 1);
                const height = (month.count / maxCount) * 100;
                return (
                  <div key={month.month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-medium">{month.count}</span>
                    <div 
                      className="w-full bg-primary rounded-t transition-all"
                      style={{ height: `${Math.max(height, 5)}%` }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {month.month.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
