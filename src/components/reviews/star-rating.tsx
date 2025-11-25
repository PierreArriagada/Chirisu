/**
 * @fileoverview StarRating - Componente para mostrar una calificación con estrellas.
 * 
 * Renderiza una calificación numérica como una serie de iconos de estrellas.
 * Es configurable para mostrar un número máximo de estrellas (`maxStars`) y
 * ajustar su tamaño (`starSize`). Las estrellas llenas representan la
 * calificación, mientras que las vacías completan el total. Se utiliza
 * en las tarjetas de reseñas (`ReviewsCard`) y en las listas de usuario.
 */

'use client';

import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  starSize?: number;
}

export default function StarRating({ rating, maxStars = 5, starSize = 20 }: StarRatingProps) {
  const fullStars = Math.floor(rating / (10 / maxStars));
  const emptyStars = maxStars - fullStars;

  return (
    <div className="flex items-center gap-1">
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} size={starSize} className={cn('text-chart-1 fill-chart-1')} />
      ))}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} size={starSize} className={cn('text-muted-foreground/30')} />
      ))}
    </div>
  );
}
