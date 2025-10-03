import { getCharacterPageData } from '@/lib/db';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Clapperboard } from 'lucide-react';

type Props = {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = getCharacterPageData(params.slug);

  if (!data || !data.character) {
    return {
      title: 'Personaje no encontrado',
    }
  }

  return {
    title: `${data.character.name} | Chirisu`,
    description: `Information about the character ${data.character.name}.`,
  }
}

export default function CharacterPage({ params }: Props) {
  const data = getCharacterPageData(params.slug);

  if (!data || !data.character) {
    notFound();
  }

  const { character, media } = data;

  return (
    <main className="container mx-auto p-2 sm:p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
                <Image src={character.imageUrl} alt={character.name} width={400} height={600} className="rounded-lg w-full aspect-[2/3] object-cover" data-ai-hint={character.imageHint} />
            </CardHeader>
            <CardContent>
                <h1 className="text-2xl font-bold mb-2">{character.name}</h1>
                <Badge variant="secondary">{character.role} Role</Badge>
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-2 space-y-8">
          {media && (
             <Card>
                <CardHeader>
                    <CardTitle>Aparece en</CardTitle>
                </CardHeader>
                <CardContent>
                    <Link href={`/${media.type.toLowerCase()}/${media.slug}`} className="group">
                        <Card className="flex items-center gap-4 p-3 overflow-hidden transition-all duration-200 group-hover:bg-accent/50 group-hover:shadow-md">
                            <div className="flex-shrink-0">
                                <Image
                                    src={media.imageUrl}
                                    alt={`Cover for ${media.title}`}
                                    width={50}
                                    height={75}
                                    className="rounded-md object-cover aspect-[2/3]"
                                    data-ai-hint={media.imageHint}
                                />
                            </div>
                            <div className="flex flex-col justify-center gap-1 overflow-hidden">
                                <h4 className="font-semibold leading-tight truncate group-hover:text-accent-foreground">{media.title}</h4>
                                <Badge variant="secondary" className='capitalize w-min'>{media.type}</Badge>
                            </div>
                        </Card>
                    </Link>
                </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle>Actores de Voz</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <Link href={`/voice-actor/${character.voiceActors.japanese.slug}`} className="group">
                    <Card className="p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors">
                        <Image src={character.voiceActors.japanese.imageUrl} alt={character.voiceActors.japanese.name} width={80} height={120} className="rounded-md aspect-[2/3] object-cover" data-ai-hint={character.voiceActors.japanese.imageHint} />
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold group-hover:text-primary transition-colors">{character.voiceActors.japanese.name}</span>
                            <span className="text-sm text-muted-foreground flex items-center gap-1">🇯🇵 Japanese</span>
                        </div>
                    </Card>
               </Link>
                <Link href={`/voice-actor/${character.voiceActors.spanish.slug}`} className="group">
                    <Card className="p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors">
                        <Image src={character.voiceActors.spanish.imageUrl} alt={character.voiceActors.spanish.name} width={80} height={120} className="rounded-md aspect-[2/3] object-cover" data-ai-hint={character.voiceActors.spanish.imageHint} />
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold group-hover:text-primary transition-colors">{character.voiceActors.spanish.name}</span>
                            <span className="text-sm text-muted-foreground">🇪🇸 Spanish</span>
                        </div>
                    </Card>
                </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
