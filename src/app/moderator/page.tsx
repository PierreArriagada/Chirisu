'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Trash2, ShieldOff } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReviewContributionDialog from '@/components/moderation/review-contribution-dialog';
import type { Contribution, ReportedComment } from '@/lib/types';


const pendingContributions: Contribution[] = [
    { 
        id: 'contrib-1', 
        mediaTitle: 'Honzuki no Gekokujou', 
        mediaType: 'Anime', 
        user: { id: 'user-1', name: 'FanEditor22' }, 
        date: '2024-05-20', 
        changeType: 'Corrección',
        oldData: { title: 'Honzuki no Gekokujou', genres: ['Slice of Life', 'Fantasy'], episodes: 36 },
        newData: { title: 'Honzuki no Gekokujou: Shisho ni Naru Tame ni wa...', genres: ['Slice of Life', 'Fantasy', 'Isekai'], episodes: 36 }
    },
    { 
        id: 'contrib-2', 
        mediaTitle: 'Berserk', 
        mediaType: 'Manga', 
        user: { id: 'user-2', name: 'GutsFan91' }, 
        date: '2024-05-19', 
        changeType: 'Nueva Información',
        oldData: { status: 'En publicación' },
        newData: { status: 'En pausa' }
    },
    { 
        id: 'contrib-3', 
        mediaTitle: 'Nuevo Manwha de Acción', 
        mediaType: 'Manwha', 
        user: { id: 'user-3', name: 'NewbieCreator' }, 
        date: '2024-05-21', 
        changeType: 'Nueva Entrada',
        newData: { title: 'Solo Leveling', type: 'Manwha', genres: ['Action', 'Fantasy'] }
    },
];

const reportedComments: ReportedComment[] = [
    { id: 'comment-1', content: 'Este comentario contiene spoilers masivos sin avisar...', reporter: 'SpoilerHater', reason: 'Spoilers', date: '2024-05-22' },
    { id: 'comment-2', content: 'Un usuario está siendo muy ofensivo en esta sección.', reporter: 'CommunityMember', reason: 'Acoso', date: '2024-05-21' },
];

export default function ModeratorPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedContribution, setSelectedContribution] = useState<Contribution | null>(null);

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

  const handleApprove = (id: string) => {
    // PSQL: UPDATE contributions SET status = 'approved', reviewed_by = $1 WHERE id = $2;
    // PSQL: UPDATE media_table SET ... based on contribution data
    console.log(`Approving contribution ${id}`);
    setSelectedContribution(null);
  };
  
  const handleDisapprove = (id: string, reason: string) => {
    // PSQL: UPDATE contributions SET status = 'rejected', reviewed_by = $1, feedback = $2 WHERE id = $3;
    // PSQL: INSERT INTO notifications (user_id, message) VALUES ($4, `Tu contribución a ${mediaTitle} fue rechazada: ${reason}`);
    console.log(`Disapproving contribution ${id} with reason: ${reason}`);
    setSelectedContribution(null);
  };

  return (
    <main className="container mx-auto p-2 sm:p-6 space-y-8">
        <Card>
            <CardHeader>
                <CardTitle>Panel de Moderador</CardTitle>
                <CardDescription>Bienvenido, {user.name}. Aquí puedes moderar el contenido y revisar las contribuciones de la comunidad.</CardDescription>
            </CardHeader>
        </Card>

        <Tabs defaultValue="content">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="content">Contribuciones de Contenido</TabsTrigger>
                <TabsTrigger value="comments">Reportes de Comentarios</TabsTrigger>
            </TabsList>
            <TabsContent value="content">
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
                                        <TableCell>{contrib.user.name}</TableCell>
                                        <TableCell>{contrib.date}</TableCell>
                                        <TableCell>
                                            <Button variant="outline" size="sm" onClick={() => setSelectedContribution(contrib)}>Revisar</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="comments">
                 <Card>
                    <CardHeader>
                        <CardTitle>Comentarios Reportados</CardTitle>
                        <CardDescription>Revisa los comentarios que han sido marcados por la comunidad.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Comentario</TableHead>
                                    <TableHead>Reportado por</TableHead>
                                    <TableHead>Razón</TableHead>
                                    <TableHead>Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reportedComments.map((comment) => (
                                    <TableRow key={comment.id}>
                                        <TableCell className="font-medium max-w-sm truncate">"{comment.content}"</TableCell>
                                        <TableCell>{comment.reporter}</TableCell>
                                        <TableCell><Badge variant="destructive">{comment.reason}</Badge></TableCell>
                                        <TableCell className="flex gap-2">
                                             <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                                                <ShieldOff className="h-4 w-4 mr-1" />
                                                Descartar
                                            </Button>
                                             <Button variant="destructive" size="sm">
                                                <Trash2 className="h-4 w-4 mr-1" />
                                                Eliminar
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
        
        {selectedContribution && (
            <ReviewContributionDialog
                isOpen={!!selectedContribution}
                onOpenChange={() => setSelectedContribution(null)}
                contribution={selectedContribution}
                onApprove={handleApprove}
                onDisapprove={handleDisapprove}
            />
        )}
    </main>
  );
}
