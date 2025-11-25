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
import { AlertCircle, CheckCircle, Clock, XCircle, ArrowLeft, ExternalLink } from 'lucide-react';

interface Contribution {
  id: string;
  contributorUsername: string;
  contributorDisplayName?: string;
  contributableType: string;
  contributableId: string;
  contributionType: string;
  proposedChanges: Record<string, { old: any; new: any }>;
  contributionNotes?: string;
  sources?: string[];
  status: string;
  moderatorNotes?: string;
  assignedToUsername?: string;
  reviewedByUsername?: string;
  reviewedAt?: string;
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

export default function ReviewEditContributionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [contribution, setContribution] = useState<Contribution | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string>('pending');
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

    loadContribution();
  }, [user, router, resolvedParams.id]);

  const loadContribution = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/content-contributions/${resolvedParams.id}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setContribution(data.contribution);
        setStatus(data.contribution.status);
        setModeratorNotes(data.contribution.moderatorNotes || '');
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se pudo cargar la contribución',
        });
        router.push('/dashboard/moderator/contributions');
      }
    } catch (error) {
      console.error('Error loading contribution:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Error al cargar la contribución',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!user) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/content-contributions/${resolvedParams.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          status: newStatus,
          moderatorNotes,
          reviewedByUserId: user.id,
        }),
      });

      if (response.ok) {
        const statusMessages = {
          approved: '¡Contribución aprobada! Los cambios se aplicaron automáticamente.',
          rejected: 'Contribución rechazada',
          in_review: 'Contribución marcada como en revisión',
          needs_changes: 'Contribución marcada como que requiere cambios',
        };

        toast({
          title: statusMessages[newStatus as keyof typeof statusMessages] || '¡Actualizado!',
          description: 'El estado de la contribución ha sido actualizado',
        });
        
        // Redirigir automáticamente después de aprobar o rechazar
        if (newStatus === 'approved' || newStatus === 'rejected') {
          setTimeout(() => {
            router.push('/dashboard/moderator/contributions');
          }, 1500);
        } else {
          // Solo recargar datos para otros estados
          loadContribution();
        }
      } else {
        throw new Error('Error al actualizar');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo actualizar la contribución',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/content-contributions/${resolvedParams.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          moderatorNotes,
        }),
      });

      if (response.ok) {
        toast({
          title: '¡Guardado!',
          description: 'Las notas han sido guardadas',
        });
      } else {
        throw new Error('Error al guardar');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron guardar las notas',
      });
    } finally {
      setSaving(false);
    }
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

  const renderValueDiff = (field: string, oldValue: any, newValue: any) => {
    // Formatear valores para mostrar
    const formatValue = (val: any) => {
      if (val === null || val === undefined) return '(vacío)';
      if (typeof val === 'object') return JSON.stringify(val, null, 2);
      return String(val);
    };

    return (
      <div className="border rounded-lg p-4 space-y-2">
        <p className="font-semibold text-sm uppercase text-muted-foreground">{field}</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Valor Anterior:</p>
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded p-2">
              <p className="text-sm whitespace-pre-wrap break-words">{formatValue(oldValue)}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Valor Nuevo:</p>
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded p-2">
              <p className="text-sm whitespace-pre-wrap break-words">{formatValue(newValue)}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p>Cargando contribución...</p>
      </div>
    );
  }

  if (!contribution) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p>Contribución no encontrada</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Button
        variant="ghost"
        onClick={() => router.push('/dashboard/moderator/contributions')}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver a Contribuciones
      </Button>

      <div className="grid gap-6">
        {/* Información de la Contribución */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="mb-2">
                  Edición de {TYPE_LABELS[contribution.contributableType]}
                </CardTitle>
                <CardDescription className="flex flex-wrap gap-2 items-center">
                  <Badge variant="outline">
                    {TYPE_LABELS[contribution.contributableType]}
                  </Badge>
                  <Badge>
                    {contribution.status === 'pending' ? 'Pendiente' :
                     contribution.status === 'in_review' ? 'En Revisión' :
                     contribution.status === 'approved' ? 'Aprobada' :
                     contribution.status === 'rejected' ? 'Rechazada' :
                     'Requiere Cambios'}
                  </Badge>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Contribuidor:</Label>
              <p className="text-sm">
                @{contribution.contributorUsername}
                {contribution.contributorDisplayName && ` (${contribution.contributorDisplayName})`}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(contribution.createdAt).toLocaleString('es-ES')}
              </p>
            </div>

            {contribution.contributionNotes && (
              <div>
                <Label className="text-sm font-medium">Notas del Contribuidor:</Label>
                <p className="text-sm mt-1 whitespace-pre-wrap bg-muted p-3 rounded">
                  {contribution.contributionNotes}
                </p>
              </div>
            )}

            {contribution.sources && contribution.sources.length > 0 && (
              <div>
                <Label className="text-sm font-medium">Fuentes de Verificación:</Label>
                <ul className="text-sm mt-1 space-y-1">
                  {contribution.sources.map((source, index) => (
                    <li key={index}>
                      <a 
                        href={source} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {source}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push(getMediaUrl(contribution.contributableType, contribution.contributableId))}
              >
                Ver Contenido Original
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Cambios Propuestos */}
        <Card>
          <CardHeader>
            <CardTitle>Cambios Propuestos</CardTitle>
            <CardDescription>
              Compara los valores anteriores con los nuevos propuestos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(contribution.proposedChanges).map(([field, values]) => (
              <div key={field}>
                {renderValueDiff(field, values.old, values.new)}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Panel de Moderación */}
        <Card>
          <CardHeader>
            <CardTitle>Panel de Moderación</CardTitle>
            <CardDescription>
              Revisa los cambios y decide si aprobarlos o rechazarlos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="moderatorNotes">Notas del Moderador</Label>
              <Textarea
                id="moderatorNotes"
                placeholder="Agrega notas sobre esta contribución..."
                value={moderatorNotes}
                onChange={(e) => setModeratorNotes(e.target.value)}
                rows={4}
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSaveNotes}
                disabled={saving}
              >
                Guardar Notas
              </Button>
            </div>

            <div className="flex gap-2 flex-wrap pt-4">
              <Button
                onClick={() => handleUpdateStatus('approved')}
                disabled={saving || contribution.status === 'approved'}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Aprobar y Aplicar Cambios
              </Button>
              
              <Button
                variant="destructive"
                onClick={() => handleUpdateStatus('rejected')}
                disabled={saving || contribution.status === 'rejected'}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rechazar
              </Button>

              <Button
                variant="outline"
                onClick={() => handleUpdateStatus('in_review')}
                disabled={saving}
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Marcar en Revisión
              </Button>

              <Button
                variant="outline"
                onClick={() => handleUpdateStatus('needs_changes')}
                disabled={saving}
              >
                <Clock className="h-4 w-4 mr-2" />
                Requiere Cambios
              </Button>
            </div>

            {contribution.reviewedByUsername && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Revisado por @{contribution.reviewedByUsername}
                  {contribution.reviewedAt && (
                    <> el {new Date(contribution.reviewedAt).toLocaleString('es-ES')}</>
                  )}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
