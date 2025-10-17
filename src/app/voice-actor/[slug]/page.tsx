/**
 * @fileoverview Página de detalles para un actor de voz específico.
 * 
 * Muestra información sobre un actor de voz, incluyendo su foto y una lista
 * de los roles que ha interpretado. Cada rol muestra tanto el personaje
 * como el medio (anime/manga) al que pertenece, con enlaces a sus
 * respectivas páginas de detalles.
 */

import { pool } from '@/lib/database';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Briefcase } from 'lucide-react';
import { FavoriteButton } from '@/components/favorite-button';

type Props = {
  params: Promise<{ slug: string }>
}

async function getVoiceActorBySlug(slug: string) {
  const result = await pool.query(`
    SELECT 
      id,
      name_romaji,
      name_native,
      image_url,
      language,
      bio,
      slug,
      favorites_count,
      gender,
      date_of_birth,
      blood_type,
      hometown
    FROM app.voice_actors
    WHERE slug = $1
    LIMIT 1
  `, [slug]);

  return result.rows[0] || null;
}

async function getVoiceActorRoles(voiceActorId: number) {
  const result = await pool.query(`
    SELECT 
      c.id as character_id,
      c.name,
      c.name_romaji as character_name_romaji,
      c.name_native as character_name_native,
      c.image_url as character_image,
      c.slug as character_slug,
      cva.media_type,
      cva.media_id,
      cc.role as character_role,
      CASE 
        WHEN cva.media_type = 'anime' THEN a.title_romaji
        WHEN cva.media_type = 'manga' THEN m.title_romaji
        WHEN cva.media_type = 'novel' THEN n.title_romaji
      END as media_title,
      CASE 
        WHEN cva.media_type = 'anime' THEN a.slug
        WHEN cva.media_type = 'manga' THEN m.slug
        WHEN cva.media_type = 'novel' THEN n.slug
      END as media_slug,
      CASE 
        WHEN cva.media_type = 'anime' THEN a.cover_image_url
        WHEN cva.media_type = 'manga' THEN m.cover_image_url
        WHEN cva.media_type = 'novel' THEN n.cover_image_url
      END as media_image
    FROM app.character_voice_actors cva
    JOIN app.characters c ON c.id = cva.character_id
    LEFT JOIN app.characterable_characters cc 
      ON cc.character_id = c.id 
      AND cc.characterable_type = cva.media_type 
      AND cc.characterable_id = cva.media_id
    LEFT JOIN app.anime a ON cva.media_type = 'anime' AND a.id = cva.media_id
    LEFT JOIN app.manga m ON cva.media_type = 'manga' AND m.id = cva.media_id
    LEFT JOIN app.novels n ON cva.media_type = 'novel' AND n.id = cva.media_id
    WHERE cva.voice_actor_id = $1
    ORDER BY media_title, c.name
  `, [voiceActorId]);

  return result.rows;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const voiceActor = await getVoiceActorBySlug(slug);

  if (!voiceActor) {
    return {
      title: 'Actor de Voz no encontrado',
    }
  }

  return {
    title: `${voiceActor.name_romaji} | Chirisu`,
    description: `Roles and information about voice actor ${voiceActor.name_romaji}.`,
  }
}

export default async function VoiceActorPage({ params }: Props) {
  const { slug } = await params;
  
  const voiceActor = await getVoiceActorBySlug(slug);
  
  if (!voiceActor) {
    notFound();
  }

  const roles = await getVoiceActorRoles(voiceActor.id);

  // Bandera de idioma
  const languageFlag = voiceActor.language === 'ja' ? '🇯🇵' : voiceActor.language === 'es' ? '🇪🇸' : '🌐';

  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Voice Actor Image & Info */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardContent className="p-6">
              {voiceActor.image_url && (
                <div className="relative w-full aspect-[2/3] mb-4 rounded-lg overflow-hidden">
                  <Image 
                    src={voiceActor.image_url} 
                    alt={voiceActor.name_romaji} 
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold mb-1">{voiceActor.name_romaji}</h1>
                    <FavoriteButton itemType="voice_actor" itemId={voiceActor.id} />
                  </div>
                  {voiceActor.name_native && (
                    <p className="text-muted-foreground">{voiceActor.name_native}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-2xl">{languageFlag}</span>
                    <span className="text-sm text-muted-foreground">
                      {voiceActor.language === 'ja' ? 'Japonés' : voiceActor.language === 'es' ? 'Español' : voiceActor.language}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  {voiceActor.gender && (
                    <div>
                      <span className="text-muted-foreground">Género:</span>
                      <p className="font-medium capitalize">{voiceActor.gender}</p>
                    </div>
                  )}
                  {voiceActor.hometown && (
                    <div>
                      <span className="text-muted-foreground">Ciudad:</span>
                      <p className="font-medium">{voiceActor.hometown}</p>
                    </div>
                  )}
                  {voiceActor.blood_type && (
                    <div>
                      <span className="text-muted-foreground">Tipo de Sangre:</span>
                      <p className="font-medium">{voiceActor.blood_type}</p>
                    </div>
                  )}
                  {voiceActor.favorites_count > 0 && (
                    <div>
                      <span className="text-muted-foreground">Favoritos:</span>
                      <p className="font-medium">{voiceActor.favorites_count}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Bio & Roles */}
        <div className="lg:col-span-2 space-y-6">
          {/* Biography */}
          {voiceActor.bio && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Biografía
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-line">{voiceActor.bio}</p>
              </CardContent>
            </Card>
          )}

          {/* Roles */}
          {roles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  Roles Interpretados ({roles.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {roles.map((role: any, index: number) => (
                    <div 
                      key={`${role.character_id}-${role.media_id}-${index}`} 
                      className="grid grid-cols-2 gap-4 p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      {/* Character Side */}
                      <Link href={`/character/${role.character_slug}`} className="flex items-center gap-3 group">
                        {role.character_image && (
                          <div className="relative w-12 h-16 rounded overflow-hidden flex-shrink-0">
                            <Image 
                              src={role.character_image} 
                              alt={role.character_name_romaji || role.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate group-hover:text-primary transition-colors">
                            {role.character_name_romaji || role.name}
                          </p>
                          {role.character_role && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              {role.character_role}
                            </Badge>
                          )}
                        </div>
                      </Link>

                      {/* Media Side */}
                      <Link href={`/${role.media_type}/${role.media_slug}`} className="flex items-center gap-3 justify-end group">
                        <div className="flex-1 min-w-0 text-right">
                          <p className="font-semibold truncate group-hover:text-primary transition-colors">
                            {role.media_title}
                          </p>
                          <Badge variant="outline" className="text-xs mt-1 capitalize">
                            {role.media_type}
                          </Badge>
                        </div>
                        {role.media_image && (
                          <div className="relative w-12 h-16 rounded overflow-hidden flex-shrink-0">
                            <Image 
                              src={role.media_image} 
                              alt={role.media_title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                        )}
                      </Link>
                    </div>
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
