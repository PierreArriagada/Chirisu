import type { Character } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { Badge } from "./ui/badge";
import Link from "next/link";

export default function CharactersCard({ characters }: { characters: Character[] }) {
  return (
    <Card>
        <CardHeader>
            <CardTitle>Personajes & Actores</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {characters.map(character => (
            <Card key={character.id}>
                <CardHeader className="flex flex-row items-start gap-4">
                    <Link href={`/character/${character.slug}`}>
                        <Image src={character.imageUrl} alt={character.name} width={80} height={120} className="rounded-md aspect-[2/3] object-cover" data-ai-hint={character.imageHint} />
                    </Link>
                    <div className="flex flex-col gap-1">
                        <Link href={`/character/${character.slug}`} className="group">
                            <CardTitle className="text-lg group-hover:text-primary transition-colors">{character.name}</CardTitle>
                        </Link>
                        <Badge variant="secondary" className="w-min">{character.role}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <h4 className="font-semibold text-sm">Actor de Voz (JP)</h4>
                        <Link href={`/voice-actor/${character.voiceActors.japanese.slug}`} className="group flex items-center gap-3">
                            <Image src={character.voiceActors.japanese.imageUrl} alt={character.voiceActors.japanese.name} width={40} height={60} className="rounded-md aspect-[2/3] object-cover" data-ai-hint={character.voiceActors.japanese.imageHint} />
                            <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors">{character.voiceActors.japanese.name}</span>
                        </Link>
                    </div>
                    <div className="flex flex-col gap-2">
                        <h4 className="font-semibold text-sm">Actor de Voz (ES)</h4>
                         <Link href={`/voice-actor/${character.voiceActors.spanish.slug}`} className="group flex items-center gap-3">
                            <Image src={character.voiceActors.spanish.imageUrl} alt={character.voiceActors.spanish.name} width={40} height={60} className="rounded-md aspect-[2/3] object-cover" data-ai-hint={character.voiceActors.spanish.imageHint} />
                            <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors">{character.voiceActors.spanish.name}</span>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        ))}
        </CardContent>
    </Card>
  );
}
