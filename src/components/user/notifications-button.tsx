/**
 * ========================================
 * COMPONENTE: NOTIFICACIONES
 * ========================================
 * Badge de notificaciones en el navbar con dropdown
 */

'use client';

import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Notification {
  id: number;
  action_type: string;
  notifiable_type: string;
  notifiable_id: number;
  created_at: string;
  actor_username: string | null;
  actor_avatar: string | null;
  content_name: string | null;
  report_status?: string | null;
  moderator_notes?: string | null;
}

// Notificaciones genéricas (scan, etc.)
interface GenericNotification {
  id: number;
  type: string;
  title: string;
  message: string | null;
  data: any;
  readAt: string | null;
  createdAt: string;
}

export default function NotificationsButton() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [genericNotifications, setGenericNotifications] = useState<GenericNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // Cargar notificaciones
  const fetchNotifications = async () => {
    try {
      // Cargar notificaciones tradicionales
      const response = await fetch('/api/user/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.total || 0);
      }

      // Cargar notificaciones genéricas (scan, etc.)
      const genericResponse = await fetch('/api/user/generic-notifications');
      if (genericResponse.ok) {
        const genericData = await genericResponse.json();
        setGenericNotifications(genericData.notifications || []);
        setUnreadCount(prev => prev + (genericData.unreadCount || 0));
      }
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    }
  };

  // Cargar notificaciones al montar y cada 30 segundos
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Eliminar notificación sin navegar
  const handleDeleteNotification = async (e: React.MouseEvent, notificationId: number) => {
    e.stopPropagation(); // Evitar que se dispare el click de navegación
    
    try {
      // Marcar como leída (eliminar visualmente)
      await fetch(`/api/user/notifications/${notificationId}`, {
        method: 'PATCH',
      });

      // Actualizar estado local
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error al eliminar notificación:', error);
    }
  };

  // Eliminar notificación genérica sin navegar
  const handleDeleteGenericNotification = async (e: React.MouseEvent, notificationId: number) => {
    e.stopPropagation();
    
    try {
      await fetch('/api/user/generic-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [notificationId] })
      });

      setGenericNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error al eliminar notificación genérica:', error);
    }
  };

  // Click en notificación genérica
  const handleGenericNotificationClick = async (notification: GenericNotification) => {
    try {
      // Marcar como leída
      await fetch('/api/user/generic-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [notification.id] })
      });

      setGenericNotifications(prev => prev.filter(n => n.id !== notification.id));
      setUnreadCount(prev => Math.max(0, prev - 1));
      setOpen(false);

      // Navegar según el tipo
      switch (notification.type) {
        case 'scan_link_request':
          router.push('/profile?tab=scan-requests');
          break;
        case 'scan_link_approved':
        case 'scan_link_rejected':
          router.push('/profile?tab=translations');
          break;
        case 'scan_project_abandoned':
          router.push('/profile?tab=translations');
          break;
        default:
          router.push('/profile/notifications');
      }
    } catch (error) {
      console.error('Error al marcar notificación genérica:', error);
    }
  };

  // Marcar notificación como leída y navegar
  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Marcar como leída
      await fetch(`/api/user/notifications/${notification.id}`, {
        method: 'PATCH',
      });

      // Actualizar estado local
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
      setUnreadCount(prev => Math.max(0, prev - 1));
      setOpen(false);

      // Navegar según el tipo de notificación con URLs específicas
      const notifiableId = notification.notifiable_id;
      const actionType = notification.action_type;
      const notifiableType = notification.notifiable_type;
      
      // Contribuciones
      if (actionType === 'contribution_submitted') {
        router.push(`/dashboard/moderator/contributions/${notifiableId}`);
      } else if (actionType === 'contribution_approved' || actionType === 'contribution_rejected') {
        router.push('/contribution-center');
      }
      
      // ┌─────────────────────────────────────────────────────────────────┐
      // │ 🔔 SISTEMA DE NOTIFICACIONES DE REPORTES                        │
      // │ Routing inteligente según tipo de reporte                       │
      // └─────────────────────────────────────────────────────────────────┘
      //
      // FLUJO DE NOTIFICACIONES PARA REPORTES DE COMENTARIOS:
      // 
      // 1. Usuario reporta comentario
      //    → POST /api/comments/[id]/report
      // 
      // 2. API inserta en app.comment_reports (status='pending')
      // 
      // 3. TRIGGER fn_notify_new_comment_report() ejecuta automáticamente
      //    → Busca todos usuarios con rol 'admin' o 'moderator'
      //    → Crea notificación para cada uno con:
      //      * action_type: 'comment_reported'
      //      * notifiable_type: 'comment_report'
      //      * notifiable_id: ID del reporte
      //      * actor_user_id: ID del usuario que reportó
      // 
      // 4. Este componente recibe la notificación
      //    → Detecta action_type='comment_reported' o notifiable_type='comment_report'
      //    → Routing: /dashboard/moderator/reported-comments
      // 
      // 5. Página de moderación carga reportes
      //    → GET /api/admin/reported-comments?status=pending
      //    → Aplica lógica de visibilidad (sin asignar + propios + +15 días)
      // 
      // TIPOS DE NOTIFICACIONES DE REPORTES:
      // - comment_reported → /dashboard/moderator/reported-comments
      // - review_reported → /dashboard/moderator/reported-reviews
      // - user_reported → /dashboard/moderator/reported-users
      // - content_report → /dashboard/moderator/reported-content/[type]
      //
      // NOTA: Se verifica tanto action_type como notifiable_type
      // para compatibilidad con diferentes versiones del trigger
      
      // Reportes de comentarios (solo cuando la acción sea reporte nuevo)
      else if (actionType === 'comment_reported') {
        router.push('/dashboard/moderator/reported-comments');
      }
      // Reportes de reviews
      else if (actionType === 'review_reported') {
        router.push('/dashboard/moderator/reported-reviews');
      }
      // Reportes de usuarios
      else if (actionType === 'user_reported') {
        router.push('/dashboard/moderator/reported-users');
      }
      // Reportes de contenido (anime, manga, etc.) - Redirigir a la página general
      else if (actionType === 'content_report') {
        router.push('/dashboard/moderator/reported-content/anime'); // Default a anime, se puede mejorar
      }
      
      // Reportes del usuario (cuando el usuario reporta algo y recibe actualización)
      else if (actionType.startsWith('report_') && notifiableType === 'content_report') {
        router.push('/profile/reports');
      }
      
      // Comentarios
      else if (actionType === 'comment_reply') {
        router.push('/profile/notifications');
      }
      
      // Default: ir a notificaciones
      else {
        router.push('/profile/notifications');
      }
    } catch (error) {
      console.error('Error al marcar notificación:', error);
    }
  };

  // Obtener mensaje según tipo de acción
  const getNotificationMessage = (notification: Notification): string => {
    const actor = notification.actor_username || 'Un usuario';
    const contentName = notification.content_name || 'un elemento';
    
    // Mapeo de tipos de contenido/notificaciones a español
    // IMPORTANTE: Estos tipos deben coincidir con los valores de:
    // - notifiable_type en app.notifications
    // - action_type en app.notifications
    // - Valores generados por triggers de reportes
    const contentTypeMap: Record<string, string> = {
      'anime': 'anime',
      'manga': 'manga',
      'novel': 'novela',
      'donghua': 'donghua',
      'manhua': 'manhua',
      'manhwa': 'manhwa',
      'fan_comic': 'fan comic',
      'character': 'personaje',
      'voice_actor': 'actor de voz',
      'user_contribution': 'contribución',
      'content_report': 'reporte de contenido',
      'comment_report': 'reporte de comentario',  // Trigger: fn_notify_new_comment_report
      'review_report': 'reporte de reseña',
      'user_report': 'reporte de usuario',
    };
    
    const contentType = contentTypeMap[notification.notifiable_type] || 'elemento';
    
    switch (notification.action_type) {
      // Comentarios
      case 'comment_reply':
        return `${actor} respondió a tu comentario`;
      
      // ┌─────────────────────────────────────────────────────────────────┐
      // │ 🔔 MENSAJES DE NOTIFICACIONES DE REPORTES                       │
      // │ Mostrados en el dropdown de notificaciones                      │
      // └─────────────────────────────────────────────────────────────────┘
      //
      // CONTEXTO:
      // Estos mensajes son generados cuando los triggers de reportes
      // crean notificaciones para admins/moderadores
      //
      // TRIGGER RELACIONADO (comment_reports):
      // - Trigger: trg_notify_new_comment_report
      // - Función: fn_notify_new_comment_report()
      // - Dispara: AFTER INSERT ON app.comment_reports
      // - Crea: action_type='comment_reported', notifiable_type='comment_report'
      //
      // DESTINATARIOS:
      // - Todos los usuarios con rol 'admin' (is_admin=true)
      // - Todos los usuarios con rol 'moderator' (is_staff=true)
      // - Solo usuarios activos (is_active=true, deleted_at IS NULL)
      //
      // ACTOR:
      // - actor_user_id = reporter_user_id (usuario que reportó)
      // - actor_username se muestra en el mensaje
      //
      // Notificaciones para moderadores (reportes nuevos)
      case 'comment_reported':
        return `${actor} reportó un comentario en "${contentName}"`;
      case 'review_reported':
        return `${actor} reportó una reseña en "${contentName}"`;
      case 'user_reported':
        return `${actor} reportó al usuario "${contentName}"`;
      case 'content_report':
        return `${actor} reportó un problema en "${contentName}"`;
      
      // ┌─────────────────────────────────────────────────────────────────┐
      // │ 🔔 NOTIFICACIONES DE RESOLUCIÓN DE REPORTES                     │
      // │ Enviadas cuando un moderador resuelve un reporte                │
      // └─────────────────────────────────────────────────────────────────┘
      
      // Notificaciones al REPORTADO (autor del comentario)
      case 'comment_action_taken':
        return `${actor} tomó acción sobre tu comentario en "${contentName}"`;
      case 'comment_report_dismissed':
        return `${actor} descartó un reporte sobre tu comentario en "${contentName}"`;
      
      // Notificaciones al REPORTANTE (quien reportó)
      case 'report_resolved':
        return `${actor} resolvió tu reporte sobre "${contentName}"`;
      case 'report_rejected':
        return `${actor} descartó tu reporte sobre "${contentName}"`;
      
      // Contribuciones
      case 'contribution_submitted':
        return `${actor} envió una contribución de ${contentType}: "${contentName}"`;
      case 'contribution_approved':
        return `Tu contribución de ${contentType} "${contentName}" fue aprobada`;
      case 'contribution_rejected':
        return `Tu contribución de ${contentType} "${contentName}" fue rechazada`;
      
      // Reportes del usuario (respuestas a sus reportes) - LEGACY
      case 'report_created':
        return `${actor} reportó un problema en ${contentType}: "${contentName}"`;
      case 'report_pending':
        return `Tu reporte está pendiente de revisión`;
      case 'report_in_review':
        return `Tu reporte está siendo revisado por el equipo`;
      case 'report_dismissed':
        return `Tu reporte ha sido revisado${notification.moderator_notes ? ' - Revisa la respuesta' : ''}`;
      
      default:
        return `Nueva notificación sobre "${contentName}"`;
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <h3 className="font-semibold">Notificaciones</h3>
          {unreadCount > 0 && (
            <Badge variant="secondary">{unreadCount} nuevas</Badge>
          )}
        </div>
        
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 && genericNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mb-2 opacity-50" />
              <p className="text-sm">No tienes notificaciones</p>
            </div>
          ) : (
            <div className="divide-y">
              {/* Notificaciones genéricas (scan, etc.) */}
              {genericNotifications.map((notification) => (
                <div
                  key={`generic-${notification.id}`}
                  className="group relative hover:bg-accent transition-colors"
                >
                  <button
                    onClick={() => handleGenericNotificationClick(notification)}
                    className="w-full text-left px-4 py-3 pr-10"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {notification.title}
                        </p>
                        {notification.message && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {notification.message}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </p>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={(e) => handleDeleteGenericNotification(e, notification.id)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                    title="Eliminar notificación"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {/* Notificaciones tradicionales */}
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="group relative hover:bg-accent transition-colors"
                >
                  <button
                    onClick={() => handleNotificationClick(notification)}
                    className="w-full text-left px-4 py-3 pr-10"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {getNotificationMessage(notification)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </p>
                      </div>
                    </div>
                  </button>
                  
                  {/* Botón eliminar notificación */}
                  <button
                    onClick={(e) => handleDeleteNotification(e, notification.id)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                    title="Eliminar notificación"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="border-t px-4 py-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => {
              setOpen(false);
              router.push('/profile/notifications');
            }}
          >
            Ver historial de notificaciones
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
