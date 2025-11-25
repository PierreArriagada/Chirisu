'use client';

/**
 * @fileoverview CommentsSection - Sistema completo de comentarios
 * 
 * Sección de comentarios para anime, manga, novelas, personajes, staff, etc.
 * Soporta:
 * - Comentarios principales y respuestas
 * - Spoilers ocultables
 * - Likes
 * - Edición y eliminación
 * - Imágenes
 * - Notificaciones
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MessageSquare, 
  ThumbsUp, 
  Reply, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Send,
  AlertTriangle,
  Image as ImageIcon,
  X,
  MoreHorizontal,
  Flag
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Comment {
  id: string;
  userId: string;
  content: string;
  isSpoiler: boolean;
  imageUrl: string | null;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    username: string;
    displayName: string;
    avatarUrl: string | null;
    level: number;
  };
  likesCount: number;
  repliesCount: number;
  isLiked?: boolean;
}

interface CommentsSectionProps {
  commentableType: 'anime' | 'manga' | 'novels' | 'donghua' | 'manhua' | 'manhwa' | 'fan_comic' | 'character' | 'voice_actor' | 'staff';
  commentableId: string;
}

export default function CommentsSection({ commentableType, commentableId }: CommentsSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [totalComments, setTotalComments] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Estado para nuevo comentario
  const [newComment, setNewComment] = useState('');
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  
  // Estado para respuestas
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replySpoiler, setReplySpoiler] = useState(false);
  
  // Estado para ver respuestas
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [replies, setReplies] = useState<Record<string, Comment[]>>({});
  const [loadingReplies, setLoadingReplies] = useState<Set<string>>(new Set());

  // Estado para spoilers
  const [revealedSpoilers, setRevealedSpoilers] = useState<Set<string>>(new Set());

  // Estado para editar comentarios
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editSpoiler, setEditSpoiler] = useState(false);

  // Estado para reportar comentarios
  const [reportingComment, setReportingComment] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');

  useEffect(() => {
    loadComments();
  }, [commentableType, commentableId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/comments?type=${commentableType}&id=${commentableId}`
      );
      
      if (!response.ok) throw new Error('Error al cargar comentarios');
      
      const data = await response.json();
      const loadedComments = data.comments || [];
      setComments(loadedComments);
      
      // Calcular total de comentarios (principales + todas las respuestas)
      const total = loadedComments.reduce((sum: number, comment: Comment) => {
        return sum + 1 + comment.repliesCount;
      }, 0);
      setTotalComments(total);
    } catch (error) {
      console.error('Error loading comments:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los comentarios',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadReplies = async (commentId: string) => {
    if (expandedComments.has(commentId)) {
      // Colapsar
      const newExpanded = new Set(expandedComments);
      newExpanded.delete(commentId);
      setExpandedComments(newExpanded);
      return;
    }

    // Expandir y cargar respuestas
    try {
      setLoadingReplies(new Set(loadingReplies).add(commentId));
      
      const response = await fetch(
        `/api/comments?type=${commentableType}&id=${commentableId}&parent_id=${commentId}`
      );
      
      if (!response.ok) throw new Error('Error al cargar respuestas');
      
      const data = await response.json();
      setReplies({ ...replies, [commentId]: data.comments || [] });
      setExpandedComments(new Set(expandedComments).add(commentId));
    } catch (error) {
      console.error('Error loading replies:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las respuestas',
        variant: 'destructive',
      });
    } finally {
      const newLoading = new Set(loadingReplies);
      newLoading.delete(commentId);
      setLoadingReplies(newLoading);
    }
  };

  const handleSubmitComment = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'Debes iniciar sesión para comentar',
        variant: 'destructive',
      });
      return;
    }

    if (!newComment.trim()) {
      toast({
        title: 'Error',
        description: 'El comentario no puede estar vacío',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: commentableType,
          id: parseInt(commentableId),
          content: newComment,
          is_spoiler: isSpoiler,
          image_url: imageUrl || null,
        }),
      });

      if (!response.ok) throw new Error('Error al enviar comentario');

      toast({
        title: 'Éxito',
        description: 'Comentario publicado',
      });

      // Limpiar formulario y recargar
      setNewComment('');
      setIsSpoiler(false);
      setImageUrl('');
      await loadComments();
      
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast({
        title: 'Error',
        description: 'No se pudo publicar el comentario',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'Debes iniciar sesión para responder',
        variant: 'destructive',
      });
      return;
    }

    if (!replyContent.trim()) {
      toast({
        title: 'Error',
        description: 'La respuesta no puede estar vacía',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Encontrar el comentario al que estamos respondiendo
      const targetComment = comments.find(c => c.id === parentId);
      const allReplies = Object.values(replies).flat();
      const targetReply = allReplies.find(r => r.id === parentId);
      const target = targetComment || targetReply;
      
      // Si es una respuesta a una respuesta, usar el parent_id del comentario raíz
      // Esto mantiene todas las respuestas al mismo nivel (threading plano)
      const rootParentId = target?.parentId || parentId;
      
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: commentableType,
          id: parseInt(commentableId),
          content: replyContent,
          is_spoiler: replySpoiler,
          parent_id: parseInt(rootParentId),
        }),
      });

      if (!response.ok) throw new Error('Error al enviar respuesta');

      toast({
        title: 'Éxito',
        description: 'Respuesta publicada',
      });

      // Limpiar y recargar respuestas
      setReplyContent('');
      setReplySpoiler(false);
      setReplyingTo(null);
      
      // Recargar respuestas del comentario raíz
      await loadReplies(rootParentId);
      
    } catch (error) {
      console.error('Error submitting reply:', error);
      toast({
        title: 'Error',
        description: 'No se pudo publicar la respuesta',
        variant: 'destructive',
      });
    }
  };

  const handleLike = async (commentId: string) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'Debes iniciar sesión para dar like',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(`/api/comments/${commentId}/react`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Error al dar like');

      // Recargar comentarios para actualizar conteos
      await loadComments();
      
    } catch (error) {
      console.error('Error liking comment:', error);
      toast({
        title: 'Error',
        description: 'No se pudo procesar el like',
        variant: 'destructive',
      });
    }
  };

  const handleEditComment = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
    setEditSpoiler(comment.isSpoiler);
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditContent('');
    setEditSpoiler(false);
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editContent.trim()) {
      toast({
        title: 'Error',
        description: 'El comentario no puede estar vacío',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: editContent,
          is_spoiler: editSpoiler,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al editar comentario');
      }

      toast({
        title: 'Éxito',
        description: 'Comentario editado',
      });

      handleCancelEdit();
      await loadComments();
      
    } catch (error: any) {
      console.error('Error editing comment:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo editar el comentario',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este comentario?')) {
      return;
    }

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar comentario');
      }

      toast({
        title: 'Éxito',
        description: 'Comentario eliminado',
      });

      await loadComments();
      
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el comentario',
        variant: 'destructive',
      });
    }
  };

  const handleReportComment = async (commentId: string) => {
    if (!reportReason.trim()) {
      toast({
        title: 'Error',
        description: 'Debes proporcionar una razón para el reporte',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(`/api/comments/${commentId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: reportReason,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al reportar comentario');
      }

      toast({
        title: 'Éxito',
        description: 'Comentario reportado. Será revisado por moderadores.',
      });

      setReportingComment(null);
      setReportReason('');
      
    } catch (error: any) {
      console.error('Error reporting comment:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo reportar el comentario',
        variant: 'destructive',
      });
    }
  };

  const toggleSpoiler = (commentId: string) => {
    const newRevealed = new Set(revealedSpoilers);
    if (newRevealed.has(commentId)) {
      newRevealed.delete(commentId);
    } else {
      newRevealed.add(commentId);
    }
    setRevealedSpoilers(newRevealed);
  };

  const renderComment = (comment: Comment, isReply = false) => {
    const isSpoilerRevealed = revealedSpoilers.has(comment.id);
    const hasReplies = comment.repliesCount > 0;
    const isExpanded = expandedComments.has(comment.id);
    const commentReplies = replies[comment.id] || [];

    return (
      <div key={comment.id} className={`${isReply ? 'ml-8 sm:ml-12 mt-4' : 'mt-6'}`}>
        <div className="flex gap-2 sm:gap-3">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage src={comment.user.avatarUrl || undefined} />
            <AvatarFallback>
              {comment.user.displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-semibold text-sm">{comment.user.displayName}</span>
              <Badge variant="secondary" className="text-xs">Nv.{comment.user.level}</Badge>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.createdAt), { 
                  addSuffix: true,
                  locale: es 
                })}
              </span>
              {comment.updatedAt !== comment.createdAt && (
                <span className="text-xs text-muted-foreground">(editado)</span>
              )}
            </div>

            {comment.isSpoiler && !isSpoilerRevealed ? (
              <Alert className="my-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>Este comentario contiene spoilers</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleSpoiler(comment.id)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Revelar
                  </Button>
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="text-sm whitespace-pre-wrap mb-2">
                  {comment.content}
                </div>
                
                {comment.imageUrl && (
                  <img 
                    src={comment.imageUrl} 
                    alt="Comentario" 
                    className="max-w-md rounded-lg my-2"
                  />
                )}

                {comment.isSpoiler && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleSpoiler(comment.id)}
                    className="mt-2"
                  >
                    <EyeOff className="h-4 w-4 mr-2" />
                    Ocultar spoiler
                  </Button>
                )}
              </>
            )}

            <div className="flex items-center gap-2 sm:gap-3 mt-2 flex-wrap">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleLike(comment.id)}
                className="gap-1"
              >
                <ThumbsUp className="h-4 w-4" />
                {comment.likesCount > 0 && comment.likesCount}
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className="gap-1"
              >
                <Reply className="h-4 w-4" />
                <span className="hidden xs:inline sm:inline">Responder</span>
              </Button>

              {hasReplies && !isReply && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => loadReplies(comment.id)}
                  className="gap-1"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-xs sm:text-sm">
                    {isExpanded ? 'Ocultar' : `Ver`} {comment.repliesCount} {comment.repliesCount === 1 ? 'respuesta' : 'respuestas'}
                  </span>
                </Button>
              )}

              {/* Menú de opciones */}
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 ml-auto">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {(String(user.id) === String(comment.userId) || user.isAdmin || user.isModerator) && (
                      <>
                        <DropdownMenuItem onClick={() => handleEditComment(comment)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </>
                    )}
                    {String(user.id) !== String(comment.userId) && (
                      <>
                        {(user.isAdmin || user.isModerator || String(user.id) === String(comment.userId)) && (
                          <DropdownMenuSeparator />
                        )}
                        <DropdownMenuItem onClick={() => setReportingComment(comment.id)}>
                          <Flag className="h-4 w-4 mr-2" />
                          Reportar
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Formulario de respuesta */}
            {replyingTo === comment.id && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <div className="mb-2 text-sm text-muted-foreground">
                  Respondiendo a <span className="font-semibold text-foreground">@{comment.user.displayName}</span>
                </div>
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Escribe tu respuesta..."
                  className="mb-2"
                  rows={3}
                />
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={replySpoiler ? "default" : "outline"}
                      onClick={() => setReplySpoiler(!replySpoiler)}
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Spoiler
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyContent('');
                        setReplySpoiler(false);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleSubmitReply(comment.id)}
                      disabled={!replyContent.trim()}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Enviar
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Formulario de edición */}
            {editingComment === comment.id && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <div className="mb-2 text-sm font-semibold">Editando comentario</div>
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Edita tu comentario..."
                  className="mb-2"
                  rows={3}
                />
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={editSpoiler ? "default" : "outline"}
                      onClick={() => setEditSpoiler(!editSpoiler)}
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Spoiler
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCancelEdit}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleSaveEdit(comment.id)}
                      disabled={!editContent.trim()}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Guardar
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Diálogo de reporte */}
            {reportingComment === comment.id && (
              <div className="mt-4 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <div className="mb-2 text-sm font-semibold text-destructive">Reportar comentario</div>
                <Textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Describe la razón del reporte..."
                  className="mb-2"
                  rows={3}
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setReportingComment(null);
                      setReportReason('');
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleReportComment(comment.id)}
                    disabled={!reportReason.trim()}
                  >
                    <Flag className="h-4 w-4 mr-2" />
                    Enviar Reporte
                  </Button>
                </div>
              </div>
            )}

            {/* Respuestas expandidas */}
            {isExpanded && commentReplies.length > 0 && (
              <div className="mt-4 border-l-2 border-muted pl-4">
                {commentReplies.map(reply => renderComment(reply, true))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Comentarios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">Cargando comentarios...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comentarios ({totalComments})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Formulario para nuevo comentario */}
        {user ? (
          <div className="mb-8 p-4 bg-muted rounded-lg">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Escribe un comentario..."
              className="mb-3"
              rows={4}
            />
            
            <div className="flex items-center gap-2 mb-3">
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="URL de imagen (opcional)"
                className="flex-1 px-3 py-2 border rounded-md text-sm"
              />
              {imageUrl && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setImageUrl('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:justify-between">
              <Button
                size="sm"
                variant={isSpoiler ? "default" : "outline"}
                onClick={() => setIsSpoiler(!isSpoiler)}
                className="w-full sm:w-auto"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Contiene Spoilers
              </Button>
              <Button
                onClick={handleSubmitComment}
                disabled={submitting || !newComment.trim()}
                className="w-full sm:w-auto"
              >
                <Send className="h-4 w-4 mr-2" />
                {submitting ? 'Enviando...' : 'Publicar comentario'}
              </Button>
            </div>
          </div>
        ) : (
          <Alert className="mb-6">
            <AlertDescription>
              Debes <a href="/login" className="underline font-semibold">iniciar sesión</a> para comentar
            </AlertDescription>
          </Alert>
        )}

        {/* Lista de comentarios */}
        {comments.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No hay comentarios aún. ¡Sé el primero en comentar!
          </p>
        ) : (
          <div className="space-y-6">
            {comments.map(comment => renderComment(comment))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
