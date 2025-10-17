/**
 * @fileoverview RelatedCard - Tarjeta para mostrar títulos relacionados.
 * 
 * Muestra una cuadrícula de otros medios que están relacionados con el título
 * actual (ej. secuelas, precuelas, adaptaciones, etc.).
 * Cada elemento en la cuadrícula es una tarjeta clickeable que muestra la
 * imagen, el tipo de relación y el título del medio relacionado.
 */

import type { RelatedTitle } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SafeImage } from "@/components/ui/safe-image";
import { Badge } from "./ui/badge";
import Link from "next/link";

// Función para traducir los tipos de media al español
const translateMediaType = (type: string): string => {
  const translations: Record<string, string> = {
    anime: "Anime",
    manga: "Manga",
    novel: "Novela",
    manhua: "Manhua",
    manhwa: "Manhwa",
  };
  return translations[type.toLowerCase()] || type;
};

export default function RelatedCard({ relatedTitles }: { relatedTitles: RelatedTitle[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Relacionados</CardTitle>
      </CardHeader>
      <CardContent>
        {relatedTitles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {relatedTitles.map(item => (
              <Link href={`/${item.type.toLowerCase()}/${item.slug}`} key={item.id} className="group">
                <Card className="overflow-hidden h-full flex flex-col hover:bg-muted/50 transition-colors">
                  <SafeImage src={item.imageUrl} alt={item.title} width={300} height={150} className="w-full h-32" objectFit="cover" />
                  <div className="p-4 flex flex-col flex-grow">
                    <Badge variant="secondary" className="w-min mb-2">{translateMediaType(item.type)}</Badge>
                    <h4 className="font-semibold group-hover:text-primary transition-colors">{item.title}</h4>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">
            Sin información de títulos relacionados disponible.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
