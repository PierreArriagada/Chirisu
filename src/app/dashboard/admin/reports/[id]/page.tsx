'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle, Clock, XCircle, ArrowLeft } from 'lucide-react';

interface Report {
  id: string;
  reporterUsername: string;
  reporterDisplayName?: string;
  reportableType: string;
  reportableId: string;
  issueType: string;
  title: string;
  description: string;
  status: string;
  moderatorNotes?: string;
  assignedToUserId?: string;
  assignedToUsername?: string;
  assignedToDisplayName?: string;
  assignedAt?: string;
  resolvedByUsername?: string;
  resolvedAt?: string;
  createdAt: string;
}

const STATUS_CONFIG = {
  pending: { label: 'Pendiente', icon: Clock, color: 'bg-yellow-500' },
  in_review: { label: 'En revisión', icon: AlertCircle, color: 'bg-blue-500' },
  resolved: { label: 'Resuelto', icon: CheckCircle, color: 'bg-green-500' },
  dismissed: { label: 'Descartado', icon: XCircle, color: 'bg-red-500' },
};

const PRIORITY_CONFIG = {
  low: { label: 'Baja', color: 'bg-gray-500' },
  normal: { label: 'Normal', color: 'bg-blue-500' },
  high: { label: 'Alta', color: 'bg-orange-500' },
  urgent: { label: 'Urgente', color: 'bg-red-500' },
};

const TYPE_LABELS: Record<string, string> = {
  anime: 'Anime',
  manga: 'Manga',
  novel: 'Novela',
  novels: 'Novela',
  donghua: 'Donghua',
  manhua: 'Manhua',
  manhwa: 'Manhwa',
  fan_comic: 'Fan Comic',
};

