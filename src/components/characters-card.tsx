import type { Character } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { Badge } from "./ui/badge";

export default function CharactersCard({ characters }: { characters: Character[] }) {
  return (
    <CardContent className="flex overflow-x-auto gap-6 pb-4">
    {characters.map(character => (
        <div key={character.id} className="flex-shrink-0 w-[300px] flex gap-4 border p-4 rounded-lg">
            <div className="flex-shrink-0">
                <Image src={character.imageUrl} alt={character.name} width={60} height={90} className="rounded-md aspect-[2/3] object-cover" data-ai-hint={character.imageHint} />
            </div>
            <div className="flex flex-col gap-1 overflow-hidden">
                <h4 className="font-semibold truncate">{character.name}</h4>
                <Badge variant="secondary" className="w-min">{character.role}</Badge>
                <div className="flex items-center gap-2 pt-2">
                    <Image src={character.voiceActors.japanese.imageUrl} alt={character.voiceActors.japanese.name} width={40} height={60} className="rounded-md aspect-[2/3] object-cover" data-ai-hint={character.voiceActors.japanese.imageHint} />
                    <span className="text-sm text-muted-foreground truncate">{character.voiceActors.japanese.name}</span>
                </div>
            </div>
        </div>
    ))}
    </CardContent>
  );
}
