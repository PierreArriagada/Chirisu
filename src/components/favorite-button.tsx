'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';

interface FavoriteButtonProps {
  itemType: 'character' | 'voice_actor' | 'staff' | 'anime' | 'manga' | 'novel';
  itemId: number;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
}

export function FavoriteButton({ 
  itemType, 
  itemId, 
  variant = 'ghost',
  size = 'icon',
  showLabel = false 
}: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      checkFavoriteStatus();
    } else {
      setIsLoading(false);
    }
  }, [user, itemType, itemId]);

  const checkFavoriteStatus = async () => {
    if (!user) return;

    try {
      const response = await fetch(
        `/api/favorites?userId=${user.id}&type=${itemType}&itemId=${itemId}`
      );

      if (response.ok) {
        const data = await response.json();
        setIsFavorite(data.inFavorites);
      }
    } catch (error) {
      console.error('Error checking favorite status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      toast({
        title: 'Inicia sesión',
        description: 'Debes iniciar sesión para agregar favoritos',
        variant: 'destructive',
      });
      router.push('/login');
      return;
    }

    setIsLoading(true);

    try {
      if (isFavorite) {
        // Eliminar de favoritos
        const response = await fetch('/api/favorites', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            favorableType: itemType,
            favorableId: itemId,
          }),
        });

        if (response.ok) {
          setIsFavorite(false);
          toast({
            title: '💔 Eliminado de favoritos',
            description: 'El elemento ha sido removido de tus favoritos',
          });
        } else {
          throw new Error('Error al eliminar');
        }
      } else {
        // Agregar a favoritos
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            favorableType: itemType,
            favorableId: itemId,
          }),
        });

        if (response.ok) {
          setIsFavorite(true);
          toast({
            title: '❤️ Agregado a favoritos',
            description: 'El elemento ha sido añadido a tus favoritos',
          });
        } else if (response.status === 409) {
          setIsFavorite(true);
        } else {
          throw new Error('Error al agregar');
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el favorito. Intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleFavorite}
      disabled={isLoading}
      className="transition-all duration-200"
    >
      <Heart
        className={`h-5 w-5 ${
          isFavorite 
            ? 'fill-red-500 text-red-500' 
            : 'text-muted-foreground hover:text-red-500'
        } transition-colors`}
      />
      {showLabel && (
        <span className="ml-2">
          {isFavorite ? 'En favoritos' : 'Agregar a favoritos'}
        </span>
      )}
    </Button>
  );
}
