'use client';

/**
 * ========================================
 * AUTH CONTEXT - GESTIÓN DE AUTENTICACIÓN
 * ========================================
 * 
 * CAMBIOS PRINCIPALES:
 * - ❌ YA NO USA simulatedUsers array
 * - ✅ LLAMA A /api/auth/login
 * - ✅ LLAMA A /api/auth/logout
 * - ✅ LLAMA A /api/auth/session
 * - ✅ Restaura sesión al cargar la app
 */

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { TitleInfo, MediaType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Normaliza el tipo de media desde la BD (lowercase) al tipo TypeScript (capitalized)
 */
function normalizeMediaType(type: string): MediaType {
  const typeMap: Record<string, MediaType> = {
    'anime': 'Anime',
    'manga': 'Manga',
    'novel': 'Novela',
    'manhua': 'Manhua',
    'manwha': 'Manwha',
    'dougua': 'Dougua',
  };
  return typeMap[type.toLowerCase()] || 'Anime';
}

/**
 * Des-normaliza el tipo de media de TypeScript (capitalized) a BD (lowercase)
 */
function denormalizeMediaType(type: MediaType): string {
  const typeMap: Record<MediaType, string> = {
    'Anime': 'anime',
    'Manga': 'manga',
    'Novela': 'novel',
    'Manhua': 'manhua',
    'Manwha': 'manwha',
    'Dougua': 'dougua',
    'Fan Comic': 'fan-comic',
  };
  return typeMap[type] || 'anime';
}

// ============================================
// TIPOS
// ============================================

// Interfaz de Usuario (actualizada para coincidir con PostgreSQL)
export interface User {
  id: number;  // Cambió de string a number
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  isAdmin: boolean;
  isModerator: boolean;
  // Listas de usuario
  lists?: {
    pending: TitleInfo[];
    following: TitleInfo[];
    watched: TitleInfo[];
    favorites: TitleInfo[];
  };
  customLists?: Array<{
    id: string;
    name: string;
    items: TitleInfo[];
    isPublic: boolean;
  }>;
}

// 1. Define la estructura del contexto de autenticación
interface AuthContextType {
  user: User | null;
  loading: boolean;  // NUEVO: indica si está cargando la sesión
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;  // Ahora es async
  updateUser: (user: User) => void;
  toggleFavorite: (title: TitleInfo) => Promise<void>;  // Ahora es async
  addToList: (title: TitleInfo, listName: string, isCustom: boolean) => Promise<void>;  // Ahora es async
  removeFromList: (title: TitleInfo, listName: string, isCustom: boolean) => void;
  createCustomList: (name: string) => Promise<void>;  // Ahora es async
}

// 2. Crea el contexto con un valor inicial nulo
const AuthContext = createContext<AuthContextType | null>(null);

// 3. Crea un "Hook" personalizado para usar el contexto fácilmente
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}

