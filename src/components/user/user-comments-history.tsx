'use client';

/**
 * @fileoverview UserCommentsHistory - Historial de comentarios del usuario
 * 
 * Muestra todos los comentarios que ha hecho un usuario en diferentes medios
 * con información del medio donde comentó.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, MessageCircle, ExternalLink, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import type { Comment } from '@/lib/types';

interface UserCommentsHistoryProps {
  userId?: number;
  showDeleteButton?: boolean;
}

export function UserCommentsHistory({ userId, showDeleteButton = true }: UserCommentsHistoryProps) {
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, limit: 20, offset: 0, hasMore: false });

  const loadComments = async (reset = false) => {
    setLoading(true);
    try {
      const offset = reset ? 0 : pagination.offset;
      const url = userId
        ? `/api/user/comments?userId=${userId}&limit=${pagination.limit}&offset=${offset}`
        : `/api/user/comments?limit=${pagination.limit}&offset=${offset}`;

      const response = await fetch(url);

      if (!response.ok) throw new Error('Error al cargar historial');

      const data = await response.json();

      if (reset) {
        setComments(data.comments);
      } else {
        setComments(prev => [...prev, ...data.comments]);
      }

      setPagination(data.pagination);
    } catch (error) {
      console.error('Error al cargar historial:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el historial de comentarios',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('¿Estás seguro de eliminar este comentario?')) return;

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Error al eliminar');

      toast({
        title: 'Éxito',
        description: 'Comentario eliminado',
      });

      // Recargar
      await loadComments(true);
    } catch (error) {
      console.error('Error al eliminar:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el comentario',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    loadComments(true);
  }, [userId]);

  const getMediaUrl = (comment: Comment) => {
    if (!comment.media) return '#';
    const typeMap: Record<string, string> = {
      'anime': 'anime',
      'manga': 'manga',
      'novels': 'novela',
      'donghua': 'donghua',
      'manhua': 'manhua',
      'manhwa': 'manhwa',
      'fan_comic': 'fan-comic',
    };
    const urlType = typeMap[comment.commentableType] || comment.commentableType;
    return `/${urlType}/${comment.commentableId}#comments`;
  };

  if (loading && comments.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-muted-foreground">No hay comentarios aún</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Historial de Comentarios</h2>
        <Badge variant="secondary">{pagination.total} comentarios</Badge>
      </div>

      <div className="space-y-4">
        {comments.map((comment) => (
          <Card key={comment.id} className={comment.deletedAt ? 'opacity-50' : ''}>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {/* Header con medio */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {comment.media && (
                      <Link
                        href={getMediaUrl(comment)}
                        className="inline-flex items-center gap-2 hover:underline"
                      >
                        <span className="font-semibold truncate">{comment.media.title}</span>
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      </Link>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {comment.commentableType}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: es })}
                      </span>
                      {comment.deletedAt && (
                        <Badge variant="destructive" className="text-xs">Eliminado</Badge>
                      )}
                    </div>
                  </div>

                  {showDeleteButton && !comment.deletedAt && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(comment.id)}
                      className="flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Contenido del comentario */}
                <div className="space-y-2">
                  {comment.isSpoiler && (
                    <Badge variant="destructive" className="text-xs">Spoiler</Badge>
                  )}
                  <p className="text-sm whitespace-pre-wrap break-words line-clamp-3">
                    {comment.content}
                  </p>
                </div>

                {/* Imágenes preview */}
                {comment.images && comment.images.length > 0 && (
                  <div className="flex gap-2">
                    {comment.images.slice(0, 3).map((img, index) => (
                      <div key={index} className="w-16 h-16 rounded-md overflow-hidden bg-muted">
                        <img
                          src={img}
                          alt={`Imagen ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                    {comment.images.length > 3 && (
                      <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground">
                        +{comment.images.length - 3}
                      </div>
                    )}
                  </div>
                )}

                {/* Estadísticas */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{comment.likesCount} likes</span>
                  {comment.repliesCount > 0 && (
                    <span>{comment.repliesCount} respuestas</span>
                  )}
                  {comment.parentId && (
                    <Badge variant="secondary" className="text-xs">Respuesta</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Botón cargar más */}
      {pagination.hasMore && !loading && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => {
              setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }));
              loadComments(false);
            }}
          >
            Cargar más comentarios
          </Button>
        </div>
      )}

      {loading && comments.length > 0 && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
