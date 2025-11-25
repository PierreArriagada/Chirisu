/**
 * @fileoverview TopPeopleCard - Tarjeta para mostrar el ranking de personas.
 * 
 * Muestra una lista de las personas más destacadas, como actores de voz,
 * directores o miembros del staff. Cada persona se muestra con su imagen,
 * nombre y un enlace a su página de perfil. Es ideal para la barra lateral
 * de la página de inicio para dar visibilidad a los creadores.
 */

import type { VoiceActor } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SafeImage } from '@/components/ui/safe-image';
import Link from 'next/link';

interface TopPeopleCardProps {
  people: VoiceActor[];
}

export default function TopPeopleCard({ people }: TopPeopleCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Personas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {people.map((person, index) => (
          <Link href={`/voice-actor/${person.slug}`} key={person.id} className="block group">
            <div className="flex items-center gap-4 p-2 rounded-lg transition-colors group-hover:bg-accent/50">
              <span className="text-lg font-bold text-muted-foreground w-6 text-center">
                {index + 1}
              </span>
              <SafeImage
                src={person.imageUrl}
                alt={person.name}
                width={40}
                height={60}
                className="rounded-md aspect-[2/3]"
                objectFit="cover"
              />
              <h4 className="font-semibold text-sm leading-tight truncate group-hover:text-accent-foreground">
                {person.name}
              </h4>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
