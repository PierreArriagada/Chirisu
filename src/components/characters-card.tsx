import type { Character } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { Badge } from "./ui/badge";

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
                    <Image src={character.imageUrl} alt={character.name} width={80} height={120} className="rounded-md aspect-[2/3] object-cover" data-ai-hint={character.imageHint} />
                    <div className="flex flex-col gap-1">
                        <CardTitle className="text-lg">{character.name}</CardTitle>
                        <Badge variant="secondary" className="w-min">{character.role}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <h4 className="font-semibold text-sm">Actor de Voz (JP)</h4>
                        <div className="flex items-center gap-3">
                            <Image src={character.voiceActors.japanese.imageUrl} alt={character.voiceActors.japanese.name} width={40} height={60} className="rounded-md aspect-[2/3] object-cover" data-ai-hint={character.voiceActors.japanese.imageHint} />
                            <span className="text-sm text-muted-foreground">{character.voiceActors.japanese.name}</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <h4 className="font-semibold text-sm">Actor de Voz (ES)</h4>
                        <div className="flex items-center gap-3">
                            <Image src={character.voiceActors.spanish.imageUrl} alt={character.voiceActors.spanish.name} width={40} height={60} className="rounded-md aspect-[2/3] object-cover" data-ai-hint={character.voiceActors.spanish.imageHint} />
                            <span className="text-sm text-muted-foreground">{character.voiceActors.spanish.name}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        ))}
        </CardContent>
    </Card>
  );
}
