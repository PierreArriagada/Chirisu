'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TitleInfo, UserList } from '@/lib/types';
import UserMediaList from '@/components/user-media-list';
import ListPrivacyToggle from '@/components/list-privacy-toggle';

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();

  // State to manage list privacy settings locally
  const [listSettings, setListSettings] = useState(user?.listSettings);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else {
      setListSettings(user.listSettings);
    }
  }, [user, router]);

  const handlePrivacyChange = (list: UserList, isPublic: boolean) => {
    // PSQL: En una implementación real, esto sería una llamada a la API
    // para actualizar la base de datos:
    // `UPDATE user_list_settings SET ${list}_privacy = '${isPublic ? 'public' : 'private'}' WHERE user_id = $1;`
    // Por ahora, solo actualizamos el estado local para la simulación.
    if (listSettings) {
        const newSettings = { ...listSettings, [list]: isPublic ? 'public' : 'private' as 'public' | 'private' };
        setListSettings(newSettings);
        console.log(`La lista '${list}' ahora es ${isPublic ? 'pública' : 'privada'}.`);
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
