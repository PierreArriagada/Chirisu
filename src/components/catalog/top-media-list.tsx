/**
 * @fileoverview TopMediaList - Lista para rankings de medios.
 * 
 * Muestra una lista ordenada de títulos (animes, mangas, etc.) para una
 * categoría de ranking específica (ej. "Top de Siempre", "Top Semanal").
 * Cada elemento de la lista muestra su posición en el ranking, imagen, título
 * y el ranking global.
 */

import type { TitleInfo } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { SafeImage } from "@/components/ui/safe-image";
import { Trophy } from "lucide-react";

function RankingItem({ item, index }: { item: TitleInfo; index: number }) {
  const url = `/${item.type.toLowerCase().replace(' ', '-')}/${item.slug}`;
  return (
    <Link href={url} className="block group">
      <Card className="flex items-center gap-4 p-3 overflow-hidden transition-all duration-200 group-hover:bg-accent/50 group-hover:shadow-md h-full">
        {/* Contenedor fijo para posición e imagen en fila horizontal */}
        <div className="flex items-center gap-3 w-20 flex-shrink-0">
          <span className="text-xl font-bold text-muted-foreground w-8 text-center">{index + 1}</span>
          <div className="relative w-12 h-16 flex-shrink-0">
            <SafeImage
              src={item.imageUrl}
              alt={`Cover for ${item.title}`}
              fill
              className="rounded-md"
              objectFit="cover"
            />
          </div>
        </div>
        
        {/* Contenido de texto */}
        <div className="flex flex-col justify-center gap-1 overflow-hidden min-w-0">
          <h4 className="font-semibold leading-tight truncate group-hover:text-accent-foreground">
            {item.title}
          </h4>
          {item.ranking !== undefined && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground flex-shrink-0">
              <Trophy size={14} />
              <span className="truncate">Ranking #{item.ranking}</span>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}

export default function TopMediaList({ items }: { items: TitleInfo[] }) {
  // Now this component just renders a list of items, without its own Card wrapper or title.
  // This makes it more reusable.
  if (!items || items.length === 0) {
    return <p className="text-muted-foreground text-center py-4">No hay elementos para mostrar.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item, index) => (
          <RankingItem key={item.id} item={item} index={index} />
        ))}
    </div>
  );
}