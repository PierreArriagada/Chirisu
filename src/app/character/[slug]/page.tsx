/**
 * @fileoverview Página de detalles para un personaje específico.
 * 
 * Esta página de servidor muestra información completa sobre un personaje,
 * identificado por su `slug` en la URL.
 * - Muestra la imagen, nombre y rol del personaje.
 * - Lista el medio (anime/manga) en el que aparece.
 * - Muestra y enlaza a los perfiles de sus actores de voz (japonés y español).
 */

import { pool } from '@/lib/database';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Clapperboard } from 'lucide-react';
import { FavoriteButton } from '@/components/favorite-button';

type Props = {
  params: Promise<{ slug: string }>
}

async function getCharacterBySlug(slug: string) {
  const result = await pool.query(`
    SELECT 
      c.id,
      c.name,
      c.name_romaji,
      c.name_native,
      c.image_url,
      c.description,
      c.slug,
      c.favorites_count,
      c.gender,
      c.age,
      c.blood_type,
      c.date_of_birth
    FROM app.characters c
    WHERE c.slug = $1
    LIMIT 1
  `, [slug]);

  return result.rows[0] || null;
}

async function getCharacterMedia(characterId: number) {
  const result = await pool.query(`
    SELECT DISTINCT
      cc.characterable_type as media_type,
      cc.characterable_id as media_id,
      cc.role,
      CASE 
        WHEN cc.characterable_type = 'anime' THEN a.title_romaji
        WHEN cc.characterable_type = 'manga' THEN m.title_romaji
        WHEN cc.characterable_type = 'novel' THEN n.title_romaji
      END as media_title,
      CASE 
        WHEN cc.characterable_type = 'anime' THEN a.slug
        WHEN cc.characterable_type = 'manga' THEN m.slug
        WHEN cc.characterable_type = 'novel' THEN n.slug
      END as media_slug,
      CASE 
        WHEN cc.characterable_type = 'anime' THEN a.cover_image_url
        WHEN cc.characterable_type = 'manga' THEN m.cover_image_url
        WHEN cc.characterable_type = 'novel' THEN n.cover_image_url
      END as media_image
    FROM app.characterable_characters cc
    LEFT JOIN app.anime a ON cc.characterable_type = 'anime' AND a.id = cc.characterable_id
    LEFT JOIN app.manga m ON cc.characterable_type = 'manga' AND m.id = cc.characterable_id
    LEFT JOIN app.novels n ON cc.characterable_type = 'novel' AND n.id = cc.characterable_id
    WHERE cc.character_id = $1
  `, [characterId]);

  return result.rows;
}

async function getCharacterVoiceActors(characterId: number) {
  const result = await pool.query(`
    SELECT 
      va.id,
      va.name_romaji,
      va.name_native,
      va.slug,
      va.image_url,
      va.bio,
      va.language,
      va.gender,
      va.hometown,
      cva.media_type,
      cva.media_id
    FROM app.character_voice_actors cva
    JOIN app.voice_actors va ON va.id = cva.voice_actor_id
    WHERE cva.character_id = $1
    ORDER BY va.language
  `, [characterId]);

  return result.rows;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const character = await getCharacterBySlug(slug);

  if (!character) {
    return {
      title: 'Personaje no encontrado',
    }
  }

  return {
    title: `${character.name} | Chirisu`,
    description: `Information about the character ${character.name}.`,
  }
}

