'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TitleInfo, UserList, CustomList as CustomListType } from '@/lib/types';
import UserMediaList from '@/components/user-media-list';
import ListPrivacyToggle from '@/components/list-privacy-toggle';
import { useToast } from '@/hooks/use-toast';
import CustomListsCard from '@/components/custom-lists-card';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // State to manage list privacy settings locally
  const [listSettings, setListSettings] = useState(user?.listSettings);
  const [customLists, setCustomLists] = useState<CustomListType[]>(user?.customLists || []);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else {
      setListSettings(user.listSettings);
      setCustomLists(user.customLists || []);
    }
  }, [user, router]);

  const handlePrivacyChange = (list: UserList, isPublic: boolean) => {
    // PSQL: En una implementación real, esto sería una llamada a la API
    // para actualizar la base de datos:
    // `UPDATE user_list_settings SET ${list}_privacy = '${isPublic ? 'public' : 'private'}' WHERE user_id = $1;`
    // Por ahora, solo actualizamos el estado local para la simulación.
    if (listSettings && user) {
        const newSettings = { ...listSettings, [list]: isPublic ? 'public' : 'private' as 'public' | 'private' };
        setListSettings(newSettings);
        updateUser({ ...user, listSettings: newSettings });
        toast({
            title: 'Privacidad actualizada',
            description: `La lista '${list}' ahora es ${isPublic ? 'pública' : 'privada'}.`,
        });
    }
  };

  const handleCreateList = (name: string) => {
    // PSQL: `INSERT INTO custom_lists (user_id, name) VALUES ($1, $2) RETURNING *;`
    if (user) {
        const newList: CustomListType = {
            id: `custom-${Date.now()}`,
            name,
            items: [],
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
    // PSQL: `UPDATE custom_lists SET name = $1 WHERE id = $2 AND user_id = $3;`
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
    // PSQL: `DELETE FROM custom_lists WHERE id = $1 AND user_id = $2;`
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
    // PSQL: `DELETE FROM custom_list_items WHERE list_id = $1 AND item_id = $2;`
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


  if (!user || !listSettings) {
    return <p className="text-center p-8">Redirigiendo...</p>;
  }

  const listTabs: { name: string, value: UserList, label: string }[] = [
      { name: "Pendiente", value: 'pending', label: "Pendiente" },
      { name: "Siguiendo", value: 'following', label: "Siguiendo" },
      { name: "Visto/Leído", value: 'watched', label: "Visto/Leído" },
  ];

  return (
    <main className="container mx-auto p-4 sm:p-8 space-y-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user.image} alt={user.name} />
              <AvatarFallback>{user.name[0]}</AvatarFallback>
            </Avatar>
            <div className="space-y-1 text-center sm:text-left">
              <CardTitle className="text-3xl">{user.name}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
              <Badge variant="secondary" className="capitalize">{user.role}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardFooter className="flex justify-center sm:justify-start">
          <Button>
            Modificar mi información
          </Button>
        </CardFooter>
      </Card>

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
                    isPublic={listSettings[tab.value] === 'public'}
                    onCheckedChange={(isPublic) => handlePrivacyChange(tab.value, isPublic)}
                  />
                  <UserMediaList items={user.lists[tab.value]} />
                </CardContent>
              </TabsContent>
            ))}
        </Tabs>
      </Card>
      
      <CustomListsCard 
        lists={customLists}
        onCreate={handleCreateList}
        onEdit={handleEditList}
        onDelete={handleDeleteList}
        onRemoveItem={handleRemoveItemFromList}
      />

      <Card className="max-w-4xl mx-auto">
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
      </Card>
    </main>
  );
}
