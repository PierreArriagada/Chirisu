'use client';

/**
 * @fileoverview Layout para el panel de moderación
 * Navegación lateral simplificada con 5 secciones principales
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  MessageSquare, 
  Star,
  Users,
  Flag,
  UserX
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNotificationsCount } from '@/hooks/use-notifications-count';
import { useReportsCount } from '@/hooks/use-reports-count';

// Items de navegación simplificados
const navigationItems = [
  {
    title: 'Reportes de Contenido',
    href: '/dashboard/moderator/reports',
    icon: Flag,
    description: 'Contribuciones, información incorrecta o faltante',
    badge: 'content'
  },
  {
    title: 'Reportes de Reviews',
    href: '/dashboard/moderator/reported-reviews',
    icon: Star,
    description: 'Moderar reviews reportadas',
    badge: 'reviews'
  },
  {
    title: 'Reportes de Comentarios',
    href: '/dashboard/moderator/reported-comments',
    icon: MessageSquare,
    description: 'Moderar comentarios reportados',
    badge: 'comments'
  },
  {
    title: 'Usuarios Reportados',
    href: '/dashboard/moderator/reported-users',
    icon: UserX,
    description: 'Reportes de usuarios',
    badge: 'users'
  },
];

export default function ModeratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { unreadCount } = useNotificationsCount();
  const { counts } = useReportsCount();

  // Función helper para obtener el badge count de cada item
  const getBadgeCount = (badgeType: string | undefined): number => {
    if (!badgeType) return 0;
    
    // Para reportes de contenido, sumar todos los tipos (incluye contribuciones ahora)
    if (badgeType === 'content') {
      return counts.anime + counts.manga + counts.novel + counts.donghua + 
             counts.manhua + counts.manhwa + counts.fanComic +
             (counts.character || 0) + (counts.staff || 0) + 
             (counts.voiceActor || 0) + (counts.studio || 0) + (counts.genre || 0);
    }
    
    return counts[badgeType as keyof typeof counts] || 0;
  };

  return (
    <div className="container mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 mt-6">
        {/* Sidebar Navigation */}
        <aside className="space-y-2">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Panel de Moderación
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-auto">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </h3>
            <nav className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.href && pathname?.startsWith(item.href);
                const badgeCount = getBadgeCount(item.badge);
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-start gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                      'hover:bg-accent hover:text-accent-foreground',
                      isActive && 'bg-accent text-accent-foreground font-medium'
                    )}
                  >
                    <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{item.title}</span>
                        {badgeCount > 0 && (
                          <Badge variant="destructive" className="text-xs px-1.5">
                            {badgeCount > 99 ? '99+' : badgeCount}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {item.description}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Stats Card */}
          <div className="rounded-lg border bg-card p-4">
            <h4 className="font-semibold text-sm mb-2">Acceso Rápido</h4>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Notificaciones</span>
                <span className="font-semibold text-foreground">{unreadCount}</span>
              </div>
              <div className="text-xs text-muted-foreground/70">
                Usa los enlaces arriba para navegar entre secciones
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}
