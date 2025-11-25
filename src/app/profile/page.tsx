'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { UserList, TitleInfo } from '@/lib/types';
import { UserMediaList, CustomListsCard, ContributionsCard, UserContributionsCard, FavoritesCard } from '@/components/user';
import { ListPrivacyToggle } from '@/components/lists';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { ExportButton } from '@/components/shared';

// ============================================
// TIPOS (coinciden con la API)
// ============================================

interface ListItem {
  id: string;
  title: string;
  type: string;
  slug: string;
  imageUrl: string;
  rating?: number;
  addedAt: string;
  // Campos adicionales para compatibilidad con UserMediaList
  description?: string;
  imageHint?: string;
  ranking?: number;
  genre?: string[];
  commentsCount?: number;
  listsCount?: number;
}

interface CustomList {
  id: string;
  name: string;
  isPublic: boolean;
  items: ListItem[];
  createdAt: string;
}

interface UserContribution {
  id: string;
  contributionType: 'full' | 'modification' | 'report';
  mediaType: 'anime' | 'manga' | 'novel';
  mediaTitle: string;
  status: 'pending' | 'approved' | 'rejected';
  awardedPoints: number;
  createdAt: string;
  reviewedAt: string | null;
  rejectionReason: string | null;
  contributionData: any;
}

interface UserProfile {
  id: number;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  isAdmin: boolean;
  isModerator: boolean;
  createdAt: string;
  lists: {
    pending: ListItem[];
    following: ListItem[];
    watched: ListItem[];
    favorites: ListItem[];
  };
  listSettings: {
    pending: 'public' | 'private';
    following: 'public' | 'private';
    watched: 'public' | 'private';
    favorites: 'public' | 'private';
  };
  customLists: CustomList[];
  contributions: UserContribution[];
}

export default function ProfilePage() {
  const { user, loading: authLoading, refreshUserLists } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // Estados
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ==========================================
  // EFECTO: CARGAR PERFIL DESDE LA API
  // ==========================================
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      loadProfile();
    }
  }, [user, authLoading, router]);

