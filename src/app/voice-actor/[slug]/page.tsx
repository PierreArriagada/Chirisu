import { getVoiceActorPageData } from '@/lib/db';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type Props = {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = getVoiceActorPageData(params.slug);

  if (!data || !data.voiceActor) {
    return {
      title: 'Actor de Voz no encontrado',
    }
  }

  return {
    title: `${data.voiceActor.name} | Chirisu`,
    description: `Roles and information about voice actor ${data.voiceActor.name}.`,
  }
}

export default function VoiceActorPage({ params }: Props) {
  const data = getVoiceActorPageData(params.slug);

  if (!data || !data.voiceActor) {
    notFound();
  }

  const { voiceActor, roles } = data;

  return (
    <main className="container mx-auto p-2 sm:p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
                <Image src={voiceActor.imageUrl} alt={voiceActor.name} width={400} height={600} className="rounded-lg w-full aspect-[2/3] object-cover" data-ai-hint={voiceActor.imageHint} />
            </CardHeader>
            <CardContent>
                <h1 className="text-2xl font-bold">{voiceActor.name}</h1>
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Roles Interpretados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {roles.map(role => (
                <Card key={`${role.mediaSlug}-${role.characterSlug}`} className="flex items-start gap-4 p-4">
                    {/* Character Info */}
                    <div className="w-1/2 flex items-center gap-4">
                        <Link href={`/character/${role.characterSlug}`} className="flex-shrink-0 group">
                             <Image src={role.characterImageUrl} alt={role.characterName} width={60} height={90} className="rounded-md aspect-[2/3] object-cover group-hover:ring-2 ring-primary transition-all" data-ai-hint={role.characterImageHint} />
                        </Link>
                        <div className='overflow-hidden'>
                            <Link href={`/character/${role.characterSlug}`} className="group">
                               <h3 className="font-semibold truncate group-hover:text-primary transition-colors">{role.characterName}</h3>
                            </Link>
                            <Badge variant="secondary">{role.role}</Badge>
                        </div>
                    </div>
                    {/* Media Info */}
                    <div className="w-1/2 flex items-center justify-end text-right gap-4">
                         <div className='overflow-hidden'>
                             <Link href={`/${role.mediaType.toLowerCase()}/${role.mediaSlug}`} className="group">
                                <h3 className="font-semibold truncate group-hover:text-primary transition-colors">{role.mediaTitle}</h3>
                             </Link>
                            <Badge variant="outline" className="capitalize">{role.mediaType}</Badge>
                        </div>
                        <Link href={`/${role.mediaType.toLowerCase()}/${role.mediaSlug}`} className="flex-shrink-0 group">
                           <Image src={`https://picsum.photos/seed/${role.mediaSlug}/60/90`} alt={role.mediaTitle} width={60} height={90} className="rounded-md aspect-[2/3] object-cover group-hover:ring-2 ring-primary transition-all" data-ai-hint={`${role.mediaType} cover`} />
                        </Link>
                    </div>
                </Card>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
