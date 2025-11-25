'use client';

/**
 * @fileoverview CommentItem - Componente individual de comentario
 * 
 * Muestra un comentario con:
 * - Avatar y nombre del usuario
 * - Contenido (con soporte para spoilers)
 * - Imágenes adjuntas (hasta 4)
 * - Botones de like, responder, editar, eliminar
 * - Botón para ver respuestas si las tiene
 */

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Heart, MessageCircle, MoreHorizontal, Edit, Trash2, Eye, EyeOff, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserAvatar } from '@/components/user';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { ReportCommentDialog } from './report-comment-dialog';
import type { Comment } from '@/lib/types';
import Link from 'next/link';

interface CommentItemProps {
  comment: Comment;
  onReply: (commentId: string) => void;
  onEdit: (comment: Comment) => void;
  onDelete: (commentId: string) => void;
  onLoadReplies: (commentId: string) => void;
  onLike: (commentId: string) => void;
  showReplies?: boolean;
  isReply?: boolean;
}

export function CommentItem({
  comment,
  onReply,
  onEdit,
  onDelete,
  onLoadReplies,
  onLike,
  showReplies = false,
  isReply = false,
}: CommentItemProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [spoilerRevealed, setSpoilerRevealed] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);

  // Comparación robusta: convertir ambos a string para asegurar comparación correcta
  const userId = user?.id ? String(user.id) : null;
  const commentUserId = String(comment.userId);
  const isAuthor = userId === commentUserId;
  
  const canEdit = isAuthor || user?.isAdmin || user?.isModerator;
  const canDelete = isAuthor || user?.isAdmin || user?.isModerator;
  const canReport = user && !isAuthor;

  const handleLike = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'Debes iniciar sesión para dar like',
        variant: 'destructive',
      });
      return;
    }

    if (isLiking) return;

    setIsLiking(true);
    try {
      await onLike(comment.id);
    } catch (error) {
      console.error('Error al dar like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleReply = () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'Debes iniciar sesión para responder',
        variant: 'destructive',
      });
      return;
    }
    onReply(comment.id);
  };

  return (
    <div className={`flex gap-2 sm:gap-3 ${isReply ? 'ml-8 sm:ml-12 mt-4' : 'py-4'}`}>
      {/* Avatar */}
      <UserAvatar
        avatarUrl={comment.user.avatarUrl}
        displayName={comment.user.displayName}
        username={comment.user.username}
        size={isReply ? 32 : 40}
      />

      {/* Contenido del comentario */}
      <div className="flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <Link 
            href={`/u/${comment.user.username}`}
            className="font-semibold text-sm hover:underline hover:text-primary transition-colors"
          >
            {comment.user.displayName}
          </Link>
          <Badge variant="secondary" className="text-xs">
            Nv.{comment.user.level}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: es })}
          </span>
          {comment.updatedAt !== comment.createdAt && (
            <span className="text-xs text-muted-foreground">(editado)</span>
          )}
        </div>

        {/* Contenido */}
        <div className="space-y-2">
          {comment.isSpoiler && !spoilerRevealed ? (
            <div 
              className="bg-muted p-3 rounded-md cursor-pointer hover:bg-muted/80 transition-colors"
              onClick={() => setSpoilerRevealed(true)}
            >
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <EyeOff className="h-4 w-4" />
                <span>Spoiler - Click para revelar</span>
              </div>
            </div>
          ) : (
            <div>
              {comment.isSpoiler && (
                <Badge variant="destructive" className="mb-2">
                  <Eye className="h-3 w-3 mr-1" />
                  Spoiler
                </Badge>
              )}
              <p className="text-sm whitespace-pre-wrap break-words">{comment.content}</p>
            </div>
          )}

          {/* Imágenes */}
          {comment.images && comment.images.length > 0 && (
            <div className={`grid gap-2 mt-2 ${
              comment.images.length === 1 ? 'grid-cols-1' :
              comment.images.length === 2 ? 'grid-cols-2' :
              'grid-cols-2'
            }`}>
              {comment.images.map((imageUrl, index) => (
                <div key={index} className="relative aspect-square rounded-md overflow-hidden bg-muted">
                  <img
                    src={imageUrl}
                    alt={`Imagen ${index + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2 sm:gap-4 mt-3 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 gap-1 ${comment.userLiked ? 'text-red-500' : ''}`}
            onClick={handleLike}
            disabled={isLiking}
          >
            <Heart className={`h-4 w-4 ${comment.userLiked ? 'fill-current' : ''}`} />
            <span className="text-xs">{comment.likesCount}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1"
            onClick={handleReply}
          >
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs hidden xs:inline sm:inline">Responder</span>
          </Button>

          {comment.repliesCount > 0 && !showReplies && !isReply && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1 text-primary"
              onClick={() => onLoadReplies(comment.id)}
            >
              <span className="text-xs font-semibold">
                {comment.repliesCount} {comment.repliesCount === 1 ? 'respuesta' : 'respuestas'}
              </span>
            </Button>
          )}

          {(canEdit || canDelete || canReport) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 ml-auto">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canEdit && (
                  <DropdownMenuItem onClick={() => onEdit(comment)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(comment.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                )}
                {canReport && (canEdit || canDelete) && <DropdownMenuSeparator />}
                {canReport && (
                  <DropdownMenuItem onClick={() => setShowReportDialog(true)}>
                    <Flag className="h-4 w-4 mr-2" />
                    Reportar
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Diálogo de reporte */}
        {canReport && (
          <ReportCommentDialog
            commentId={comment.id}
            isOpen={showReportDialog}
            onClose={() => setShowReportDialog(false)}
          />
        )}
      </div>
    </div>
  );
}
