/**
 * @fileoverview Layout del Dashboard de Administrador con barra lateral
 * 
 * Proporciona una estructura con navegación lateral para todas las secciones
 * del panel de administración.
 */
'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Search, 
  Users, 
  Trophy, 
  FileText,
  Settings,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotificationsCount } from '@/hooks/use-notifications-count';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const navItems: NavItem[] = [
  {
    href: '/dashboard/admin',
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Estadísticas generales del sistema'
  },
  {
    href: '/dashboard/admin/search',
    label: 'Búsqueda Avanzada',
    icon: Search,
    description: 'Buscar por tipo y nombre'
  },
  {
    href: '/dashboard/admin/moderation',
    label: 'Moderación',
    icon: Users,
    description: 'Asignar roles de moderador'
  },
  {
    href: '/dashboard/admin/top-contributors',
    label: 'Top Contribuyentes',
    icon: Trophy,
    description: 'Usuarios más activos'
  },
  {
    href: '/dashboard/admin/reports',
    label: 'Reportes',
    icon: FileText,
    description: 'Gestionar reportes de usuarios'
  }
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { unreadCount } = useNotificationsCount();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (!loading && user && user.role !== 'admin') {
      console.warn('Acceso denegado: Se requiere rol de administrador.');
      router.push('/');
      return;
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <main className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </main>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="container mx-auto p-2 sm:p-6">
      <div className="flex gap-6 relative">
        {/* Mobile Menu Button */}
        <Button
          variant="outline"
          size="icon"
          className="lg:hidden fixed top-20 left-4 z-50"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X /> : <Menu />}
        </Button>

        {/* Sidebar */}
        <aside
          className={cn(
            "fixed lg:sticky top-20 left-0 h-[calc(100vh-5rem)] w-64 bg-card border-r border-border transition-transform lg:translate-x-0 z-40 overflow-y-auto",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="p-4 space-y-2">
            <div className="mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Panel de Admin
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-auto">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {user.username}
              </p>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-accent",
                      isActive && "bg-accent text-accent-foreground font-medium"
                    )}
                  >
                    <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm">{item.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {item.description}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-w-0 lg:ml-0 ml-0">
          {children}
        </main>
      </div>
    </div>
  );
}
