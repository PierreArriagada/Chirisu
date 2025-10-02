/**
 * @fileoverview CharactersCard - Tarjeta de visualización horizontal de personajes.
 * 
 * Este componente recibe un array de personajes y los muestra en un carrusel
 * horizontal (`overflow-x-auto`). Cada tarjeta de personaje incluye su imagen,
 * nombre, rol y una vista previa de su actor de voz japonés con un enlace a su perfil.
 * Es utilizado en la página de detalles de un medio para mostrar su elenco principal.
 */

import type { Character } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { Badge } from "./ui/badge";
import Link from "next/link";

export default function CharactersCard({ characters }: { characters: Character[] }) {
  return (
    <CardContent className="flex overflow-x-auto gap-6 pb-4">
    {characters.map(character => (
        <Card key={character.id} className="flex-shrink-0 w-[300px] flex gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors">
            <Link href={`/character/${character.slug}`} className="flex-shrink-0">
                <Image src={character.imageUrl} alt={character.name} width={60} height={90} className="rounded-md aspect-[2/3] object-cover" data-ai-hint={character.imageHint} />
            </Link>
            <div className="flex flex-col gap-1 overflow-hidden">
                <Link href={`/character/${character.slug}`} className="group">
                    <h4 className="font-semibold truncate group-hover:text-primary transition-colors">{character.name}</h4>
                </Link>
                <Badge variant="secondary" className="w-min">{character.role}</Badge>
                <Link href={`/voice-actor/${character.voiceActors.japanese.slug}`} className="group flex items-center gap-2 pt-2">
                    <Image src={character.voiceActors.japanese.imageUrl} alt={character.voiceActors.japanese.name} width={40} height={60} className="rounded-md aspect-[2/3] object-cover" data-ai-hint={character.voiceActors.japanese.imageHint} />
                    <span className="text-sm text-muted-foreground truncate group-hover:text-primary transition-colors">{character.voiceActors.japanese.name}</span>
                </Link>
            </div>
        </Card>
    ))}
    </CardContent>
  );
}
