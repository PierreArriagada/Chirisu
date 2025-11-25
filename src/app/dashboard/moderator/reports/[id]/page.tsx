'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Save, ExternalLink, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';

interface Report {
  id: string;
  reporterUsername: string;
  reporterDisplayName: string;
  reportableType: string;
  reportableId: string;
  issueType: string;
  title: string;
  description: string;
  status: 'pending' | 'in_review' | 'resolved' | 'rejected';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  assignedToUserId?: string;
  assignedToUsername?: string;
  moderatorNotes?: string;
  createdAt: string;
  updatedAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  anime: 'Anime',
  manga: 'Manga',
  novel: 'Novela',
  donghua: 'Donghua',
  manhua: 'Manhua',
  manhwa: 'Manhwa',
  fan_comic: 'Fan Comic',
};

export default function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string>('pending');
  const [priority, setPriority] = useState<string>('normal');
  const [moderatorNotes, setModeratorNotes] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const allowedRoles = ['admin', 'moderator'];
    if (!allowedRoles.includes(user.role || 'user')) {
      router.push('/');
      return;
    }

    loadReport();
  }, [user, router, resolvedParams.id]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/content-reports/${resolvedParams.id}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setReport(data.report);
        setStatus(data.report.status);
        setPriority(data.report.priority);
        setModeratorNotes(data.report.moderatorNotes || '');
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se pudo cargar el reporte',
        });
        router.push('/dashboard/moderator/reports');
      }
    } catch (error) {
      console.error('Error loading report:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Error al cargar el reporte',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/content-reports/${resolvedParams.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          status,
          priority,
          moderatorNotes,
          resolvedByUserId: user.id,
        }),
      });

      if (response.ok) {
        toast({
          title: '¡Guardado!',
          description: 'El reporte ha sido actualizado',
        });
        loadReport();
      } else {
        throw new Error('Error al guardar');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo guardar los cambios',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResolve = async () => {
    setStatus('resolved');
    setTimeout(() => handleSave(), 100);
  };

  const handleReject = async () => {
    setStatus('rejected');
    setTimeout(() => handleSave(), 100);
  };

  const getMediaUrl = (type: string, id: string) => {
    const typeMap: Record<string, string> = {
      anime: 'anime',
      manga: 'manga',
      novel: 'novela',
      donghua: 'donghua',
      manhua: 'manhua',
      manhwa: 'manhwa',
      fan_comic: 'fan-comic',
    };
    return `/${typeMap[type] || 'anime'}/${id}`;
  };

  const getEditContentUrl = (type: string, id: string) => {
    const typeMap: Record<string, string> = {
      anime: 'anime',
      manga: 'manga',
      novel: 'novel',
      donghua: 'donghua',
      manhua: 'manhua',
      manhwa: 'manhwa',
      fan_comic: 'fan-comic',
    };
    return `/dashboard/${user?.role}/edit/${typeMap[type]}/${id}`;
  };

  if (!user || !['admin', 'moderator'].includes(user.role || 'user')) {
    return null;
  }

  if (loading) {
    return (
      <main className="container mx-auto p-2 sm:p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </main>
    );
  }

  if (!report) {
    return (
      <main className="container mx-auto p-2 sm:p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p>Reporte no encontrado</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="container mx-auto p-2 sm:p-6 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/dashboard/moderator/reports">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a reportes
          </Link>
        </Button>
        <h1 className="text-3xl font-bold mb-2">Gestionar Reporte</h1>
        <p className="text-muted-foreground">
          Revisa y actualiza el estado del reporte
        </p>
      </div>

      <div className="grid gap-6">
        {/* Información del Reporte */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{report.title}</CardTitle>
                <CardDescription className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge variant="outline">
                    {TYPE_LABELS[report.reportableType] || report.reportableType}
                  </Badge>
                  <span className="text-xs">
                    Por {report.reporterDisplayName || report.reporterUsername}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(report.createdAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Descripción del problema:</Label>
              <div className="bg-muted/50 rounded-lg p-4 mt-2">
                <p className="text-sm whitespace-pre-wrap">{report.description}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={getMediaUrl(report.reportableType, report.reportableId)} target="_blank">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Ver contenido reportado
                </Link>
              </Button>
              <Button asChild variant="default" size="sm">
                <Link href={getEditContentUrl(report.reportableType, report.reportableId)}>
                  Editar contenido
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Gestión del Reporte */}
        <Card>
          <CardHeader>
            <CardTitle>Gestión</CardTitle>
            <CardDescription>
              Actualiza el estado y prioridad del reporte
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="in_review">En revisión</SelectItem>
                    <SelectItem value="resolved">Resuelto</SelectItem>
                    <SelectItem value="rejected">Rechazado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Prioridad</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas del moderador</Label>
              <Textarea
                id="notes"
                placeholder="Agrega notas sobre las acciones tomadas o razones de la decisión..."
                value={moderatorNotes}
                onChange={(e) => setModeratorNotes(e.target.value)}
                rows={4}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Guardar cambios
              </Button>
              {status !== 'resolved' && (
                <Button onClick={handleResolve} variant="default" disabled={saving}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Marcar como resuelto
                </Button>
              )}
              {status !== 'rejected' && (
                <Button onClick={handleReject} variant="destructive" disabled={saving}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Rechazar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