// 4. Crea el componente "Proveedor" que envolverá la aplicación
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);  // NUEVO: estado de carga
  const router = useRouter();
  const { toast } = useToast();

  // ==========================================
  // EFECTO: RESTAURAR SESIÓN AL CARGAR LA APP
  // ==========================================
  useEffect(() => {
    async function checkSession() {
      try {
        // Llamar a la API para verificar si hay sesión activa
        const response = await fetch('/api/auth/session', {
          credentials: 'include',  // Incluir cookies
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            // Cargar listas del usuario
            const listsResponse = await fetch(`/api/user/lists?userId=${data.user.id}`, {
              credentials: 'include',
            });

            if (listsResponse.ok) {
              const listsData = await listsResponse.json();
              
              // Mapear listas por defecto
              const defaultListsMap: any = {
                pending: [],
                following: [],
                watched: [],
                favorites: [],
              };

              // Cargar favoritos con items completos
              const favoritesResponse = await fetch(`/api/user/favorites?userId=${data.user.id}`, {
                credentials: 'include',
              });

              if (favoritesResponse.ok) {
                const favoritesData = await favoritesResponse.json();
                defaultListsMap.favorites = (favoritesData.favorites || []).map((fav: any) => ({
                  id: fav.itemId,
                  slug: fav.slug,
                  title: fav.title,
                  type: normalizeMediaType(fav.type),
                  imageUrl: fav.coverImage,
                  imageHint: fav.title,
                  rating: fav.averageScore || 0,
                  ranking: 0,
                  commentsCount: 0,
                  listsCount: 0,
                  description: '',
                }));
              }

              // Cargar items de cada lista por defecto
              for (const list of listsData.defaultLists || []) {
                const itemsResponse = await fetch(`/api/user/lists/${list.id}/items`, {
                  credentials: 'include',
                });

                if (itemsResponse.ok) {
                  const itemsData = await itemsResponse.json();
                  const items = (itemsData.items || []).map((item: any) => ({
                    id: item.itemId,
                    slug: item.slug,
                    title: item.title,
                    type: normalizeMediaType(item.type),
                    imageUrl: item.coverImage,
                    imageHint: item.title,
                    rating: item.averageScore || 0,
                    ranking: 0,
                    commentsCount: 0,
                    listsCount: 0,
                    description: '',
                    status: item.status,
                    progress: item.progress,
                    score: item.score,
                  }));

                  // Mapear según el slug de la lista
                  if (list.slug === 'pendiente' || list.name.toLowerCase().includes('pendiente')) {
                    defaultListsMap.pending = items;
                  } else if (list.slug === 'siguiendo' || list.name.toLowerCase().includes('siguiendo')) {
                    defaultListsMap.following = items;
                  } else if (list.slug === 'completado' || list.name.toLowerCase().includes('completado') || list.name.toLowerCase().includes('visto')) {
                    defaultListsMap.watched = items;
                  }
                }
              }

              // Cargar listas personalizadas con sus items
              const customListsWithItems = await Promise.all(
                (listsData.customLists || []).map(async (list: any) => {
                  const itemsResponse = await fetch(`/api/user/lists/${list.id}/items`, {
                    credentials: 'include',
                  });

                  let items = [];
                  if (itemsResponse.ok) {
                    const itemsData = await itemsResponse.json();
                    items = (itemsData.items || []).map((item: any) => ({
                      id: item.itemId,
                      slug: item.slug,
                      title: item.title,
                      type: normalizeMediaType(item.type),
                      imageUrl: item.coverImage,
                      imageHint: item.title,
                      rating: item.averageScore || 0,
                      ranking: 0,
                      commentsCount: 0,
                      listsCount: 0,
                      description: '',
                    }));
                  }

                  return {
                    id: list.id,
                    name: list.name,
                    items,
                    isPublic: list.isPublic,
                  };
                })
              );

              setUser({
                ...data.user,
                lists: defaultListsMap,
                customLists: customListsWithItems,
              });
            } else {
              setUser(data.user);
            }
          }
        }
      } catch (error) {
        console.error('❌ Error al verificar sesión:', error);
      } finally {
        setLoading(false);  // Terminó de cargar
      }
    }

    checkSession();
  }, []);

  // ==========================================
  // LOGIN: LLAMA A /api/auth/login
  // ==========================================
  const login = async (email: string, password: string): Promise<void> => {
    try {
      // 1. Llamar a la API de login
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',  // Importante: incluir cookies
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      // 2. Manejar errores del servidor
      if (!response.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      // 3. Login exitoso: guardar usuario en el estado
      setUser(data.user);
      
      // 4. Mostrar notificación de éxito (opcional)
      toast({
        title: '¡Bienvenido!',
        description: `Has iniciado sesión como ${data.user.displayName}`,
      });
      
    } catch (error) {
      // Re-lanzar el error para que lo capture el componente de login
      throw error;
    }
  };

  const updateUser = (updatedUser: User) => {
    // PSQL: Esta función haría una llamada a la API para actualizar los datos del usuario.
    // `UPDATE users SET ... WHERE id = $1`
    // O `UPDATE user_lists SET ... WHERE user_id = $1`
    setUser(updatedUser);
  };
  
  // ==========================================
  // TOGGLE FAVORITE: Añadir/quitar de favoritos (API real)
  // ==========================================
  const toggleFavorite = async (title: TitleInfo) => {
    if (!user) {
        toast({
            variant: "destructive",
            title: "Necesitas iniciar sesión",
            description: "Para añadir a favoritos, primero debes iniciar sesión.",
        });
        router.push('/login');
        return;
    }

    if (!user.lists) {
      user.lists = {
        pending: [],
        following: [],
        watched: [],
        favorites: [],
      };
    }

    const isAlreadyFavorite = user.lists.favorites.some(fav => fav.id === title.id);

    try {
      if (isAlreadyFavorite) {
        // Quitar de favoritos
        const response = await fetch('/api/user/favorites', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            userId: user.id,
            itemType: denormalizeMediaType(title.type),
            itemId: title.id,
          }),
        });

        if (!response.ok) {
          throw new Error('Error al eliminar de favoritos');
        }

        // Actualizar estado local
        const updatedFavorites = user.lists.favorites.filter(fav => fav.id !== title.id);
        setUser({
          ...user,
          lists: {
            ...user.lists,
            favorites: updatedFavorites,
          },
        });

        toast({
          title: 'Eliminado de favoritos',
          description: `"${title.title}" ha sido eliminado de tus favoritos.`,
        });
      } else {
        // Añadir a favoritos
        const response = await fetch('/api/user/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            userId: user.id,
            itemType: denormalizeMediaType(title.type),
            itemId: title.id,
          }),
        });

        if (!response.ok) {
          throw new Error('Error al añadir a favoritos');
        }

        // Actualizar estado local
        const updatedFavorites = [...user.lists.favorites, title];
        setUser({
          ...user,
          lists: {
            ...user.lists,
            favorites: updatedFavorites,
          },
        });

        toast({
          title: 'Añadido a favoritos',
          description: `"${title.title}" ha sido añadido a tus favoritos.`,
        });
      }
    } catch (error) {
      console.error('❌ Error al actualizar favoritos:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo actualizar favoritos. Intenta de nuevo.',
      });
    }
  };

  // ==========================================
  // ADD TO LIST: Añadir/quitar título de una lista (API real)
  // ==========================================
  const addToList = async (title: TitleInfo, listName: string, isCustom: boolean) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Necesitas iniciar sesión",
      });
      router.push('/login');
      return;
    }

    if (!user.lists) {
      user.lists = {
        pending: [],
        following: [],
        watched: [],
        favorites: [],
      };
    }

    if (!user.customLists) {
      user.customLists = [];
    }

    try {
      if (isCustom) {
        // Añadir/quitar de lista personalizada
        const listIndex = user.customLists.findIndex(l => l.id === listName);
        if (listIndex === -1) return;

        const list = user.customLists[listIndex];
        const isInList = list.items.some(item => item.id === title.id);

        if (isInList) {
          // Quitar de la lista
          const response = await fetch(`/api/user/lists/${listName}/items`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              itemType: denormalizeMediaType(title.type),
              itemId: title.id,
            }),
          });

          if (!response.ok) {
            throw new Error('Error al eliminar de la lista');
          }

          user.customLists[listIndex].items = list.items.filter(item => item.id !== title.id);
          toast({
            title: 'Eliminado de la lista',
            description: `"${title.title}" eliminado de "${list.name}"`,
          });
        } else {
          // Añadir a la lista
          const response = await fetch(`/api/user/lists/${listName}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              itemType: denormalizeMediaType(title.type),
              itemId: title.id,
              status: 'pendiente',
            }),
          });

          if (!response.ok) {
            throw new Error('Error al añadir a la lista');
          }

          user.customLists[listIndex].items.push(title);
          toast({
            title: 'Añadido a la lista',
            description: `"${title.title}" añadido a "${list.name}"`,
          });
        }

        setUser({ ...user, customLists: [...user.customLists] });
      } else {
        // Añadir a lista por defecto (pendiente, siguiendo, visto)
        const listKey = listName as keyof typeof user.lists;
        if (!user.lists[listKey]) return;

        const isInList = user.lists[listKey].some(item => item.id === title.id);

        // Mapear el nombre de la lista del frontend al slug de la BD
        const listSlugMap: Record<string, string> = {
          'pending': 'pendiente',
          'following': 'siguiendo',
          'watched': 'completado',
          'favorites': 'favoritos',
        };

        const dbSlug = listSlugMap[listName] || listName;

        // Primero obtener el ID de la lista por defecto
        const listsResponse = await fetch(`/api/user/lists?userId=${user.id}`, {
          credentials: 'include',
        });

        if (!listsResponse.ok) {
          throw new Error('Error al obtener listas');
        }

        const listsData = await listsResponse.json();
        const defaultList = listsData.defaultLists.find((l: any) => 
          l.slug === dbSlug
        );

        if (!defaultList) {
          console.error(`❌ Lista no encontrada. Buscando slug: "${dbSlug}", listName recibido: "${listName}"`);
          console.error('Listas disponibles:', listsData.defaultLists.map((l: any) => l.slug));
          throw new Error(`Lista "${listName}" no encontrada`);
        }

        if (isInList) {
          // Quitar de la lista
          const response = await fetch(`/api/user/lists/${defaultList.id}/items`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              itemType: denormalizeMediaType(title.type),
              itemId: title.id,
            }),
          });

          if (!response.ok) {
            throw new Error('Error al eliminar de la lista');
          }

          user.lists[listKey] = user.lists[listKey].filter(item => item.id !== title.id);
          toast({
            title: 'Eliminado de la lista',
          });
        } else {
          // Añadir a la lista
          const response = await fetch(`/api/user/lists/${defaultList.id}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              itemType: denormalizeMediaType(title.type),
              itemId: title.id,
              status: listKey === 'watched' ? 'completado' : listKey === 'following' ? 'viendo' : 'pendiente',
            }),
          });

          if (!response.ok) {
            throw new Error('Error al añadir a la lista');
          }

          user.lists[listKey] = [...user.lists[listKey], title];
          toast({
            title: 'Añadido a la lista',
          });
        }

        setUser({ ...user, lists: { ...user.lists } });
      }
    } catch (error: any) {
      console.error('❌ Error al actualizar lista:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo actualizar la lista. Intenta de nuevo.',
      });
    }
  };

  // ==========================================
  // REMOVE FROM LIST: Quitar título de una lista
  // ==========================================
  const removeFromList = (title: TitleInfo, listName: string, isCustom: boolean) => {
    if (!user || !user.lists || !user.customLists) return;

    if (isCustom) {
      const listIndex = user.customLists.findIndex(l => l.id === listName);
      if (listIndex === -1) return;

      user.customLists[listIndex].items = user.customLists[listIndex].items.filter(
        item => item.id !== title.id
      );
      setUser({ ...user, customLists: [...user.customLists] });
    } else {
      const listKey = listName as keyof typeof user.lists;
      if (!user.lists[listKey]) return;

      user.lists[listKey] = user.lists[listKey].filter(item => item.id !== title.id);
      setUser({ ...user, lists: { ...user.lists } });
    }
  };

  // ==========================================
  // CREATE CUSTOM LIST: Crear nueva lista personalizada (API real)
  // ==========================================
  const createCustomList = async (name: string) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Necesitas iniciar sesión",
      });
      router.push('/login');
      return;
    }

    if (!user.customLists) {
      user.customLists = [];
    }

    try {
      const response = await fetch('/api/user/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: user.id,
          name,
          isPublic: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear la lista');
      }

      const data = await response.json();
      const newList = {
        id: data.list.id,
        name: data.list.name,
        items: [],
        isPublic: data.list.isPublic,
      };

      setUser({
        ...user,
        customLists: [...user.customLists, newList],
      });

      toast({
        title: 'Lista creada',
        description: `"${name}" ha sido creada exitosamente`,
      });
    } catch (error: any) {
      console.error('❌ Error al crear lista:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo crear la lista. Intenta de nuevo.',
      });
    }
  };


  // ==========================================
  // LOGOUT: LLAMA A /api/auth/logout
  // ==========================================
  const logout = async (): Promise<void> => {
    try {
      // 1. Llamar a la API de logout para eliminar la cookie
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      // 2. Limpiar estado local
      setUser(null);
      
      // 3. Mostrar notificación
      toast({
        title: 'Sesión cerrada',
        description: 'Has cerrado sesión correctamente.',
      });
      
      // 4. Redirigir al inicio
      router.push('/');
      
    } catch (error) {
      console.error('❌ Error al cerrar sesión:', error);
      
      // Incluso si falla la API, limpiar el estado local
      setUser(null);
      router.push('/');
      
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Hubo un problema al cerrar sesión, pero se limpió la sesión local.',
      });
    }
  };

  const value = {
    user,
    loading,  // NUEVO: exponer el estado de carga
    login,
    logout,
    updateUser,
    toggleFavorite,
    addToList,
    removeFromList,
    createCustomList,
  };

  // Mostrar spinner mientras carga la sesión inicial
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