<<<<<<< HEAD
  async function loadProfile() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/user/profile', {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Error al cargar el perfil');
      }

      const data = await response.json();
      setProfile(data.profile);
    } catch (err: any) {
      console.error('Error al cargar perfil:', err);
      setError(err.message || 'Error al cargar el perfil');
=======
  const handleCreateList = (name: string) => {
    // PSQL: `INSERT INTO lists (user_id, name, is_public) VALUES ($1, $2, false) RETURNING *;`
    if (user) {
        const newList: CustomListType = {
            id: `custom-${Date.now()}`,
            name,
            items: [],
            isPublic: false,
        };
        const updatedLists = [...customLists, newList];
        setCustomLists(updatedLists);
        updateUser({ ...user, customLists: updatedLists });
        toast({
            title: "Lista creada",
            description: `La lista "${name}" ha sido creada.`,
        });
    }
  };

  const handleEditList = (id: string, newName: string) => {
    // PSQL: `UPDATE lists SET name = $1 WHERE id = $2 AND user_id = $3;`
    if (user) {
        const updatedLists = customLists.map(list =>
            list.id === id ? { ...list, name: newName } : list
        );
        setCustomLists(updatedLists);
        updateUser({ ...user, customLists: updatedLists });
        toast({
            title: "Lista actualizada",
            description: `La lista ha sido renombrada a "${newName}".`,
        });
    }
  };

  const handleDeleteList = (id: string) => {
    // PSQL: `DELETE FROM lists WHERE id = $1 AND user_id = $2;`
    if (user) {
        const updatedLists = customLists.filter(list => list.id !== id);
        setCustomLists(updatedLists);
        updateUser({ ...user, customLists: updatedLists });
        toast({
            title: "Lista eliminada",
            description: "La lista ha sido eliminada correctamente.",
            variant: "destructive",
        });
    }
  };

  const handleRemoveItemFromList = (listId: string, itemId: string) => {
    // PSQL: `DELETE FROM list_items WHERE list_id = $1 AND item_id = $2;`
    if (user) {
        const updatedLists = customLists.map(list => {
            if (list.id === listId) {
                return { ...list, items: list.items.filter(item => item.id !== itemId) };
            }
            return list;
        });
        setCustomLists(updatedLists);
        updateUser({ ...user, customLists: updatedLists });
        toast({
            title: "Elemento eliminado",
            description: "El elemento ha sido eliminado de la lista.",
        });
    }
  };
  
  const handleCustomListPrivacyChange = (listId: string, isPublic: boolean) => {
    // PSQL: `UPDATE lists SET is_public = $1 WHERE id = $2 AND user_id = $3;`
    if (user) {
      const updatedLists = customLists.map(list =>
        list.id === listId ? { ...list, isPublic } : list
      );
      setCustomLists(updatedLists);
      updateUser({ ...user, customLists: updatedLists });
>>>>>>> d3e59e8a72b3b9ecd4bb64f73b81cc23f36469ab
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo cargar tu perfil. Intenta de nuevo.',
      });
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // HANDLERS (placeholder - implementar con APIs después)
  // ==========================================
  
  const handlePrivacyChange = async (list: UserList, isPublic: boolean) => {
    if (!user) return;

    try {
      const response = await fetch('/api/user/lists/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id.toString()
        },
        body: JSON.stringify({
          listName: list,
          isPublic
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Actualizar el estado local
        setProfile(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            listSettings: {
              ...prev.listSettings,
              [list]: isPublic ? 'public' : 'private'
            }
          };
        });

        toast({
          title: isPublic ? '🌍 Lista pública' : '🔒 Lista privada',
          description: data.message
        });
      } else {
        throw new Error('Error al actualizar privacidad');
      }
    } catch (error) {
      console.error('Error al cambiar privacidad:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cambiar la privacidad de la lista',
        variant: 'destructive'
      });
    }
  };

  const handleCreateList = async (name: string) => {
    // TODO: Implementar con API POST /api/user/lists
    toast({
      title: 'Función en desarrollo',
      description: 'Pronto podrás crear listas personalizadas.',
    });
  };

  const handleEditList = async (id: string, newName: string) => {
    // TODO: Implementar con API PATCH /api/user/lists/:id
    toast({
      title: 'Función en desarrollo',
      description: 'Pronto podrás editar tus listas.',
    });
  };

  const handleDeleteList = async (id: string) => {
    // TODO: Implementar con API DELETE /api/user/lists/:id
    toast({
      title: 'Función en desarrollo',
      description: 'Pronto podrás eliminar listas.',
    });
  };

  const handleRemoveItemFromList = async (listId: string, itemId: string) => {
    if (!user) return;

    try {
      const response = await fetch(`/api/user/lists/${listId}/items/${itemId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Actualizar el estado local del perfil
        setProfile(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            customLists: prev.customLists.map(list =>
              list.id === listId
                ? { ...list, items: list.items.filter(item => item.id !== itemId) }
                : list
            )
          };
        });

        // Recargar las listas en el contexto
        if (refreshUserLists) {
          await refreshUserLists();
        }

        toast({
          title: '✅ Item eliminado',
          description: 'El elemento se ha eliminado de tu lista'
        });
      } else {
        throw new Error('Error al eliminar item');
      }
    } catch (error) {
      console.error('Error al eliminar item:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el item de la lista',
        variant: 'destructive'
      });
    }
  };

  // Handler para eliminar de listas predefinidas (Pendiente, Siguiendo, Visto, Favoritos)
  const handleRemoveFromPredefinedList = async (listName: UserList, itemId: string) => {
    if (!user) return;

    try {
      // Primero necesitamos obtener el ID de la lista predefinida
      const listsResponse = await fetch(`/api/user/lists?userId=${user.id}`);
      const listsData = await listsResponse.json();
      
      // Mapeo de nombres a slugs de lista
      const listSlugMap: Record<UserList, string> = {
        'pending': 'por-ver',
        'following': 'siguiendo',
        'watched': 'completado',
        'favorites': 'favoritos'
      };

      const targetSlug = listSlugMap[listName];
      
      // Buscar en defaultLists por slug
      const targetList = listsData.defaultLists?.find((l: any) => l.slug === targetSlug);

      if (!targetList) {
        console.error('❌ Lista no encontrada. Buscando slug:', targetSlug, 'listName recibido:', listName);
        console.log('Listas disponibles:', listsData.defaultLists?.map((l: any) => ({ name: l.name, slug: l.slug })));
        throw new Error('Lista no encontrada');
      }

      console.log(`🔍 Intentando eliminar: listId=${targetList.id}, itemId=${itemId}, listName=${listName}, slug=${targetSlug}`);

      const response = await fetch(`/api/user/lists/${targetList.id}/items/${itemId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error del servidor:', response.status, errorData);
        throw new Error(errorData.error || 'Error al eliminar item');
      }

      if (response.ok) {
        // Actualizar el estado local del perfil
        setProfile(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            lists: {
              ...prev.lists,
              [listName]: prev.lists[listName].filter((item: ListItem) => item.id !== itemId)
            }
          };
        });

        // Recargar las listas en el contexto para que se actualicen en toda la app
        if (refreshUserLists) {
          await refreshUserLists();
        }

        toast({
          title: '✅ Item eliminado',
          description: 'El elemento se ha eliminado de tu lista'
        });
      } else {
        throw new Error('Error al eliminar item');
      }
    } catch (error) {
      console.error('Error al eliminar item de lista predefinida:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el item de la lista',
        variant: 'destructive'
      });
    }
  };
  
  const handleCustomListPrivacyChange = async (listId: string, isPublic: boolean) => {
    if (!user) return;

    try {
      const response = await fetch(`/api/lists/${listId}/privacy`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id.toString()
        },
        body: JSON.stringify({ isPublic })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Actualizar el estado local
        setProfile(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            customLists: prev.customLists.map(list =>
              list.id === listId ? { ...list, isPublic } : list
            )
          };
        });

        toast({
          title: isPublic ? '🌍 Lista pública' : '🔒 Lista privada',
          description: data.message
        });
      } else {
        throw new Error('Error al actualizar privacidad');
      }
    } catch (error) {
      console.error('Error al cambiar privacidad de lista personalizada:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cambiar la privacidad de la lista',
        variant: 'destructive'
      });
    }
  };

  // ==========================================
  // RENDER: LOADING
  // ==========================================
  if (authLoading || loading) {
    return (
      <div className="space-y-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
          </CardHeader>
        </Card>
        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-8">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // ==========================================
  // RENDER: ERROR
  // ==========================================
  if (error || !profile) {
    return (
      <div className="text-center p-8">
        <p className="text-destructive mb-4">{error || 'No se pudo cargar el perfil'}</p>
        <Button onClick={loadProfile}>Reintentar</Button>
      </div>
    );
  }

  // ==========================================
  // RENDER: PERFIL
  // ==========================================

  const listTabs: { name: string, value: UserList, label: string }[] = [
    { name: "Pendiente", value: 'pending', label: "Pendiente" },
    { name: "Siguiendo", value: 'following', label: "Siguiendo" },
    { name: "Visto/Leído", value: 'watched', label: "Visto/Leído" },
  ];

  return (
    <div className="space-y-8">
<<<<<<< HEAD
      {/* CARD: Información del Usuario */}
      <Card className="max-w-4xl mx-auto">
=======
      <Card>
>>>>>>> d3e59e8a72b3b9ecd4bb64f73b81cc23f36469ab
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile.avatarUrl || undefined} alt={profile.displayName} />
              <AvatarFallback>{profile.displayName[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="space-y-1 text-center sm:text-left flex-1">
              <CardTitle className="text-3xl">{profile.displayName}</CardTitle>
              <CardDescription>@{profile.username} • {profile.email}</CardDescription>
              {profile.bio && <p className="text-sm text-muted-foreground mt-2">{profile.bio}</p>}
              <div className="flex gap-2 justify-center sm:justify-start mt-2">
                {profile.isAdmin && <Badge variant="destructive">Admin</Badge>}
                {profile.isModerator && <Badge variant="secondary">Moderador</Badge>}
                {!profile.isAdmin && !profile.isModerator && <Badge variant="outline">Usuario</Badge>}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center sm:justify-start">
          <Button onClick={() => router.push('/profile/edit')}>
            Modificar mi información
          </Button>
          <Button variant="outline" onClick={() => router.push('/profile/reports')}>
            Mis Reportes
          </Button>
          <ExportButton />
        </CardFooter>
      </Card>

<<<<<<< HEAD
      {/* CARD: Listas Predefinidas (Tabs) */}
      <Card className="max-w-4xl mx-auto">
=======
      <Card>
>>>>>>> d3e59e8a72b3b9ecd4bb64f73b81cc23f36469ab
        <Tabs defaultValue="pending" className="w-full">
          <CardHeader>
            <TabsList className="grid w-full grid-cols-3 h-auto">
              {listTabs.map(tab => (
                <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
              ))}
            </TabsList>
          </CardHeader>

          {listTabs.map(tab => (
            <TabsContent key={tab.value} value={tab.value}>
              <CardContent className="space-y-4">
                <ListPrivacyToggle
                  isPublic={profile.listSettings[tab.value] === 'public'}
                  onCheckedChange={(isPublic) => handlePrivacyChange(tab.value, isPublic)}
                />
                <UserMediaList 
                  items={profile.lists[tab.value] as unknown as TitleInfo[]} 
                  onRemoveItem={(itemId) => handleRemoveFromPredefinedList(tab.value, itemId)}
                />
                {profile.lists[tab.value].length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No hay elementos en esta lista todavía.
                  </p>
                )}
              </CardContent>
            </TabsContent>
          ))}
        </Tabs>
      </Card>
      
      {/* CARD: Listas Personalizadas */}
      <CustomListsCard 
        lists={profile.customLists as any}
        onCreate={handleCreateList}
        onEdit={handleEditList}
        onDelete={handleDeleteList}
        onRemoveItem={handleRemoveItemFromList}
        onPrivacyChange={handleCustomListPrivacyChange}
      />

<<<<<<< HEAD
      {/* CARD: Contribuciones */}
      <div className="max-w-4xl mx-auto">
        <UserContributionsCard contributions={profile.contributions} />
      </div>

      {/* CARD: Favoritos Generales (Anime, Manga, Novelas) */}
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Favoritos - Series y Mangas</CardTitle>
          <CardDescription>
            Tus series, películas, mangas y novelas favoritas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ListPrivacyToggle
            isPublic={profile.listSettings.favorites === 'public'}
            onCheckedChange={(isPublic) => handlePrivacyChange('favorites', isPublic)}
          />
          <UserMediaList 
            items={profile.lists.favorites as unknown as TitleInfo[]} 
            onRemoveItem={(itemId) => handleRemoveFromPredefinedList('favorites', itemId)}
          />
          {profile.lists.favorites.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No tienes favoritos todavía.
            </p>
          )}
        </CardContent>
=======
      <Card>
          <CardHeader>
            <CardTitle>Favoritos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <ListPrivacyToggle
                isPublic={listSettings.favorites === 'public'}
                onCheckedChange={(isPublic) => handlePrivacyChange('favorites', isPublic)}
                />
            <UserMediaList items={user.lists.favorites} />
          </CardContent>
>>>>>>> d3e59e8a72b3b9ecd4bb64f73b81cc23f36469ab
      </Card>

      {/* CARD: Favoritos de Personas (Personajes, Actores de Voz, Staff) */}
      <FavoritesCard userId={profile.id} isOwnProfile={true} />
    </div>
  );
}
