/**
 * @fileoverview EpisodesCard - Tarjeta para listar los episodios de un anime.
 * 
 * Este componente recibe un array de episodios y los muestra en una lista vertical.
 * Cada elemento de la lista es un enlace a la página de detalles de ese episodio
 * e incluye:
 * - Una miniatura (thumbnail) del episodio con un icono de "play".
 * - El nombre del episodio.
 * - Información secundaria como la duración y el número de comentarios.
 */

import type { Episode } from "@/lib/types";
import { CardContent } from "@/components/ui/card";
import Image from "next/image";
import { MessageSquare, PlayCircle } from "lucide-react";
import Link from "next/link";

export default function EpisodesCard({ episodes }: { episodes: Episode[] }) {
  return (
    <CardContent className="space-y-4">
      {episodes.map(episode => (
        <Link href={`/episode/${episode.id}`} key={episode.id} className="flex items-center gap-4 group p-2 rounded-lg hover:bg-muted/50 transition-colors">
          <div className="relative flex-shrink-0">
            <Image src={episode.imageUrl} alt={episode.name} width={160} height={90} className="rounded-md aspect-video object-cover" data-ai-hint={episode.imageHint} />
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center rounded-md">
                <div className="w-10 h-10 bg-white/80 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <PlayCircle className="w-6 h-6 text-foreground" />
                </div>
            </div>
          </div>
          <div className="flex-grow">
            <h4 className="font-semibold group-hover:text-primary transition-colors">{episode.name}</h4>
            <div className="flex items-center text-sm text-muted-foreground gap-4 mt-1">
              <span>{episode.duration}</span>
              <div className="flex items-center gap-1">
                <MessageSquare size={14} />
                <span>{episode.comments.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </CardContent>
  );
}
