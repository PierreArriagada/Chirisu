/**
 * @fileoverview TopMediaList - Lista para rankings de medios.
 * 
 * Muestra una lista ordenada de títulos (animes, mangas, etc.) para una
 * categoría de ranking específica (ej. "Top de Siempre", "Top Semanal").
 * Cada elemento de la lista muestra su posición en el ranking, imagen, título
 * y el ranking global.
 */

import type { TitleInfo } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import Link from "next/link";
import Image from "next/image";
import { Trophy } from "lucide-react";

function RankingItem({ item, index }: { item: TitleInfo; index: number }) {
  const url = `/${item.type.toLowerCase().replace(' ', '-')}/${item.slug}`;
  return (
    <Link href={url} className="block group">
      <Card className="flex items-center gap-4 p-3 overflow-hidden transition-all duration-200 group-hover:bg-accent/50 group-hover:shadow-md">
        <div className="flex items-center gap-4">
            <span className="text-xl font-bold text-muted-foreground w-8 text-center">{index + 1}</span>
            <Image
                src={item.imageUrl}
                alt={`Cover for ${item.title}`}
                width={50}
                height={75}
                className="rounded-md object-cover aspect-[2/3]"
                data-ai-hint={item.imageHint}
            />
        </div>
        <div className="flex flex-col justify-center gap-1 overflow-hidden">
          <h4 className="font-semibold leading-tight truncate group-hover:text-accent-foreground">{item.title}</h4>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Trophy size={14} />
            <span>Ranking #{item.ranking}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

export default function TopMediaList({ title, items }: { title: string; items: TitleInfo[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item, index) => (
          <RankingItem key={item.id} item={item} index={index} />
        ))}
      </CardContent>
    </Card>
  );
}
