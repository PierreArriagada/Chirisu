'use client';

import { useState, useEffect } from 'react';
import { Trophy, Loader2, Medal } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface Contributor {
  user_id: number;
  username: string;
  total_contributions: number;
  approved: number;
  pending: number;
  rejected: number;
  approval_rate: number;
}

export default function TopContributorsPage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('all');
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContributors();
  }, [period]);

  const loadContributors = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/top-contributors?period=${period}`);
      const data = await response.json();
      setContributors(data.contributors || []);
    } catch (error) {
      console.error('Error al cargar contribuyentes:', error);
      setContributors([]);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>;
  };

  const getApprovalRateColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Top Contribuyentes</h1>
        <p className="text-muted-foreground mt-2">
          Usuarios más activos y sus estadísticas de contribución
        </p>
      </div>

      <Tabs value={period} onValueChange={(v) => setPeriod(v as any)}>
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="week">Esta Semana</TabsTrigger>
          <TabsTrigger value="month">Este Mes</TabsTrigger>
          <TabsTrigger value="all">Todo el Tiempo</TabsTrigger>
        </TabsList>

        <TabsContent value={period} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Ranking de Contribuyentes
              </CardTitle>
              <CardDescription>
                {period === 'week' && 'Contribuciones de los últimos 7 días'}
                {period === 'month' && 'Contribuciones de los últimos 30 días'}
                {period === 'all' && 'Todas las contribuciones desde el inicio'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : contributors.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Rango</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                      <TableHead className="text-center">Aprobadas</TableHead>
                      <TableHead className="text-center">Pendientes</TableHead>
                      <TableHead className="text-center">Rechazadas</TableHead>
                      <TableHead className="text-center">Tasa Aprobación</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contributors.map((contributor, index) => (
                      <TableRow key={contributor.user_id}>
                        <TableCell>
                          <div className="flex items-center justify-center">
                            {getRankIcon(index)}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          <Link
                            href={`/u/${contributor.username}`}
                            className="hover:underline"
                          >
                            {contributor.username}
                          </Link>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">
                            {contributor.total_contributions}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center text-green-600">
                          {contributor.approved}
                        </TableCell>
                        <TableCell className="text-center text-yellow-600">
                          {contributor.pending}
                        </TableCell>
                        <TableCell className="text-center text-red-600">
                          {contributor.rejected}
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={`font-semibold ${getApprovalRateColor(
                              contributor.approval_rate
                            )}`}
                          >
                            {contributor.approval_rate.toFixed(1)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay contribuciones en este período</p>
                </div>
              )}
            </CardContent>
          </Card>

          {contributors.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Total de Contribuyentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{contributors.length}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Total de Contribuciones</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {contributors.reduce((sum, c) => sum + c.total_contributions, 0)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tasa Promedio de Aprobación</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {(
                      contributors.reduce((sum, c) => sum + c.approval_rate, 0) /
                      contributors.length
                    ).toFixed(1)}
                    %
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