export default async function CharacterPage({ params }: Props) {
  const { slug } = await params;
  
  const character = await getCharacterBySlug(slug);
  
  if (!character) {
    notFound();
  }

  const media = await getCharacterMedia(character.id);
  const voiceActors = await getCharacterVoiceActors(character.id);

  // Agrupar voice actors por idioma
  const vaByLanguage = voiceActors.reduce((acc: any, va: any) => {
    if (va.language === 'ja') acc.japanese = va;
    if (va.language === 'es') acc.spanish = va;
    return acc;
  }, { japanese: null, spanish: null });

  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Character Image & Basic Info */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardContent className="p-6">
              {character.image_url && (
                <div className="relative w-full aspect-[2/3] mb-4 rounded-lg overflow-hidden">
                  <Image 
                    src={character.image_url} 
                    alt={character.name} 
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold mb-1">{character.name_romaji || character.name}</h1>
                    <FavoriteButton itemType="character" itemId={character.id} />
                  </div>
                  {character.name_native && (
                    <p className="text-muted-foreground">{character.name_native}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  {character.age && (
                    <div>
                      <span className="text-muted-foreground">Edad:</span>
                      <p className="font-medium">{character.age}</p>
                    </div>
                  )}
                  {character.gender && (
                    <div>
                      <span className="text-muted-foreground">Género:</span>
                      <p className="font-medium capitalize">{character.gender}</p>
                    </div>
                  )}
                  {character.blood_type && (
                    <div>
                      <span className="text-muted-foreground">Tipo de Sangre:</span>
                      <p className="font-medium">{character.blood_type}</p>
                    </div>
                  )}
                  {character.favorites_count > 0 && (
                    <div>
                      <span className="text-muted-foreground">Favoritos:</span>
                      <p className="font-medium">{character.favorites_count}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Description, Voice Actors, Media */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {character.description && (
            <Card>
              <CardHeader>
                <CardTitle>Descripción</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-line">{character.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Voice Actors */}
          {(vaByLanguage.japanese || vaByLanguage.spanish) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Actores de Voz
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vaByLanguage.japanese && (
                  <Link href={`/voice-actor/${vaByLanguage.japanese.slug}`} className="group">
                    <Card className="p-4 transition-all hover:bg-accent hover:shadow-md">
                      <div className="flex items-center gap-3">
                        {vaByLanguage.japanese.image_url && (
                          <div className="relative w-16 h-20 rounded overflow-hidden flex-shrink-0">
                            <Image 
                              src={vaByLanguage.japanese.image_url} 
                              alt={vaByLanguage.japanese.name_romaji}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold group-hover:text-primary transition-colors">
                            {vaByLanguage.japanese.name_romaji}
                          </p>
                          <p className="text-sm text-muted-foreground">🇯🇵 Japonés</p>
                          {vaByLanguage.japanese.bio && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {vaByLanguage.japanese.bio}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  </Link>
                )}

                {vaByLanguage.spanish && (
                  <Link href={`/voice-actor/${vaByLanguage.spanish.slug}`} className="group">
                    <Card className="p-4 transition-all hover:bg-accent hover:shadow-md">
                      <div className="flex items-center gap-3">
                        {vaByLanguage.spanish.image_url && (
                          <div className="relative w-16 h-20 rounded overflow-hidden flex-shrink-0">
                            <Image 
                              src={vaByLanguage.spanish.image_url} 
                              alt={vaByLanguage.spanish.name_romaji}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold group-hover:text-primary transition-colors">
                            {vaByLanguage.spanish.name_romaji}
                          </p>
                          <p className="text-sm text-muted-foreground">🇪🇸 Español</p>
                          {vaByLanguage.spanish.bio && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {vaByLanguage.spanish.bio}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}

          {/* Media Appearances */}
          {media.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clapperboard className="w-5 h-5" />
                  Apariciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {media.map((m: any, index: number) => (
                    <Link 
                      key={index} 
                      href={`/${m.media_type}/${m.media_slug}`}
                      className="group"
                    >
                      <Card className="p-3 transition-all hover:bg-accent hover:shadow-md">
                        <div className="flex items-center gap-3">
                          {m.media_image && (
                            <div className="relative w-12 h-16 rounded overflow-hidden flex-shrink-0">
                              <Image 
                                src={m.media_image} 
                                alt={m.media_title}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate group-hover:text-primary transition-colors">
                              {m.media_title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs capitalize">
                                {m.media_type}
                              </Badge>
                              {m.role && (
                                <Badge variant="outline" className="text-xs">
                                  {m.role}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
