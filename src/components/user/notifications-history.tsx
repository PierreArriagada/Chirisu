/**
 * ========================================
 * COMPONENTE: HISTORIAL DE NOTIFICACIONES
 * ========================================
 * Muestra lista paginada de notificaciones con links directos
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, MessageCircle, ChevronRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Notification {
  id: number;
  action_type: string;
  notifiable_type: string;
  notifiable_id: number;
  read_at: string | null;
  created_at: string;
  actor_username: string;
  actor_avatar: string | null;
  comment_content: string | null;
  media_type: string;
  media_id: number;
  content_name: string;
  parent_comment_id: number | null;
  media_slug: string | null;
}

interface NotificationsHistoryProps {
  userId: number;
}

export default function NotificationsHistory({ userId }: NotificationsHistoryProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  useEffect(() => {
    fetchNotifications();
  }, [offset]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/user/notifications/history?limit=${limit}&offset=${offset}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getNotificationMessage = (notification: Notification) => {
    const username = notification.actor_username || 'Alguien';
    
    switch (notification.action_type) {
      case 'comment_reply':
        return {
          title: `${username} respondió a tu comentario`,
          preview: notification.comment_content?.substring(0, 100) || '',
        };
      case 'contribution_approved':
        return {
          title: 'Contribución aprobada',
          preview: `Tu contribución a "${notification.content_name}" ha sido aprobada`,
        };
      case 'contribution_rejected':
        return {
          title: 'Contribución rechazada',
          preview: `Tu contribución a "${notification.content_name}" fue rechazada`,
        };
      case 'new_contribution':
        return {
          title: 'Nueva contribución',
          preview: `${username} envió una contribución: "${notification.content_name}"`,
        };
      default:
        return {
          title: 'Notificación',
          preview: notification.content_name || '',
        };
    }
  };

  const getNotificationLink = (notification: Notification) => {
    // Para respuestas a comentarios, ir directamente a la página del medio
    if (notification.action_type === 'comment_reply' && notification.media_slug) {
      const mediaType = notification.media_type === 'novels' ? 'novela' : notification.media_type;
      return `/${mediaType}/${notification.media_slug}`;
    }

    // Para contribuciones, ir al centro de contribuciones
    if (notification.notifiable_type === 'user_contribution') {
      return `/contribution-center`;
    }

    return '#';
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await fetch(`/api/user/notifications/${notificationId}`, {
        method: 'PATCH',
      });
      // Recargar notificaciones
      fetchNotifications();
    } catch (error) {
      console.error('Error al marcar como leída:', error);
    }
  };

  if (isLoading && offset === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Bell className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No tienes notificaciones</h3>
        <p className="text-muted-foreground">
          Cuando alguien interactúe contigo, aparecerá aquí
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {notifications.map((notification) => {
        const { title, preview } = getNotificationMessage(notification);
        const link = getNotificationLink(notification);
        const isUnread = !notification.read_at;

        return (
          <Card
            key={notification.id}
            className={`p-4 transition-colors ${
              isUnread ? 'bg-primary/5 border-primary/20' : ''
            }`}
          >
            <Link
              href={link}
              className="flex items-start gap-4 group"
              onClick={() => isUnread && markAsRead(notification.id)}
            >
              <Avatar className="w-10 h-10 flex-shrink-0">
                <AvatarImage src={notification.actor_avatar || undefined} />
                <AvatarFallback>
                  {notification.actor_username?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold group-hover:text-primary transition-colors">
                      {title}
                    </p>
                    {isUnread && (
                      <Badge variant="default" className="text-xs">
                        Nueva
                      </Badge>
                    )}
                  </div>
                  
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(notification.created_at), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </span>
                </div>

                {preview && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {preview}
                  </p>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span className="line-clamp-1">{notification.content_name}</span>
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
            </Link>
          </Card>
        );
      })}

      {/* Paginación */}
      {total > limit && (
        <div className="flex items-center justify-between pt-4">
          <Button
            variant="outline"
            onClick={() => setOffset(Math.max(0, offset - limit))}
            disabled={offset === 0 || isLoading}
          >
            Anterior
          </Button>

          <span className="text-sm text-muted-foreground">
            Mostrando {offset + 1} - {Math.min(offset + limit, total)} de {total}
          </span>

          <Button
            variant="outline"
            onClick={() => setOffset(offset + limit)}
            disabled={offset + limit >= total || isLoading}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}
