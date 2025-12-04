'use client';

/**
 * Panel de administración para gestionar solicitudes de rol Scanlator
 * Permite aprobar o rechazar solicitudes pendientes
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  BookOpen,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  User,
  Calendar,
  Globe,
  FileText,
  AlertCircle,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

// Tipos
interface ScanRequest {
  id: number;
  user_id: number;
  username: string;
  display_name: string;
  avatar_url: string | null;
  group_name: string;
  media_types: string[];
  experience: string;
  portfolio_urls: string[];
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  reviewed_by: number | null;
  reviewer_username: string | null;
  created_at: string;
  reviewed_at: string | null;
}

// Labels para tipos de media
const mediaTypeLabels: Record<string, string> = {
  anime: 'Anime',
  manga: 'Manga',
  manhwa: 'Manhwa',
  manhua: 'Manhua',
  novel: 'Novela',
  donghua: 'Donghua',
  fan_comic: 'Fan Comic',
};

export default function ScanRequestsAdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [requests, setRequests] = useState<ScanRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  
  // Estados para el diálogo
  const [selectedRequest, setSelectedRequest] = useState<ScanRequest | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<'approve' | 'reject'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    try {
      setLoading(true);
      const response = await fetch('/api/scan/requests');
      
      if (!response.ok) {
        throw new Error('Error al cargar solicitudes');
      }
      
      const data = await response.json();
      setRequests(data.requests || []);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las solicitudes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  // Filtrar solicitudes
  const filteredRequests = requests.filter(req => {
    if (filter === 'all') return true;
    return req.status === filter;
  });

  // Abrir diálogo de confirmación
  function openActionDialog(request: ScanRequest, action: 'approve' | 'reject') {
    setSelectedRequest(request);
    setDialogAction(action);
    setRejectionReason('');
    setDialogOpen(true);
  }

  // Procesar acción
  async function handleAction() {
    if (!selectedRequest) return;
    
    try {
      setActionLoading(true);
      
      const response = await fetch(`/api/scan/requests/${selectedRequest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: dialogAction,
          rejectionReason: dialogAction === 'reject' ? rejectionReason : undefined,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al procesar solicitud');
      }
      
      toast({
        title: 'Éxito',
        description: dialogAction === 'approve' 
          ? `Solicitud aprobada. ${selectedRequest.username} ahora tiene rol de Scanlator.`
          : 'Solicitud rechazada.',
      });
      
      // Recargar lista
      loadRequests();
      setDialogOpen(false);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo procesar la solicitud',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  }

  // Estadísticas rápidas
  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BookOpen className="h-8 w-8" />
          Solicitudes de Scanlator
        </h1>
        <p className="text-muted-foreground mt-1">
          Gestiona las solicitudes de usuarios que desean el rol de Scanlator
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setFilter('all')}>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 border-yellow-500/50" onClick={() => setFilter('pending')}>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Pendientes</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 border-green-500/50" onClick={() => setFilter('approved')}>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">Aprobadas</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 border-red-500/50" onClick={() => setFilter('rejected')}>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <p className="text-xs text-muted-foreground">Rechazadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de solicitudes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              Solicitudes {filter !== 'all' && `(${filter})`}
            </span>
            <Badge variant={filter === 'pending' ? 'default' : 'secondary'}>
              {filteredRequests.length} {filteredRequests.length === 1 ? 'solicitud' : 'solicitudes'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay solicitudes {filter !== 'all' ? filter === 'pending' ? 'pendientes' : filter === 'approved' ? 'aprobadas' : 'rechazadas' : ''}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Grupo/Nombre</TableHead>
                  <TableHead>Tipos de Media</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                          {request.avatar_url ? (
                            <img 
                              src={request.avatar_url} 
                              alt={request.username}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <User className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{request.display_name || request.username}</p>
                          <p className="text-xs text-muted-foreground">@{request.username}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{request.group_name}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {request.media_types.slice(0, 3).map((type) => (
                          <Badge key={type} variant="outline" className="text-xs">
                            {mediaTypeLabels[type] || type}
                          </Badge>
                        ))}
                        {request.media_types.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{request.media_types.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(request.created_at), { 
                          addSuffix: true, 
                          locale: es 
                        })}
                      </span>
                    </TableCell>
                    <TableCell>
                      {request.status === 'pending' && (
                        <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                          <Clock className="h-3 w-3" />
                          Pendiente
                        </Badge>
                      )}
                      {request.status === 'approved' && (
                        <Badge variant="default" className="bg-green-600 flex items-center gap-1 w-fit">
                          <CheckCircle className="h-3 w-3" />
                          Aprobada
                        </Badge>
                      )}
                      {request.status === 'rejected' && (
                        <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                          <XCircle className="h-3 w-3" />
                          Rechazada
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Ver detalles */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(request);
                            setDialogAction('approve');
                            setDialogOpen(true);
                          }}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        
                        {/* Acciones solo para pendientes */}
                        {request.status === 'pending' && (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => openActionDialog(request, 'approve')}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => openActionDialog(request, 'reject')}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de confirmación/detalles */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {dialogAction === 'approve' ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  {selectedRequest?.status === 'pending' ? 'Aprobar Solicitud' : 'Detalles de Solicitud'}
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-destructive" />
                  Rechazar Solicitud
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Solicitud de {selectedRequest?.display_name || selectedRequest?.username}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              {/* Info del usuario */}
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  {selectedRequest.avatar_url ? (
                    <img 
                      src={selectedRequest.avatar_url} 
                      alt={selectedRequest.username}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-semibold">{selectedRequest.display_name || selectedRequest.username}</p>
                  <p className="text-sm text-muted-foreground">@{selectedRequest.username}</p>
                </div>
                <Link 
                  href={`/profile/user/${selectedRequest.username}`}
                  className="ml-auto text-sm text-primary hover:underline flex items-center gap-1"
                  target="_blank"
                >
                  Ver perfil
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>

              {/* Detalles de la solicitud */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Grupo/Nombre</Label>
                  <p className="font-medium">{selectedRequest.group_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Tipos de media</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedRequest.media_types.map((type) => (
                      <Badge key={type} variant="outline">
                        {mediaTypeLabels[type] || type}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Experiencia */}
              <div>
                <Label className="text-muted-foreground">Experiencia</Label>
                <p className="text-sm mt-1 whitespace-pre-wrap bg-muted/30 p-3 rounded-lg">
                  {selectedRequest.experience || 'No especificada'}
                </p>
              </div>

              {/* Portfolio URLs */}
              {selectedRequest.portfolio_urls && selectedRequest.portfolio_urls.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Portfolio/Enlaces</Label>
                  <div className="space-y-1 mt-1">
                    {selectedRequest.portfolio_urls.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        <Globe className="h-3 w-3" />
                        {url}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Fecha */}
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Solicitado {formatDistanceToNow(new Date(selectedRequest.created_at), { 
                  addSuffix: true, 
                  locale: es 
                })}
              </div>

              {/* Si ya fue procesada, mostrar info del revisor */}
              {selectedRequest.status !== 'pending' && (
                <div className="p-3 rounded-lg border">
                  <p className="text-sm">
                    <strong>Estado:</strong>{' '}
                    <Badge variant={selectedRequest.status === 'approved' ? 'default' : 'destructive'}>
                      {selectedRequest.status === 'approved' ? 'Aprobada' : 'Rechazada'}
                    </Badge>
                  </p>
                  {selectedRequest.reviewer_username && (
                    <p className="text-sm mt-1 text-muted-foreground">
                      Revisado por @{selectedRequest.reviewer_username}
                    </p>
                  )}
                  {selectedRequest.rejection_reason && (
                    <p className="text-sm mt-2">
                      <strong>Motivo:</strong> {selectedRequest.rejection_reason}
                    </p>
                  )}
                </div>
              )}

              {/* Campo de razón de rechazo (solo si es rechazo) */}
              {dialogAction === 'reject' && selectedRequest.status === 'pending' && (
                <div>
                  <Label htmlFor="rejectionReason">Motivo del rechazo (opcional)</Label>
                  <Textarea
                    id="rejectionReason"
                    placeholder="Explica brevemente por qué se rechaza la solicitud..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="mt-1"
                  />
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            
            {selectedRequest?.status === 'pending' && (
              <>
                {dialogAction === 'approve' ? (
                  <Button 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={handleAction}
                    disabled={actionLoading}
                  >
                    {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Aprobar y Asignar Rol
                  </Button>
                ) : (
                  <Button 
                    variant="destructive"
                    onClick={handleAction}
                    disabled={actionLoading}
                  >
                    {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Rechazar Solicitud
                  </Button>
                )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
