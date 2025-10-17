'use client';

/**
 * @fileoverview ReviewsCard - Tarjeta para mostrar reseñas de usuarios.
 * 
 * Renderiza una lista de reseñas de usuarios para un título específico.
 * Cada reseña individual muestra:
 * - El avatar y nombre del autor de la reseña.
 * - Una calificación por estrellas (1-10).
 * - El contenido de la reseña.
 * - Botones para votar como útil/no útil.
 * - Contador de votos útiles.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Review {
  id: string;
  userId: string;
  content: string;
  overallScore: number;
  helpfulVotes: number;
  createdAt: string;
  updatedAt: string;
  user: {
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

interface ReviewsCardProps {
  mediaId: string;
  mediaType: 'anime' | 'manga' | 'novel';
  mediaTitle: string;
}

function ReviewItem({ review, onVote }: { review: Review; onVote: (reviewId: string, voteType: 'helpful' | 'not_helpful') => void }) {
  const { user } = useAuth();
  const [userVote, setUserVote] = useState<'helpful' | 'not_helpful' | null>(null);

  const isOwnReview = user && user.id.toString() === review.userId;

  const handleVote = async (voteType: 'helpful' | 'not_helpful') => {
    if (isOwnReview) return;
    
    if (userVote === voteType) {
      // Quitar voto
      setUserVote(null);
      await onVote(review.id, voteType);
    } else {
      // Nuevo voto o cambiar voto
      setUserVote(voteType);
      await onVote(review.id, voteType);
    }
  };

  const renderStars = () => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
          <Star
            key={value}
            size={14}
            className={`${
              value <= review.overallScore
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        ))}
      </div>
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="border-b last:border-0 pb-4 last:pb-0">
      <div className="flex gap-3">
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={review.user.avatarUrl || undefined} alt={review.user.displayName} />
          <AvatarFallback>{getInitials(review.user.displayName)}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-sm">{review.user.displayName}</p>
              <p className="text-xs text-muted-foreground">@{review.user.username}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="flex items-center gap-1">
                {renderStars()}
                <span className="ml-1 text-sm font-bold">{review.overallScore}/10</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(review.createdAt), { 
                  addSuffix: true, 
                  locale: es 
                })}
              </p>
            </div>
          </div>
          
          <p className="text-sm whitespace-pre-wrap">{review.content}</p>
          
          <div className="flex items-center gap-2">
            {!isOwnReview && user && (
              <>
                <Button
                  size="sm"
                  variant={userVote === 'helpful' ? 'default' : 'ghost'}
                  className="h-7 px-2 text-xs"
                  onClick={() => handleVote('helpful')}
                >
                  <ThumbsUp className="h-3 w-3 mr-1" />
                  Útil
                </Button>
                <Button
                  size="sm"
                  variant={userVote === 'not_helpful' ? 'secondary' : 'ghost'}
                  className="h-7 px-2 text-xs"
                  onClick={() => handleVote('not_helpful')}
                >
                  <ThumbsDown className="h-3 w-3 mr-1" />
                  No útil
                </Button>
              </>
            )}
            {review.helpfulVotes > 0 && (
              <span className="text-xs text-muted-foreground ml-auto">
                {review.helpfulVotes} {review.helpfulVotes === 1 ? 'persona encontró' : 'personas encontraron'} esto útil
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReviewsCard({ mediaId, mediaType, mediaTitle }: ReviewsCardProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadReviews();
  }, [mediaId, mediaType]);

  const loadReviews = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 ReviewsCard - Cargando reviews:', {
        mediaId,
        mediaType,
        url: `/api/user/reviews?reviewableType=${mediaType}&reviewableId=${mediaId}`
      });

      const response = await fetch(
        `/api/user/reviews?reviewableType=${mediaType}&reviewableId=${mediaId}`,
        { credentials: 'include' }
      );

      console.log('📊 Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Reviews recibidas:', data);
        setReviews(data.reviews || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Error response:', errorData);
      }
    } catch (error) {
      console.error('❌ Error al cargar reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (reviewId: string, voteType: 'helpful' | 'not_helpful') => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Debes iniciar sesión para votar',
      });
      return;
    }

    try {
      const response = await fetch(`/api/user/reviews/${reviewId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: user.id,
          voteType,
        }),
      });

      if (response.ok) {
        // Recargar reviews para actualizar contadores
        await loadReviews();
        toast({
          title: 'Voto registrado',
          description: 'Tu voto ha sido registrado correctamente',
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo registrar tu voto',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Aún no hay reseñas para este título.</p>
        <p className="text-sm mt-2">¡Sé el primero en escribir una!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <ReviewItem key={review.id} review={review} onVote={handleVote} />
      ))}
    </div>
  );
}
