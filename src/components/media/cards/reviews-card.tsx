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
import { Star, ThumbsUp, ThumbsDown, Edit, Trash2, Flag } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { ReportReviewDialog } from '@/components/media/report-review-dialog';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
  mediaType: 'anime' | 'manga' | 'novel' | 'donghua' | 'manhua' | 'manhwa' | 'fan_comic';
  mediaTitle: string;
  onEditReview?: (review: Review) => void;
  reloadTrigger?: number;
}

interface ReviewItemProps {
  review: Review;
  onVote: (reviewId: string, voteType: 'helpful' | 'not_helpful') => void;
  onEdit: (review: Review) => void;
  onDelete: (reviewId: string) => void;
  onReport: (review: Review) => void;
}

function ReviewItem({ review, onVote, onEdit, onDelete, onReport }: ReviewItemProps) {
  const { user } = useAuth();
  const [userVote, setUserVote] = useState<'helpful' | 'not_helpful' | null>(null);

  const isOwnReview = user && String(user.id) === String(review.userId);
  const canModerate = user && (user.isAdmin || user.isModerator);
  const canEditOrDelete = isOwnReview || canModerate;

  // Debug
  console.log('🔍 Review Debug:', {
    reviewId: review.id,
    reviewUserId: review.userId,
    currentUserId: user?.id,
    isOwnReview,
    canModerate,
    canEditOrDelete,
    userIsAdmin: user?.isAdmin,
    userIsModerator: user?.isModerator
  });

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

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '??';
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
        <Link href={`/u/${review.user.username}`} className="flex-shrink-0">
          <Avatar className="h-10 w-10 hover:ring-2 hover:ring-primary transition-all cursor-pointer">
            <AvatarImage src={review.user.avatarUrl || undefined} alt={review.user.displayName || review.user.username} />
            <AvatarFallback>{getInitials(review.user.displayName || review.user.username)}</AvatarFallback>
          </Avatar>
        </Link>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <Link 
                href={`/u/${review.user.username}`}
                className="font-semibold text-sm hover:underline hover:text-primary transition-colors"
              >
                {review.user.displayName || review.user.username}
              </Link>
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
          
          <div className="flex items-center gap-2 flex-wrap">
            {/* Botones de acciones del autor y moderadores */}
            {canEditOrDelete && (
              <>
                {isOwnReview && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    onClick={() => {
                      console.log('🖱️ Click en Editar review');
                      onEdit(review);
                    }}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                  onClick={() => onDelete(review.id)}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  {canModerate && !isOwnReview ? 'Eliminar (Mod)' : 'Eliminar'}
                </Button>
              </>
            )}
            
            {/* Botones de votación para otros usuarios */}
            {!isOwnReview && user && (
              <>
                <Button
                  size="sm"
                  variant={userVote === 'helpful' ? 'default' : 'ghost'}
                  className="h-7 px-2 text-xs gap-1"
                  onClick={() => handleVote('helpful')}
                >
                  <ThumbsUp className="h-3 w-3" />
                  <span>{review.helpfulVotes || 0}</span>
                </Button>
                <Button
                  size="sm"
                  variant={userVote === 'not_helpful' ? 'secondary' : 'ghost'}
                  className="h-7 px-2 text-xs"
                  onClick={() => handleVote('not_helpful')}
                >
                  <ThumbsDown className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs"
                  onClick={() => onReport(review)}
                >
                  <Flag className="h-3 w-3 mr-1" />
                  Reportar
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReviewsCard({ mediaId, mediaType, mediaTitle, onEditReview, reloadTrigger }: ReviewsCardProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [reportingReview, setReportingReview] = useState<Review | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    reviewId: string | null;
  }>({ open: false, reviewId: null });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadReviews();
  }, [mediaId, mediaType]);

  // Recargar cuando cambia reloadTrigger
  useEffect(() => {
    if (reloadTrigger && reloadTrigger > 0) {
      loadReviews();
    }
  }, [reloadTrigger]);

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

  const handleEdit = (review: Review) => {
    console.log('🔧 handleEdit called:', {
      reviewId: review.id,
      hasCallback: !!onEditReview,
      review
    });
    
    if (onEditReview) {
      onEditReview(review);
    } else {
      setEditingReview(review);
    }
  };

  const handleDelete = async (reviewId: string) => {
    setDeleteDialog({ open: true, reviewId });
  };

  const confirmDelete = async () => {
    const reviewId = deleteDialog.reviewId;
    if (!user || !reviewId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Debes iniciar sesión',
      });
      return;
    }

    try {
      const response = await fetch(`/api/reviews/${reviewId}?userId=${user.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        await loadReviews();
        toast({
          title: 'Reseña eliminada',
          description: 'Tu reseña ha sido eliminada correctamente',
        });
        setDeleteDialog({ open: false, reviewId: null });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo eliminar la reseña',
      });
    }
  };

  const handleReport = (review: Review) => {
    setReportingReview(review);
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
    <>
      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewItem 
            key={review.id} 
            review={review} 
            onVote={handleVote}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onReport={handleReport}
          />
        ))}
      </div>

      {/* Diálogo de reporte */}
      {reportingReview && (
        <ReportReviewDialog
          reviewId={reportingReview.id}
          reviewAuthor={reportingReview.user.username}
          open={!!reportingReview}
          onClose={() => setReportingReview(null)}
          onSuccess={() => {
            toast({
              title: 'Reporte enviado',
              description: 'El equipo de moderación revisará tu reporte',
            });
          }}
        />
      )}

      {/* Diálogo de confirmación de eliminación */}
      <AlertDialog 
        open={deleteDialog.open} 
        onOpenChange={(open) => !open && setDeleteDialog({ open: false, reviewId: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar reseña?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Tu reseña será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
