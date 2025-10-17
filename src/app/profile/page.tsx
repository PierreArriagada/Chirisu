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
import UserMediaList from '@/components/user-media-list';
import ListPrivacyToggle from '@/components/list-privacy-toggle';
import { useToast } from '@/hooks/use-toast';
import CustomListsCard from '@/components/custom-lists-card';
import { Skeleton } from '@/components/ui/skeleton';

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
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
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
    // TODO: Implementar con API PATCH /api/user/lists/settings
    toast({
      title: 'Función en desarrollo',
      description: 'Pronto podrás cambiar la privacidad de tus listas.',
    });
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
    // TODO: Implementar con API DELETE /api/user/lists/:id/items/:itemId
    toast({
      title: 'Función en desarrollo',
      description: 'Pronto podrás eliminar items de tus listas.',
    });
  };
  
  const handleCustomListPrivacyChange = async (listId: string, isPublic: boolean) => {
    // TODO: Implementar con API PATCH /api/user/lists/:id/settings
    toast({
      title: 'Función en desarrollo',
      description: 'Pronto podrás cambiar la privacidad de tus listas.',
    });
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
      {/* CARD: Información del Usuario */}
      <Card className="max-w-4xl mx-auto">
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
        <CardFooter className="flex justify-center sm:justify-start">
          <Button onClick={() => router.push('/profile/edit')}>
            Modificar mi información
          </Button>
        </CardFooter>
      </Card>

      {/* CARD: Listas Predefinidas (Tabs) */}
      <Card className="max-w-4xl mx-auto">
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
                <UserMediaList items={profile.lists[tab.value] as unknown as TitleInfo[]} />
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

      {/* CARD: Favoritos */}
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Favoritos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ListPrivacyToggle
            isPublic={profile.listSettings.favorites === 'public'}
            onCheckedChange={(isPublic) => handlePrivacyChange('favorites', isPublic)}
          />
          <UserMediaList items={profile.lists.favorites as unknown as TitleInfo[]} />
          {profile.lists.favorites.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No tienes favoritos todavía.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