export default function AdminReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [status, setStatus] = useState<string>('pending');
  const [moderatorNotes, setModeratorNotes] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (!user.isAdmin && !user.isModerator) {
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
        setModeratorNotes(data.report.moderatorNotes || '');
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se pudo cargar el reporte',
        });
        router.push('/dashboard/admin/reports');
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
          moderatorNotes,
          resolvedByUserId: user.id,
        }),
      });

      if (response.ok) {
        toast({
          title: '¡Guardado!',
          description: 'El reporte ha sido actualizado',
        });
        
        // Si el caso fue resuelto o rechazado, redirigir a la lista
        if (status === 'resolved' || status === 'dismissed') {
          setTimeout(() => {
            router.push('/dashboard/admin/reports');
          }, 1000); // Esperar 1 segundo para que el usuario vea el toast
        } else {
          loadReport();
        }
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

  const handleTakeCase = async () => {
    if (!user) return;

    setAssigning(true);
    try {
      const response = await fetch(`/api/content-reports/${resolvedParams.id}/assign`, {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: '¡Caso asignado!',
          description: 'Este caso ahora está asignado a ti',
        });
        loadReport();
      } else {
        if (response.status === 409) {
          toast({
            variant: 'destructive',
            title: 'Caso ocupado',
            description: `Este caso ya está siendo manejado por ${data.assignedTo?.display_name || data.assignedTo?.username}`,
          });
        } else {
          throw new Error(data.error || 'Error al asignar caso');
        }
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo asignar el caso',
      });
    } finally {
      setAssigning(false);
    }
  };

  const handleReleaseCase = async () => {
    if (!user) return;

    setAssigning(true);
    try {
      const response = await fetch(`/api/content-reports/${resolvedParams.id}/assign`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast({
          title: 'Caso liberado',
          description: 'El caso está nuevamente disponible',
        });
        loadReport();
      } else {
        throw new Error('Error al liberar caso');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo liberar el caso',
      });
    } finally {
      setAssigning(false);
    }
  };

  const getMediaUrl = (type: string, id: string) => {
    const typeMap: Record<string, string> = {
      anime: 'anime',
      manga: 'manga',
      novel: 'novela',
      novels: 'novela',
      donghua: 'dougua',
      manhua: 'manhua',
      manhwa: 'manwha',
      fan_comic: 'fan-comic',
    };
    return `/${typeMap[type] || 'anime'}/${id}`;
  };

  const getEditUrl = (type: string, id: string) => {
    // Normalizar el tipo para la URL de edición
    const normalizedType = type === 'novel' ? 'novels' : type;
    return `/dashboard/admin/edit/${normalizedType}/${id}`;
  };

  // Helper para verificar si el moderador puede editar
  const canModeratorEdit = (): boolean => {
    if (!report || !user) return false;
    if (user.isAdmin) return true; // Admin siempre puede editar
    if (!report.assignedToUsername) return true; // Si no está asignado, cualquiera puede
    return report.assignedToUserId === user.id?.toString(); // Solo el asignado puede editar
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p>Cargando reporte...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p>Reporte no encontrado</p>
      </div>
    );
  }

  const StatusIcon = STATUS_CONFIG[report.status as keyof typeof STATUS_CONFIG]?.icon || Clock;

  return (
    <div className="container mx-auto py-8 px-4">
      <Button
        variant="ghost"
        onClick={() => router.push('/dashboard/admin/reports')}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver a Reportes
      </Button>

      <div className="grid gap-6">
        {/* Información del Reporte */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="mb-2">{report.title}</CardTitle>
                <CardDescription className="flex flex-wrap gap-2 items-center">
                  <Badge variant="outline">
                    {TYPE_LABELS[report.reportableType] || report.reportableType}
                  </Badge>
                  <Badge className={STATUS_CONFIG[report.status as keyof typeof STATUS_CONFIG]?.color}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {STATUS_CONFIG[report.status as keyof typeof STATUS_CONFIG]?.label}
                  </Badge>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Reportado por:</Label>
              <p className="text-sm">
                @{report.reporterUsername}
                {report.reporterDisplayName && ` (${report.reporterDisplayName})`}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(report.createdAt).toLocaleString('es-ES')}
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium">Descripción del problema:</Label>
              <p className="text-sm mt-1 whitespace-pre-wrap">{report.description}</p>
            </div>

            {report.resolvedByUsername && (
              <div>
                <Label className="text-sm font-medium">Resuelto por:</Label>
                <p className="text-sm">@{report.resolvedByUsername}</p>
                {report.resolvedAt && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(report.resolvedAt).toLocaleString('es-ES')}
                  </p>
                )}
              </div>
            )}

            {/* Información de Asignación */}
            {report.assignedToUsername && (
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <Label className="text-sm font-medium">Caso asignado a:</Label>
                <p className="text-sm font-semibold">
                  @{report.assignedToUsername}
                  {report.assignedToDisplayName && ` (${report.assignedToDisplayName})`}
                </p>
                {report.assignedAt && (
                  <p className="text-xs text-muted-foreground">
                    Desde {new Date(report.assignedAt).toLocaleString('es-ES')}
                  </p>
                )}
                {user && (report.assignedToUserId === user.id?.toString() || user.isAdmin) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReleaseCase}
                    disabled={assigning}
                    className="mt-2"
                  >
                    {assigning ? 'Liberando...' : 'Liberar Caso'}
                  </Button>
                )}
              </div>
            )}

            {/* Botón para Tomar Caso */}
            {!report.assignedToUsername && report.status !== 'resolved' && report.status !== 'dismissed' && (
              <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg">
                <p className="text-sm mb-2">Este caso no está asignado a ningún moderador</p>
                <Button
                  onClick={handleTakeCase}
                  disabled={assigning}
                  size="sm"
                >
                  {assigning ? 'Asignando...' : 'Tomar Este Caso'}
                </Button>
              </div>
            )}

            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                onClick={() => router.push(getMediaUrl(report.reportableType, report.reportableId))}
              >
                Ver Contenido Reportado
              </Button>
              <Button
                onClick={() => router.push(getEditUrl(report.reportableType, report.reportableId))}
              >
                Editar Contenido
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Formulario de Administración */}
        <Card>
          <CardHeader>
            <CardTitle>Administrar Reporte</CardTitle>
            <CardDescription>
              Actualiza el estado y agrega notas sobre este reporte
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Advertencia si el caso está asignado a otro */}
            {report.assignedToUsername && !canModeratorEdit() && (
              <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-4 rounded-lg">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                  ⚠️ Este caso está asignado a @{report.assignedToUsername}
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  Solo el moderador asignado o un administrador pueden modificarlo
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select 
                value={status} 
                onValueChange={setStatus}
                disabled={!canModeratorEdit()}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="in_review">En revisión</SelectItem>
                  <SelectItem value="resolved">Resuelto</SelectItem>
                  <SelectItem value="dismissed">Descartado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="moderatorNotes">Notas del Administrador</Label>
              <Textarea
                id="moderatorNotes"
                placeholder="Agrega notas sobre cómo se manejó este reporte..."
                value={moderatorNotes}
                onChange={(e) => setModeratorNotes(e.target.value)}
                rows={4}
                disabled={!canModeratorEdit()}
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button 
                onClick={handleSave} 
                disabled={saving || !canModeratorEdit()}
              >
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
