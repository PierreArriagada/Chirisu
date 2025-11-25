/**
 * @fileoverview TopCharactersCard - Tarjeta para mostrar el ranking de personajes.
 * 
 * Este componente muestra una lista de los personajes más populares. Cada
 * personaje se presenta con su imagen, nombre y un enlace a su página de perfil
 * detallada. Se utiliza en la barra lateral de la página principal para destacar
 * a los personajes favoritos de la comunidad.
 * 
 * Este es un Server Component que delega la carga de imágenes interactivas
 * al componente client CharacterImage.
 */

import type { Character } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { CharacterImage } from '@/components/shared';

interface TopCharactersCardProps {
  characters: Character[];
}

export default function TopCharactersCard({ characters }: TopCharactersCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Personajes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {characters.map((character, index) => (
          <Link href={`/character/${character.slug}`} key={character.id} className="block group">
            <div className="flex items-center gap-4 p-2 rounded-lg transition-colors group-hover:bg-accent/50">
              <span className="text-lg font-bold text-muted-foreground w-6 text-center">
                {index + 1}
              </span>
              <CharacterImage 
                imageUrl={character.imageUrl}
                name={character.name}
                width={40}
                height={60}
              />
              <h4 className="font-semibold text-sm leading-tight truncate group-hover:text-accent-foreground">
                {character.name}
              </h4>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
