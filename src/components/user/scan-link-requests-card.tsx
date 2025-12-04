/**
 * ScanLinkRequestsCard - Componente para gestionar solicitudes de vinculación
 * Solo visible para usuarios con rol 'scan' que tienen grupos verificados
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Check,
  X,
  Link2,
  ExternalLink,
  Clock,
  AlertCircle,
  Loader2,
  User,
  Inbox
} from 'lucide-react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LinkRequest {
  id: number;
  groupId: number;
  groupName: string;
  mediaType: string;
  mediaId: number;
  mediaTitle: string;
  mediaSlug: string;
  url: string;
  language: string;
  requestedBy: string;
  requestedByAvatar?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
}

interface ScanLinkRequestsCardProps {
  userId: number;
}

const mediaTypeLabels: Record<string, string> = {
  anime: 'Anime',
  manga: 'Manga',
  manhwa: 'Manhwa',
  manhua: 'Manhua',
  novel: 'Novela',
  donghua: 'Donghua',
  fan_comic: 'Fan Comic',
};

export function ScanLinkRequestsCard({ userId }: ScanLinkRequestsCardProps) {
  const { toast } = useToast();
  const [requests, setRequests] = useState<LinkRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isScanlator, setIsScanlator] = useState(false);

  // Estados para el diálogo de rechazo
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LinkRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadRequests();
  }, [userId]);

  async function loadRequests() {
    try {
      setLoading(true);
      setError(null);

      // Verificar si el usuario tiene rol de scanlator
      const roleResponse = await fetch(`/api/user/${userId}/role`);
      if (roleResponse.ok) {
        const roleData = await roleResponse.json();
        const hasScanRole = roleData.roles?.includes('scan') || roleData.isScanlator === true;
        setIsScanlator(hasScanRole);

        if (!hasScanRole) {
          setLoading(false);
          return;
        }
      } else {
        setLoading(false);
        return;
      }

      // Cargar solicitudes pendientes
      const response = await fetch('/api/scan/link-requests?status=pending');
      
      if (!response.ok) {
        throw new Error('Error al cargar solicitudes');
      }

      const data = await response.json();
      setRequests(data.requests || []);
    } catch (err: any) {
      console.error('Error cargando solicitudes:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(request: LinkRequest) {
    try {
      setProcessing(true);
      const response = await fetch(`/api/scan/link-requests/${request.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al aprobar');
      }

      toast({
        title: '✅ Solicitud aprobada',
        description: `La vinculación a "${request.mediaTitle}" ha sido aprobada`
      });

      // Recargar solicitudes
      loadRequests();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  }

  function openRejectDialog(request: LinkRequest) {
    setSelectedRequest(request);
    setRejectionReason('');
    setRejectDialogOpen(true);
  }

  async function handleReject() {
    if (!selectedRequest) return;

    try {
      setProcessing(true);
      const response = await fetch(`/api/scan/link-requests/${selectedRequest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'reject',
          rejectionReason: rejectionReason.trim() || null
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al rechazar');
      }

      toast({
        title: '❌ Solicitud rechazada',
        description: `La solicitud ha sido rechazada`
      });

      setRejectDialogOpen(false);
      loadRequests();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  }

  // Si no es scanlator, no mostrar nada
  if (!loading && !isScanlator) {
    return null;
  }

  // Loading
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Error
  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="py-8 text-center">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-destructive">{error}</p>
          <Button variant="outline" className="mt-4" onClick={loadRequests}>
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Sin solicitudes
  if (requests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Inbox className="h-5 w-5" />
            Solicitudes de Vinculación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Check className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>No tienes solicitudes pendientes</p>
            <p className="text-xs mt-1">
              Cuando alguien vincule tu grupo a un título, aparecerá aquí para que lo apruebes.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Inbox className="h-5 w-5" />
            Solicitudes de Vinculación
            <Badge variant="secondary">{requests.length}</Badge>
          </CardTitle>
          <CardDescription>
            Usuarios quieren vincular tu grupo a estos títulos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {requests.map(request => (
            <div 
              key={request.id} 
              className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <Badge variant="outline" className="text-xs">
                    {mediaTypeLabels[request.mediaType] || request.mediaType}
                  </Badge>
                  <Link 
                    href={`/${request.mediaType}/${request.mediaSlug}`}
                    className="font-medium hover:text-primary truncate"
                  >
                    {request.mediaTitle}
                  </Link>
                </div>
                
                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    @{request.requestedBy}
                  </span>
                  <span className="flex items-center gap-1">
                    <Link2 className="h-3 w-3" />
                    {request.groupName}
                  </span>
                  <a 
                    href={request.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-primary"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Ver URL
                  </a>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(request.createdAt).toLocaleDateString('es-ES')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button 
                  size="sm" 
                  variant="default"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleApprove(request)}
                  disabled={processing}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => openRejectDialog(request)}
                  disabled={processing}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Diálogo de rechazo */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar solicitud</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de rechazar la vinculación a "{selectedRequest?.mediaTitle}"?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3">
            <div>
              <label className="text-sm text-muted-foreground">
                Razón del rechazo (opcional)
              </label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ej: No tenemos este proyecto, URL incorrecta, etc."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={processing}
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <X className="h-4 w-4 mr-2" />
              )}
              Rechazar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ScanLinkRequestsCard;
