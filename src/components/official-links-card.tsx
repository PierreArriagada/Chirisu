/**
 * @fileoverview OfficialLinksCard - Tarjeta para mostrar enlaces oficiales y de fans.
 * 
 * Este componente organiza y muestra una lista de enlaces relacionados con un
 * título, agrupados en tres categorías:
 * - Sitios Oficiales (web, redes sociales).
 * - Plataformas de Streaming (Crunchyroll, Netflix, etc.).
 * - Traducciones de Fans (fansubs, scanlations).
 * Cada enlace se muestra con un icono y es clickeable para abrir en una nueva pestaña.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { OfficialLinks, OfficialLink } from "@/lib/types";
import { Link as LinkIcon } from "lucide-react";

const LinkItem = ({ name, url }: OfficialLink) => (
  <a
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
  >
    <LinkIcon size={14} />
    <span>{name}</span>
  </a>
);

export default function OfficialLinksCard({ links }: { links: OfficialLinks }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sitios Oficiales y Fan Translations</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex flex-col gap-3">
          <h4 className="font-semibold text-foreground">Sitios Oficiales</h4>
          <div className="flex flex-col gap-2">
            {links.officialSites.map(link => <LinkItem key={link.name} {...link} />)}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <h4 className="font-semibold text-foreground">Plataformas de Streaming</h4>
          <div className="flex flex-col gap-2">
            {links.streamingPlatforms.map(link => <LinkItem key={link.name} {...link} />)}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <h4 className="font-semibold text-foreground">Traducciones de Fans</h4>
          <div className="flex flex-col gap-2">
            {links.fanTranslations.map(link => <LinkItem key={link.name} {...link} />)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
