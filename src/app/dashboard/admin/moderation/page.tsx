'use client';

import { useState, useEffect } from 'react';
import { Users, Loader2, Shield, ShieldOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';

interface User {
  id: number;
  username: string;
  email: string;
  tracking_id: string;
  roles: string[];
  is_active: boolean;
  created_at: string;
  contribution_count: number;
}

export default function ModerationPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [action, setAction] = useState<'promote' | 'demote' | 'suspend' | 'unsuspend' | 'ban'>('promote');
  const [suspensionReason, setSuspensionReason] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      setFilteredUsers(
        users.filter(
          (user) =>
            user.username.toLowerCase().includes(query) ||
            user.email.toLowerCase().includes(query) ||
            user.tracking_id.toLowerCase().includes(query)
        )
      );
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error en respuesta:', response.status, errorData);
        throw new Error(errorData.error || `Error ${response.status}`);
      }
      
      const data = await response.json();
      
      // Parsear roles si vienen como string
      const parsedUsers = (data.users || []).map((user: any) => ({
        ...user,
        roles: typeof user.roles === 'string' ? JSON.parse(user.roles) : (user.roles || [])
      }));
      
      setUsers(parsedUsers);
      setFilteredUsers(parsedUsers);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudieron cargar los usuarios',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (user: User, actionType: 'promote' | 'demote' | 'suspend' | 'unsuspend' | 'ban') => {
    setSelectedUser(user);
    setAction(actionType);
    setSuspensionReason('');
    setDialogOpen(true);
  };

  const handleRoleChange = async () => {
    if (!selectedUser) return;

    // Validar razón de suspensión si es necesario
    if (action === 'suspend' && !suspensionReason.trim()) {
      toast({
        title: 'Error',
        description: 'Debes proporcionar una razón para la suspensión',
        variant: 'destructive',
      });
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          action,
          suspensionReason: action === 'suspend' ? suspensionReason : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al cambiar rol');
      }

      const data = await response.json();

      toast({
        title: 'Éxito',
        description: data.message,
      });

      // Actualizar la lista de usuarios
      setUsers((prev) =>
        prev.map((user) =>
          user.id === selectedUser.id
            ? { 
                ...user, 
                roles: action === 'promote' 
                  ? [...user.roles, 'moderator']
                  : user.roles.filter(r => r !== 'moderator'),
                is_active: action === 'unsuspend' ? true : action === 'suspend' ? false : user.is_active
              }
            : user
        ).filter(user => action !== 'ban' || user.id !== selectedUser.id) // Remover usuario baneado
      );

      setDialogOpen(false);
    } catch (error) {
      console.error('Error al cambiar rol:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cambiar el rol del usuario',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleBadge = (roles: string[]) => {
    const isAdmin = roles.includes('admin');
    const isModerator = roles.includes('moderator');
    
    if (isAdmin) {
      return <Badge variant="destructive">Administrador</Badge>;
    }
    if (isModerator) {
      return <Badge variant="default">Moderador</Badge>;
    }
    return <Badge variant="secondary">Usuario</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Moderación de Usuarios</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona roles de usuario y asigna permisos de moderación
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buscar Usuarios</CardTitle>
          <CardDescription>
            Busca por nombre de usuario, correo electrónico o ID de seguimiento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Users className="h-5 w-5 text-muted-foreground mt-2.5" />
            <Input
              placeholder="Buscar usuario..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Usuarios {filteredUsers.length > 0 && `(${filteredUsers.length})`}
          </CardTitle>
          <CardDescription>
            {filteredUsers.length === 0
              ? 'No se encontraron usuarios'
              : 'Lista de usuarios del sistema'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>ID de Seguimiento</TableHead>
                    <TableHead>Correo</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Contribuciones</TableHead>
                    <TableHead>Registro</TableHead>
                    <TableHead className="text-right min-w-[300px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                {filteredUsers.map((userItem) => {
                  const isAdmin = userItem.roles.includes('admin');
                  const isModerator = userItem.roles.includes('moderator');
                  const isRegularUser = !isAdmin && !isModerator;
                  
                  return (
                    <TableRow key={userItem.id}>
                      <TableCell className="font-medium">{userItem.username}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {userItem.tracking_id}
                        </code>
                      </TableCell>
                      <TableCell>{userItem.email}</TableCell>
                      <TableCell>{getRoleBadge(userItem.roles)}</TableCell>
                      <TableCell>
                        {userItem.is_active ? (
                          <Badge variant="outline" className="text-green-600">Activo</Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-600">Suspendido</Badge>
                        )}
                      </TableCell>
                      <TableCell>{userItem.contribution_count}</TableCell>
                      <TableCell>
                        {new Date(userItem.created_at).toLocaleDateString('es-ES')}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {isAdmin ? (
                          <span className="text-sm text-muted-foreground">
                            No modificable
                          </span>
                        ) : (
                          <div className="flex gap-1 justify-end flex-wrap">
                            {/* Solo admins pueden promover/degradar */}
                            {user?.isAdmin && (
                              <>
                                {isRegularUser && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openDialog(userItem, 'promote')}
                                  >
                                    <Shield className="h-4 w-4 mr-1" />
                                    Promover
                                  </Button>
                                )}
                                {isModerator && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openDialog(userItem, 'demote')}
                                  >
                                    <ShieldOff className="h-4 w-4 mr-1" />
                                    Degradar
                                  </Button>
                                )}
                              </>
                            )}
                            
                            {/* Todos pueden suspender/activar */}
                            {userItem.is_active ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openDialog(userItem, 'suspend')}
                              >
                                Suspender
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openDialog(userItem, 'unsuspend')}
                              >
                                Activar
                              </Button>
                            )}
                            
                            {/* Solo admins pueden banear */}
                            {user?.isAdmin && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => openDialog(userItem, 'ban')}
                              >
                                Banear
                              </Button>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron usuarios
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === 'promote' && 'Promover a Moderador'}
              {action === 'demote' && 'Degradar a Usuario'}
              {action === 'suspend' && 'Suspender Usuario'}
              {action === 'unsuspend' && 'Activar Usuario'}
              {action === 'ban' && 'Banear Usuario'}
            </DialogTitle>
            <DialogDescription>
              {action === 'promote' && (
                <>
                  ¿Estás seguro de que deseas promover a <strong>{selectedUser?.username}</strong> a moderador? 
                  Los moderadores pueden aprobar y rechazar contribuciones.
                </>
              )}
              {action === 'demote' && (
                <>
                  ¿Estás seguro de que deseas degradar a <strong>{selectedUser?.username}</strong> a usuario regular? 
                  Perderá sus permisos de moderación.
                </>
              )}
              {action === 'suspend' && (
                <>
                  ¿Estás seguro de que deseas suspender a <strong>{selectedUser?.username}</strong>? 
                  No podrá iniciar sesión hasta que sea reactivado.
                </>
              )}
              {action === 'unsuspend' && (
                <>
                  ¿Estás seguro de que deseas reactivar a <strong>{selectedUser?.username}</strong>? 
                  Podrá volver a iniciar sesión normalmente.
                </>
              )}
              {action === 'ban' && (
                <>
                  ¿Estás seguro de que deseas banear permanentemente a <strong>{selectedUser?.username}</strong>? 
                  Esta acción no se puede deshacer y el usuario será eliminado del sistema.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {/* Campo de razón para suspensión */}
          {action === 'suspend' && (
            <div className="space-y-2">
              <Label htmlFor="suspension-reason">Razón de la suspensión *</Label>
              <Textarea
                id="suspension-reason"
                placeholder="Explica el motivo de la suspensión..."
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                rows={3}
                required
              />
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleRoleChange}
              disabled={actionLoading}
              variant={action === 'ban' ? 'destructive' : 'default'}
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
