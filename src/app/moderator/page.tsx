'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';

const pendingContributions = [
    { id: 'contrib-1', mediaTitle: 'Honzuki no Gekokujou', mediaType: 'Anime', user: 'FanEditor22', date: '2024-05-20', changeType: 'Correction' },
    { id: 'contrib-2', mediaTitle: 'Berserk', mediaType: 'Manga', user: 'GutsFan91', date: '2024-05-19', changeType: 'New Info' },
    { id: 'contrib-3', mediaTitle: 'Nuevo Manwha de Acción', mediaType: 'Manwha', user: 'NewbieCreator', date: '2024-05-21', changeType: 'New Entry' },
];

export default function ModeratorPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const allowedRoles = ['admin', 'moderator'];
    if (!user) {
      router.push('/login');
    } else if (!allowedRoles.includes(user.role)) {
      console.warn("Acceso denegado: Se requiere rol de moderador o superior.");
    }
  }, [user, router]);

   const allowedRoles = ['admin', 'moderator'];
  if (!user || !allowedRoles.includes(user.role)) {
    return (
        <main className="container mx-auto p-2 sm:p-6">
            <Card>
                <CardHeader>
                    <CardTitle>Acceso Denegado</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Necesitas ser moderador para ver esta página.</p>
                </CardContent>
            </Card>
        </main>
    );
  }

  return (
    <main className="container mx-auto p-2 sm:p-6 space-y-8">
        <Card>
            <CardHeader>
                <CardTitle>Panel de Moderador</CardTitle>
                <CardDescription>Bienvenido, {user.name}. Aquí puedes moderar el contenido y revisar las contribuciones de la comunidad.</CardDescription>
            </CardHeader>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Contribuciones Pendientes</CardTitle>
                <CardDescription>Revisa las ediciones y nuevas entradas enviadas por los usuarios.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Título</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Usuario</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pendingContributions.map((contrib) => (
                            <TableRow key={contrib.id}>
                                <TableCell className="font-medium">{contrib.mediaTitle}</TableCell>
                                <TableCell><Badge variant="secondary">{contrib.mediaType}</Badge></TableCell>
                                <TableCell>{contrib.user}</TableCell>
                                <TableCell>{contrib.date}</TableCell>
                                <TableCell className="flex gap-2">
                                    <Button variant="outline" size="sm">Revisar</Button>
                                    <Button variant="ghost" size="icon" className="text-green-600 hover:text-green-700 hover:bg-green-100">
                                        <Check className="h-4 w-4" />
                                    </Button>
                                     <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-100">
                                        <X className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </main>
  );
}
