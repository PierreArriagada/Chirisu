/**
 * @fileoverview RecommendationsCard - Tarjeta para mostrar recomendaciones en la barra lateral.
 * 
 * Este componente está diseñado para la barra lateral y muestra una lista de
 * títulos recomendados. Cada elemento de la lista es una tarjeta que incluye
 * la imagen, el título y el tipo del medio, todo en un formato compacto y vertical.
 */

import type { TitleInfo } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';

interface RecommendationsCardProps {
  items: TitleInfo[];
}

export default function RecommendationsCard({ items }: RecommendationsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recomendado para ti</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map(item => (
            <Link key={item.id} href={`/${item.type.toLowerCase().replace(/ /g, '-')}/${item.slug}`} className="block group">
                <Card className="flex items-center gap-4 p-3 overflow-hidden transition-all duration-200 hover:bg-accent/50 hover:shadow-md">
                    <div className="relative w-16 h-24 flex-shrink-0">
                        <Image 
                            src={item.imageUrl} 
                            alt={item.title} 
                            fill
                            className="object-cover rounded-md"
                            sizes="(max-width: 768px) 10vw, 5vw"
                            data-ai-hint={item.imageHint}
                        />
                    </div>
                    <div className="overflow-hidden">
                        <h4 className="font-semibold leading-tight truncate group-hover:text-accent-foreground">{item.title}</h4>
                        <p className="text-sm text-muted-foreground capitalize">{item.type}</p>
                    </div>
                </Card>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
