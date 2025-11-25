/**
 * @fileoverview Breadcrumbs - Componente de migas de pan dinámico.
 * 
 * Renderiza una ruta de navegación (migas de pan) basada en la URL actual de la página.
 * Es capaz de generar títulos amigables para rutas dinámicas, como los títulos de
 * animes, episodios o personajes, consultando la "base de datos" simulada.
 * Esto proporciona al usuario una clara indicación de su ubicación en el sitio y
 * una forma fácil de navegar a páginas superiores en la jerarquía.
 */

"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { HomeIcon, ChevronRight } from "lucide-react";

// Helper to capitalize first letter
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// Helper to convert slugs to readable titles
const slugToTitle = (slug: string) => {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Map singular routes to their plural listing pages
const routeMapping: Record<string, { href: string; label: string }> = {
  'character': { href: '/characters', label: 'Characters' },
  'voice-actor': { href: '/voice-actors', label: 'Voice Actors' },
  'staff': { href: '/staff', label: 'Staff' },
};

// Map specific dashboard routes to friendly labels
const dashboardLabels: Record<string, string> = {
  'search': 'Búsqueda Avanzada',
  'moderation': 'Moderación de Usuarios',
  'top-contributors': 'Top Contribuyentes',
  'reports': 'Reportes',
  'contributions': 'Contribuciones',
  'edit': 'Editar',
  'add': 'Agregar',
  'add-anime': 'Agregar Anime',
  'add-manga': 'Agregar Manga',
  'add-novela': 'Agregar Novela',
  'add-dougua': 'Agregar Donghua',
  'add-manhua': 'Agregar Manhua',
  'add-fan-comic': 'Agregar Fan Comic',
  'contribution-center': 'Centro de Contribuciones',
  'anime': 'Anime',
  'manga': 'Manga',
  'novels': 'Novelas',
  'donghua': 'Donghua',
  'manhua': 'Manhua',
  'manhwa': 'Manhwa',
  'fan_comic': 'Fan Comic',
};

export default function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter((i) => i);

  // Don't show on the homepage
  if (segments.length === 0) {
    return null;
  }

  const breadcrumbs: { href: string; label: React.ReactNode }[] = [];
  breadcrumbs.push({ href: "/", label: <HomeIcon size={16} /> });

  let currentPath = "";

  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    
    // Regla especial: Si estamos en rutas de dashboard y el segmento es "dashboard",
    // saltar al siguiente segmento para construir la ruta completa
    if (segment === 'dashboard' && (segments[index + 1] === 'admin' || segments[index + 1] === 'moderator')) {
      // No agregar breadcrumb para "dashboard" solo, esperar a "dashboard/admin" o "dashboard/moderator"
      return;
    }
    
    // Regla especial: Si el segmento es "admin" y el anterior fue "dashboard"
    if (segment === 'admin' && segments[index - 1] === 'dashboard') {
      // Agregar breadcrumb para "Dashboard Admin" con ruta completa
      breadcrumbs.push({ href: '/dashboard/admin', label: 'Dashboard Admin' });
      return;
    }
    
    // Regla especial: Si el segmento es "moderator" y el anterior fue "dashboard"
    if (segment === 'moderator' && segments[index - 1] === 'dashboard') {
      // Agregar breadcrumb para "Dashboard Moderador" con ruta completa
      breadcrumbs.push({ href: '/dashboard/moderator', label: 'Dashboard Moderador' });
      return;
    }
    
    // Check if this is a mapped route (singular to plural)
    const mapping = routeMapping[segment];
    
    let href = currentPath;
    let label = slugToTitle(segment);
    
    // Check if this segment has a friendly dashboard label
    if (dashboardLabels[segment]) {
      label = dashboardLabels[segment];
    }
    
    // If it's the first segment and has a mapping, use the listing page
    if (mapping && index === 0) {
      href = mapping.href;
      label = mapping.label;
    }
    
    // Don't add duplicate labels
    const lastLabel = breadcrumbs[breadcrumbs.length - 1]?.label;
    if (lastLabel === label) {
      return;
    }
    
    breadcrumbs.push({ href, label });
  });

  return (
    <nav 
      aria-label="Breadcrumb" 
      className="py-3 px-4 sm:px-6 lg:px-8 w-full"
      style={{ paddingLeft: '16px', paddingRight: '16px' }}
    >
      <div className="max-w-full">
        <ol className="flex items-center space-x-2 text-sm text-muted-foreground">
          {breadcrumbs.map((crumb, index) => (
            <li key={crumb.href + index} className="flex items-center space-x-2">
              {index > 0 && <ChevronRight size={16} />}
              {index === breadcrumbs.length - 1 ? (
                <span className="font-semibold text-foreground truncate max-w-48 sm:max-w-96">{crumb.label}</span>
              ) : (
                <Link href={crumb.href} className="hover:text-primary transition-colors">
                  <span className="truncate max-w-48 sm:max-w-96">{crumb.label}</span>
                </Link>
              )}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}