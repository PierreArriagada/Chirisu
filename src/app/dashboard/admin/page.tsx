/**
 * @fileoverview Dashboard Principal del Administrador
 * 
 * Muestra estadísticas generales del sistema:
 * - Usuarios activos
 * - Nuevos usuarios (últimos 7 días, 30 días)
 * - Contribuciones pendientes
 * - Total de contenido por tipo
 * - Actividad reciente
 */
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  UserPlus, 
  FileText, 
  TrendingUp,
  Activity,
  Database,
  Clock
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number; // últimos 30 días
  newUsersWeek: number;
  newUsersMonth: number;
  pendingContributions: number;
  totalContributions: number;
  contentByType: {
    anime: number;
    manga: number;
    novels: number;
    donghua: number;
    manhua: number;
    manhwa: number;
    fan_comic: number;
  };
  recentActivity: {
    date: string;
    type: string;
    description: string;
  }[];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard-stats');
      if (!response.ok) throw new Error('Error al cargar estadísticas');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error:', error);
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
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Error al cargar estadísticas</p>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Usuarios Totales',
      value: stats.totalUsers.toLocaleString(),
      description: `${stats.activeUsers} activos (últimos 30 días)`,
      icon: Users,
      trend: '+' + ((stats.activeUsers / stats.totalUsers) * 100).toFixed(1) + '%'
    },
    {
      title: 'Nuevos Usuarios',
      value: stats.newUsersWeek.toLocaleString(),
      description: `${stats.newUsersMonth} este mes`,
      icon: UserPlus,
      trend: '+' + stats.newUsersWeek
    },
    {
      title: 'Contribuciones',
      value: stats.pendingContributions.toLocaleString(),
      description: `${stats.totalContributions} totales`,
      icon: FileText,
      trend: 'Pendientes'
    },
    {
      title: 'Contenido Total',
      value: Object.values(stats.contentByType).reduce((a, b) => a + b, 0).toLocaleString(),
      description: 'Títulos en la base de datos',
      icon: Database,
      trend: '7 tipos'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard de Administración</h1>
        <p className="text-muted-foreground mt-1">
          Visión general del sistema y estadísticas
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {card.description}
                </p>
                <div className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">
                  {card.trend}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Content by Type */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Contenido por Tipo
          </CardTitle>
          <CardDescription>
            Distribución de títulos en la base de datos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Object.entries(stats.contentByType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="text-sm font-medium capitalize">{type}</p>
                  <p className="text-xs text-muted-foreground">títulos</p>
                </div>
                <div className="text-2xl font-bold">{count}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
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
              {stats.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{activity.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">
                        {activity.type}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(activity.date).toLocaleString('es-ES')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
