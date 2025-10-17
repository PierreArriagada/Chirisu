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
    
    // Convert slug to readable title
    const label = slugToTitle(segment);
    
    // Don't add duplicate labels
    const lastLabel = breadcrumbs[breadcrumbs.length - 1]?.label;
    if (lastLabel === label) {
      return;
    }
    
    breadcrumbs.push({ href: currentPath, label });
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