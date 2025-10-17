/**
 * @fileoverview Página de detalles para un personaje específico.
 * 
 * Esta página de servidor muestra información completa sobre un personaje,
 * identificado por su `slug` en la URL.
 */

import { pool } from '@/lib/database';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Clapperboard } from 'lucide-react';

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
    title: `${character.name_romaji || character.name} | Chirisu`,
    description: `Información sobre ${character.name_romaji || character.name}`,
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

  // Agrupar actores de voz por idioma
  const jaVoiceActors = voiceActors.filter(va => va.language === 'ja');
  const esVoiceActors = voiceActors.filter(va => va.language === 'es');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Columna izquierda - Imagen y datos básicos */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Información del Personaje
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Imagen del personaje */}
              <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg border mb-4">
                {character.image_url ? (
                  <Image
                    src={character.image_url}
                    alt={character.name_romaji || character.name}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-muted">
                    <User className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Nombre */}
              <div className="space-y-2">
                <h1 className="text-2xl font-bold">
                  {character.name_romaji || character.name}
                </h1>
                {character.name_native && (
                  <p className="text-lg text-muted-foreground">
                    {character.name_native}
                  </p>
                )}
              </div>

              {/* Información básica */}
              <div className="mt-4 space-y-2 text-sm">
                {character.age && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Edad:</span>
                    <span className="font-medium">{character.age}</span>
                  </div>
                )}
                {character.gender && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Género:</span>
                    <span className="font-medium">{character.gender}</span>
                  </div>
                )}
                {character.blood_type && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo de Sangre:</span>
                    <span className="font-medium">{character.blood_type}</span>
                  </div>
                )}
                {character.favorites_count > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Favoritos:</span>
                    <span className="font-medium">{character.favorites_count}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Columna derecha - Descripción, medios y actores */}
        <div className="md:col-span-2 space-y-6">
          {/* Descripción */}
          {character.description && (
            <Card>
              <CardHeader>
                <CardTitle>Descripción</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {character.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Actores de Voz */}
          {voiceActors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clapperboard className="h-5 w-5" />
                  Actores de Voz
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Actores japoneses */}
                  {jaVoiceActors.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <span className="text-lg">🇯🇵</span> Japonés
                      </h3>
                      <div className="space-y-3">
                        {jaVoiceActors.map((va) => (
                          <Link
                            key={va.id}
                            href={`/voice-actor/${va.slug || va.id}`}
                            className="flex gap-3 p-3 border rounded-lg hover:bg-accent transition-colors"
                          >
                            <div className="relative w-12 h-16 overflow-hidden rounded border bg-muted flex-shrink-0">
                              {va.image_url ? (
                                <Image
                                  src={va.image_url}
                                  alt={va.name_romaji}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex items-center justify-center h-full">
                                  <User className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm line-clamp-1">
                                {va.name_romaji}
                              </p>
                              {va.name_native && (
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {va.name_native}
                                </p>
                              )}
                              {va.hometown && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  📍 {va.hometown}
                                </p>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actores españoles */}
                  {esVoiceActors.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <span className="text-lg">🇪🇸</span> Español
                      </h3>
                      <div className="space-y-3">
                        {esVoiceActors.map((va) => (
                          <Link
                            key={va.id}
                            href={`/voice-actor/${va.slug || va.id}`}
                            className="flex gap-3 p-3 border rounded-lg hover:bg-accent transition-colors"
                          >
                            <div className="relative w-12 h-16 overflow-hidden rounded border bg-muted flex-shrink-0">
                              {va.image_url ? (
                                <Image
                                  src={va.image_url}
                                  alt={va.name_romaji}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex items-center justify-center h-full">
                                  <User className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm line-clamp-1">
                                {va.name_romaji}
                              </p>
                              {va.name_native && (
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {va.name_native}
                                </p>
                              )}
                              {va.hometown && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  📍 {va.hometown}
                                </p>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Apariciones en medios */}
          {media.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Apariciones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {media.map((m, idx) => (
                    <Link
                      key={idx}
                      href={`/${m.media_type}/${m.media_slug || m.media_id}`}
                      className="group"
                    >
                      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg border">
                        {m.media_image ? (
                          <Image
                            src={m.media_image}
                            alt={m.media_title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full bg-muted">
                            <Clapperboard className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="mt-2">
                        <p className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                          {m.media_title}
                        </p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {m.media_type}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {m.role === 'main' ? 'Principal' : 'Secundario'}
                          </Badge>
                        </div>
                      </div>
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
