'use client';

import { useState } from 'react';
import ReviewsCard from './cards/reviews-card';
import { ReviewDialog } from '@/components/reviews';
import { useAuth } from '@/context/auth-context';

// Tipo específico para Review según reviews-card
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

interface ReviewsSectionProps {
  mediaId: string;
  mediaType: 'anime' | 'manga' | 'novel';
  mediaTitle: string;
}

/**
 * Wrapper cliente para gestionar el estado compartido entre ReviewsCard y ReviewDialog
 */
export function ReviewsSection({ mediaId, mediaType, mediaTitle }: ReviewsSectionProps) {
  const { user } = useAuth();
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  const handleEditReview = (review: Review) => {
    console.log('📝 ReviewsSection handleEditReview:', {
      reviewId: review.id,
      content: review.content,
      score: review.overallScore
    });
    setExistingReview(review);
    setIsReviewDialogOpen(true);
  };

  const handleReviewSubmitted = () => {
    setExistingReview(null);
    setIsReviewDialogOpen(false);
    // Forzar recarga de reviews
    setReloadTrigger(prev => prev + 1);
  };

  return (
    <>
      <ReviewsCard 
        mediaId={mediaId} 
        mediaType={mediaType as any} 
        mediaTitle={mediaTitle}
        onEditReview={handleEditReview}
        reloadTrigger={reloadTrigger}
      />

      {user && (
        <ReviewDialog
          open={isReviewDialogOpen}
          onOpenChange={(open) => {
            setIsReviewDialogOpen(open);
            if (!open) {
              setExistingReview(null);
            }
          }}
          mediaId={mediaId}
          mediaType={mediaType}
          mediaTitle={mediaTitle}
          existingReview={existingReview ? {
            id: existingReview.id,
            content: existingReview.content,
            overallScore: existingReview.overallScore
          } : null}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}
    </>
  );
}
