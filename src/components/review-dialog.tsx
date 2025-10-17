'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mediaId: string;
  mediaType: 'anime' | 'manga' | 'novel';
  mediaTitle: string;
  existingReview?: {
    id: string;
    content: string;
    overallScore: number;
  } | null;
  onReviewSubmitted?: () => void;
}

export default function ReviewDialog({
  open,
  onOpenChange,
  mediaId,
  mediaType,
  mediaTitle,
  existingReview,
  onReviewSubmitted,
}: ReviewDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [score, setScore] = useState(existingReview?.overallScore || 0);
  const [hoverScore, setHoverScore] = useState(0);
  const [content, setContent] = useState(existingReview?.content || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Debes iniciar sesión para escribir una reseña',
      });
      return;
    }

    if (score === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Debes seleccionar una puntuación',
      });
      return;
    }

    if (content.trim().length < 20) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'La reseña debe tener al menos 20 caracteres',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (existingReview) {
        // Actualizar review existente
        const response = await fetch(`/api/user/reviews/${existingReview.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            userId: user.id,
            content: content.trim(),
            overallScore: score,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al actualizar la reseña');
        }

        toast({
          title: 'Reseña actualizada',
          description: 'Tu reseña ha sido actualizada correctamente',
        });
      } else {
        // Crear nueva review
        const response = await fetch('/api/user/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            userId: user.id,
            reviewableType: mediaType,
            reviewableId: mediaId,
            content: content.trim(),
            overallScore: score,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al crear la reseña');
        }

        toast({
          title: 'Reseña publicada',
          description: 'Tu reseña ha sido publicada correctamente',
        });
      }

      // Llamar callback y cerrar dialog
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
      onOpenChange(false);
      
      // Resetear formulario si es creación
      if (!existingReview) {
        setScore(0);
        setContent('');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo guardar la reseña',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium mr-2">Puntuación:</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setScore(value)}
              onMouseEnter={() => setHoverScore(value)}
              onMouseLeave={() => setHoverScore(0)}
              className="transition-transform hover:scale-110 focus:outline-none"
            >
              <Star
                size={24}
                className={`${
                  value <= (hoverScore || score)
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-300 dark:text-gray-600'
                } transition-colors`}
              />
            </button>
          ))}
        </div>
        {score > 0 && (
          <span className="ml-2 text-sm font-bold">{score}/10</span>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {existingReview ? 'Editar reseña' : 'Escribir reseña'}
          </DialogTitle>
          <DialogDescription>
            {mediaTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {renderStars()}

          <div>
            <label className="text-sm font-medium mb-2 block">
              Tu reseña (mínimo 20 caracteres)
            </label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escribe tu opinión sobre este título... ¿Qué te pareció? ¿Lo recomendarías?"
              className="min-h-[150px] resize-none"
              maxLength={2000}
            />
            <div className="text-xs text-muted-foreground mt-1 text-right">
              {content.length}/2000 caracteres
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || score === 0 || content.trim().length < 20}
          >
            {isSubmitting ? 'Guardando...' : existingReview ? 'Actualizar' : 'Publicar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
