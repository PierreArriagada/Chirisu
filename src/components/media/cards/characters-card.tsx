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
import { SafeImage } from "@/components/ui/safe-image";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function CharactersCard({ characters }: { characters: Character[] }) {
  return (
    <CardContent className="flex overflow-x-auto gap-6 pb-4">
        {characters.map(character => {
                const characterHref = character.slug ? `/character/${character.slug}` : null;
                const voiceActorSlug = character.voiceActors?.japanese?.slug;
                const voiceActorHref = voiceActorSlug ? `/voice-actor/${voiceActorSlug}` : null;

                return (
                    <Card key={character.id} className="flex-shrink-0 w-[300px] flex gap-4 p-4 rounded-lg bg-card text-card-foreground hover:bg-muted/50 transition-colors">
                            {characterHref ? (
                                <Link href={characterHref} className="flex-shrink-0">
                                    <SafeImage src={character.imageUrl} alt={character.name} width={60} height={90} className="rounded-md aspect-[2/3]" objectFit="cover" />
                                </Link>
                            ) : (
                                <div className="flex-shrink-0">
                                    <SafeImage src={character.imageUrl} alt={character.name} width={60} height={90} className="rounded-md aspect-[2/3]" objectFit="cover" />
                                </div>
                            )}
                            <div className="flex flex-col gap-1 overflow-hidden">
                                    {characterHref ? (
                                        <Link href={characterHref} className="group">
                                            <h4 className="font-semibold truncate group-hover:text-primary transition-colors">{character.name}</h4>
                                        </Link>
                                    ) : (
                                        <h4 className="font-semibold truncate">{character.name}</h4>
                                    )}
                                    <Badge variant="secondary" className="w-min">{character.role}</Badge>
                                    {voiceActorHref ? (
                                        <Link href={voiceActorHref} className="group flex items-center gap-2 pt-2">
                                            <SafeImage src={character.voiceActors.japanese.imageUrl} alt={character.voiceActors.japanese.name} width={40} height={60} className="rounded-md aspect-[2/3]" objectFit="cover" />
                                            <span className="text-sm text-muted-foreground truncate group-hover:text-primary transition-colors">{character.voiceActors.japanese.name}</span>
                                        </Link>
                                    ) : (
                                        <div className="flex items-center gap-2 pt-2">
                                            <SafeImage src={character.voiceActors.japanese.imageUrl} alt={character.voiceActors.japanese.name} width={40} height={60} className="rounded-md aspect-[2/3]" objectFit="cover" />
                                            <span className="text-sm text-muted-foreground truncate">{character.voiceActors.japanese.name}</span>
                                        </div>
                                    )}
                            </div>
                    </Card>
                );
        })}
    </CardContent>
  );
}
