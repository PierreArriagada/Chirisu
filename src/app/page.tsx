import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getHomePageData } from '@/lib/db';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import type { TitleInfo, Character, VoiceActor } from '@/lib/types';

function MediaCard({ item }: { item: TitleInfo }) {
  const url = `/${item.type.toLowerCase().replace(' ', '-')}/${item.slug}`;
  return (
    <Link href={url} className="block group">
      <Card className="overflow-hidden h-full flex flex-col hover:bg-muted/50 transition-colors">
        <div className="relative w-full aspect-[2/3]">
          <Image 
            src={item.imageUrl} 
            alt={`Cover for ${item.title}`}
            fill
            className="object-cover"
            data-ai-hint={item.imageHint}
          />
        </div>
        <div className="p-4 flex flex-col flex-grow">
          <Badge variant="secondary" className="w-min mb-2 capitalize">{item.type}</Badge>
          <h4 className="font-semibold group-hover:text-primary transition-colors line-clamp-2">{item.title}</h4>
        </div>
      </Card>
    </Link>
  );
}

function CharacterCard({ character }: { character: Character }) {
  return (
    <Link href={`/character/${character.slug}`} className="block group">
      <Card className="overflow-hidden h-full flex flex-col hover:bg-muted/50 transition-colors">
        <div className="relative w-full aspect-[2/3]">
          <Image 
            src={character.imageUrl} 
            alt={`Image of ${character.name}`}
            fill
            className="object-cover"
            data-ai-hint={character.imageHint}
          />
        </div>
        <div className="p-4 flex flex-col flex-grow">
          <Badge variant="secondary" className="w-min mb-2 capitalize">{character.role}</Badge>
          <h4 className="font-semibold group-hover:text-primary transition-colors line-clamp-2">{character.name}</h4>
        </div>
      </Card>
    </Link>
  )
}

function VoiceActorCard({ voiceActor }: { voiceActor: VoiceActor }) {
    return (
    <Link href={`/voice-actor/${voiceActor.slug}`} className="block group">
      <Card className="overflow-hidden h-full flex flex-col hover:bg-muted/50 transition-colors">
        <div className="relative w-full aspect-[2/3]">
          <Image 
            src={voiceActor.imageUrl} 
            alt={`Image of ${voiceActor.name}`}
            fill
            className="object-cover"
            data-ai-hint={voiceActor.imageHint}
          />
        </div>
        <div className="p-4 flex flex-col flex-grow">
           <h4 className="font-semibold group-hover:text-primary transition-colors line-clamp-2">{voiceActor.name}</h4>
        </div>
      </Card>
    </Link>
  )
}


export default function Home() {
  const { media, featuredCharacter, featuredVoiceActor } = getHomePageData();

  return (
    <main className="p-4 sm:p-8 space-y-12">
      <div>
        <h1 className="text-4xl font-headline mb-8 text-center">Variedades</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-6">
          {media.map(item => (
            <MediaCard key={`${item.type}-${item.id}`} item={item} />
          ))}
        </div>
      </div>
      
      <div className="space-y-8">
        {featuredCharacter && (
            <div>
                <h2 className="text-3xl font-headline mb-6 text-center">Personaje Destacado</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-6">
                    <CharacterCard character={featuredCharacter} />
                </div>
            </div>
        )}

        {featuredVoiceActor && (
            <div>
                <h2 className="text-3xl font-headline mb-6 text-center">Actor de Voz Destacado</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-6">
                    <VoiceActorCard voiceActor={featuredVoiceActor} />
                </div>
            </div>
        )}
      </div>

    </main>
  );
}