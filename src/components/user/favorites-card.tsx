'use client';

import { useState, useEffect } from 'react';
import { SafeImage } from '@/components/ui/safe-image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, User, Mic, Briefcase, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { PrivacyToggle } from '@/components/lists';
import { useToast } from '@/hooks/use-toast';

interface FavoriteCharacter {
  id: number;
  name: string;
  image_url: string;
  slug: string;
}

interface FavoriteVoiceActor {
  id: number;
  name: string;
  image_url: string;
  slug: string;
  language: string;
}

interface FavoriteStaff {
  id: number;
  name: string;
  image_url: string;
  slug: string;
  primary_occupations: string[];
}

interface Favorite {
  id: number;
  type: string;
  favorableId: number;
  createdAt: string;
  details: FavoriteCharacter | FavoriteVoiceActor | FavoriteStaff;
}

interface FavoritesCardProps {
  userId: number;
  isOwnProfile?: boolean;
}

export default function FavoritesCard({ userId, isOwnProfile = true }: FavoritesCardProps) {
  const [characters, setCharacters] = useState<Favorite[]>([]);
  const [voiceActors, setVoiceActors] = useState<Favorite[]>([]);
  const [staff, setStaff] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [charactersPublic, setCharactersPublic] = useState(true);
  const [voiceActorsPublic, setVoiceActorsPublic] = useState(true);
  const [staffPublic, setStaffPublic] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadFavorites();
  }, [userId]);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      // Cargar personajes favoritos
      const charRes = await fetch(`/api/favorites?userId=${userId}&type=character`);
      const charData = await charRes.json();
      setCharacters(charData.favorites || []);

      // Cargar actores de voz favoritos
      const vaRes = await fetch(`/api/favorites?userId=${userId}&type=voice_actor`);
      const vaData = await vaRes.json();
      setVoiceActors(vaData.favorites || []);

      // Cargar staff favoritos
      const staffRes = await fetch(`/api/favorites?userId=${userId}&type=staff`);
      const staffData = await staffRes.json();
      setStaff(staffData.favorites || []);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLanguageFlag = (lang: string) => {
    switch (lang) {
      case 'ja': return '🇯🇵';
      case 'es': return '🇪🇸';
      case 'en': return '🇺🇸';
      default: return '🌐';
    }
  };

  // Funciones para cambiar privacidad por tipo
  const handleCharactersPrivacyToggle = async (isPublic: boolean) => {
    try {
      const response = await fetch('/api/favorites/privacy', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId.toString()
        },
        body: JSON.stringify({ isPublic, favorableType: 'character' })
      });

      if (response.ok) {
        setCharactersPublic(isPublic);
        toast({
          title: isPublic ? '🌍 Personajes públicos' : '🔒 Personajes privados',
          description: isPublic ? 'Tus personajes favoritos ahora son visibles para todos' : 'Tus personajes favoritos ahora son privados'
        });
      }
    } catch (error) {
      console.error('Error al cambiar privacidad de personajes:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cambiar la privacidad',
        variant: 'destructive'
      });
    }
  };

  const handleVoiceActorsPrivacyToggle = async (isPublic: boolean) => {
    try {
      const response = await fetch('/api/favorites/privacy', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId.toString()
        },
        body: JSON.stringify({ isPublic, favorableType: 'voice_actor' })
      });

      if (response.ok) {
        setVoiceActorsPublic(isPublic);
        toast({
          title: isPublic ? '🌍 Actores públicos' : '🔒 Actores privados',
          description: isPublic ? 'Tus actores favoritos ahora son visibles para todos' : 'Tus actores favoritos ahora son privados'
        });
      }
    } catch (error) {
      console.error('Error al cambiar privacidad de actores:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cambiar la privacidad',
        variant: 'destructive'
      });
    }
  };

  const handleStaffPrivacyToggle = async (isPublic: boolean) => {
    try {
      const response = await fetch('/api/favorites/privacy', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId.toString()
        },
        body: JSON.stringify({ isPublic, favorableType: 'staff' })
      });

      if (response.ok) {
        setStaffPublic(isPublic);
        toast({
          title: isPublic ? '🌍 Staff público' : '🔒 Staff privado',
          description: isPublic ? 'Tu staff favorito ahora es visible para todos' : 'Tu staff favorito ahora es privado'
        });
      }
    } catch (error) {
      console.error('Error al cambiar privacidad de staff:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cambiar la privacidad',
        variant: 'destructive'
      });
    }
  };

  // Función para eliminar favorito
  const handleRemoveFavorite = async (favoriteId: number, type: 'character' | 'voice_actor' | 'staff', favorableId: number) => {
    try {
      const response = await fetch(`/api/favorites?favorableId=${favorableId}&favorableType=${type}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Actualizar el estado local según el tipo
        if (type === 'character') {
          setCharacters(prev => prev.filter(fav => fav.id !== favoriteId));
        } else if (type === 'voice_actor') {
          setVoiceActors(prev => prev.filter(fav => fav.id !== favoriteId));
        } else if (type === 'staff') {
          setStaff(prev => prev.filter(fav => fav.id !== favoriteId));
        }

        toast({
          title: '✅ Favorito eliminado',
          description: 'Se ha eliminado de tus favoritos'
        });
      } else {
        throw new Error('Error al eliminar');
      }
    } catch (error) {
      console.error('Error al eliminar favorito:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el favorito',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            Favoritos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[2/3]" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalFavorites = characters.length + voiceActors.length + staff.length;

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-500 fill-red-500" />
          Favoritos - Personas
          <Badge variant="secondary">{totalFavorites}</Badge>
        </CardTitle>
        <CardDescription>
          Tus personajes, actores de voz y staff favoritos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="characters" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="characters" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Personajes
              {characters.length > 0 && (
                <Badge variant="outline" className="ml-1">{characters.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="voice-actors" className="flex items-center gap-2">
              <Mic className="w-4 h-4" />
              Actores de Voz
              {voiceActors.length > 0 && (
                <Badge variant="outline" className="ml-1">{voiceActors.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="staff" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Staff
              {staff.length > 0 && (
                <Badge variant="outline" className="ml-1">{staff.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Tab: Personajes */}
          <TabsContent value="characters" className="mt-6">
            {isOwnProfile && (
              <div className="mb-4">
                <PrivacyToggle
                  isPublic={charactersPublic}
                  onToggle={handleCharactersPrivacyToggle}
                />
              </div>
            )}
            {!isOwnProfile && !charactersPublic ? (
              <div className="text-center py-12">
                <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  🔒 Esta sección es privada
                </p>
              </div>
            ) : characters.length === 0 ? (
              <div className="text-center py-12">
                <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No tienes personajes favoritos todavía
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Explora <Link href="/characters" className="text-primary hover:underline">personajes</Link> y agrégalos a tus favoritos
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {characters.map((fav) => {
                  const char = fav.details as FavoriteCharacter;
                  return (
                    <div key={fav.id} className="relative group">
                      {isOwnProfile && (
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 z-10 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleRemoveFavorite(fav.id, 'character', fav.favorableId);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                      <Link href={`/character/${char.slug}`}>
                        <Card className="bg-card text-card-foreground hover:shadow-lg transition-all duration-200">
                          <div className="relative aspect-[2/3] overflow-hidden rounded-t-lg">
                            <SafeImage
                              src={char.image_url}
                              alt={char.name}
                              fill
                              className="group-hover:scale-105 transition-transform duration-200"
                              objectFit="cover"
                            />
                          </div>
                          <CardContent className="p-3">
                            <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                              {char.name}
                            </h3>
                          </CardContent>
                        </Card>
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Tab: Actores de Voz */}
          <TabsContent value="voice-actors" className="mt-6">
            {isOwnProfile && (
              <div className="mb-4">
                <PrivacyToggle
                  isPublic={voiceActorsPublic}
                  onToggle={handleVoiceActorsPrivacyToggle}
                />
              </div>
            )}
            {!isOwnProfile && !voiceActorsPublic ? (
              <div className="text-center py-12">
                <Mic className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  🔒 Esta sección es privada
                </p>
              </div>
            ) : voiceActors.length === 0 ? (
              <div className="text-center py-12">
                <Mic className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No tienes actores de voz favoritos todavía
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Explora <Link href="/voice-actors" className="text-primary hover:underline">actores de voz</Link> y agrégalos a tus favoritos
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {voiceActors.map((fav) => {
                  const va = fav.details as FavoriteVoiceActor;
                  return (
                    <div key={fav.id} className="relative group">
                      {isOwnProfile && (
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 z-10 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleRemoveFavorite(fav.id, 'voice_actor', fav.favorableId);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                      <Link href={`/voice-actor/${va.slug}`}>
                        <Card className="bg-card text-card-foreground hover:shadow-lg transition-all duration-200">
                          <div className="relative aspect-[2/3] overflow-hidden rounded-t-lg">
                            <SafeImage
                              src={va.image_url}
                              alt={va.name}
                              fill
                              className="group-hover:scale-105 transition-transform duration-200"
                              objectFit="cover"
                            />
                            <div className="absolute top-2 left-2">
                              <Badge className="text-xs">
                                {getLanguageFlag(va.language)}
                              </Badge>
                            </div>
                          </div>
                          <CardContent className="p-3">
                            <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                              {va.name}
                            </h3>
                          </CardContent>
                        </Card>
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Tab: Staff */}
          <TabsContent value="staff" className="mt-6">
            {isOwnProfile && (
              <div className="mb-4">
                <PrivacyToggle
                  isPublic={staffPublic}
                  onToggle={handleStaffPrivacyToggle}
                />
              </div>
            )}
            {!isOwnProfile && !staffPublic ? (
              <div className="text-center py-12">
                <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  🔒 Esta sección es privada
                </p>
              </div>
            ) : staff.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No tienes staff favoritos todavía
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Explora <Link href="/staff" className="text-primary hover:underline">staff</Link> y agrégalos a tus favoritos
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {staff.map((fav) => {
                  const member = fav.details as FavoriteStaff;
                  return (
                    <div key={fav.id} className="relative group">
                      {isOwnProfile && (
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 z-10 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleRemoveFavorite(fav.id, 'staff', fav.favorableId);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                      <Link href={`/staff/${member.slug}`}>
                        <Card className="bg-card text-card-foreground hover:shadow-lg transition-all duration-200">
                          <div className="relative aspect-[2/3] overflow-hidden rounded-t-lg">
                            <SafeImage
                              src={member.image_url}
                              alt={member.name}
                              fill
                              className="group-hover:scale-105 transition-transform duration-200"
                              objectFit="cover"
                            />
                          </div>
                          <CardContent className="p-3">
                            <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                              {member.name}
                            </h3>
                            {member.primary_occupations && member.primary_occupations.length > 0 && (
                              <Badge variant="outline" className="text-xs mt-2">
                                {member.primary_occupations[0]}
                              </Badge>
                            )}
                          </CardContent>
                        </Card>
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
