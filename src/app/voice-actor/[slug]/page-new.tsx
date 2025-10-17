/**
 * @fileoverview Página de detalles para un actor de voz específico.
 * 
 * Muestra información sobre un actor de voz, incluyendo su foto y una lista
 * de los roles que ha interpretado.
 */

import { pool } from '@/lib/database';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, User, Clapperboard } from 'lucide-react';

type Props = {
  params: Promise<{ slug: string }>
}

async function getVoiceActorBySlug(slug: string) {
  const result = await pool.query(`
    SELECT 
      va.id,
      va.name_romaji,
      va.name_native,
      va.image_url,
      va.slug,
      va.bio,
      va.language,
      va.gender,
      va.hometown,
      va.date_of_birth,
      va.blood_type,
      va.favorites_count
    FROM app.voice_actors va
    WHERE va.slug = $1
    LIMIT 1
  `, [slug]);

  return result.rows[0] || null;
}

async function getVoiceActorRoles(voiceActorId: number) {
  const result = await pool.query(`
    SELECT 
      c.id as character_id,
      c.name as character_name,
      c.name_romaji as character_name_romaji,
      c.name_native as character_name_native,
      c.image_url as character_image,
      c.slug as character_slug,
      cc.role as character_role,
      cva.media_type,
      cva.media_id,
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
    LEFT JOIN app.characterable_characters cc ON cc.character_id = c.id 
      AND cc.characterable_type = cva.media_type 
      AND cc.characterable_id = cva.media_id
    LEFT JOIN app.anime a ON cva.media_type = 'anime' AND a.id = cva.media_id
    LEFT JOIN app.manga m ON cva.media_type = 'manga' AND m.id = cva.media_id
    LEFT JOIN app.novels n ON cva.media_type = 'novel' AND n.id = cva.media_id
    WHERE cva.voice_actor_id = $1
    ORDER BY cva.media_type, cva.media_id
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

  const languageLabel = voiceActor.language === 'ja' ? 'Japonés' : 'Español';

  return {
    title: `${voiceActor.name_romaji} | Actor de Voz ${languageLabel} | Chirisu`,
    description: voiceActor.bio || `Información sobre el actor de voz ${voiceActor.name_romaji}`,
  }
}

export default async function VoiceActorPage({ params }: Props) {
  const { slug } = await params;
  const voiceActor = await getVoiceActorBySlug(slug);

  if (!voiceActor) {
    notFound();
  }

  const roles = await getVoiceActorRoles(voiceActor.id);

  const languageFlag = voiceActor.language === 'ja' ? '🇯🇵' : '🇪🇸';
  const languageLabel = voiceActor.language === 'ja' ? 'Japonés' : 'Español';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Columna izquierda - Imagen y datos básicos */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                Actor de Voz
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Imagen del actor */}
              <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg border mb-4">
                {voiceActor.image_url ? (
                  <Image
                    src={voiceActor.image_url}
                    alt={voiceActor.name_romaji}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-muted">
                    <Mic className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Nombre */}
              <div className="space-y-2">
                <h1 className="text-2xl font-bold">
                  {voiceActor.name_romaji}
                </h1>
                {voiceActor.name_native && (
                  <p className="text-lg text-muted-foreground">
                    {voiceActor.name_native}
                  </p>
                )}
              </div>

              {/* Información básica */}
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Idioma:</span>
                  <span className="font-medium">
                    {languageFlag} {languageLabel}
                  </span>
                </div>
                {voiceActor.gender && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Género:</span>
                    <span className="font-medium">{voiceActor.gender}</span>
                  </div>
                )}
                {voiceActor.hometown && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Origen:</span>
                    <span className="font-medium">{voiceActor.hometown}</span>
                  </div>
                )}
                {voiceActor.blood_type && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo de Sangre:</span>
                    <span className="font-medium">{voiceActor.blood_type}</span>
                  </div>
                )}
                {voiceActor.favorites_count > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Favoritos:</span>
                    <span className="font-medium">{voiceActor.favorites_count}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Columna derecha - Bio y roles */}
        <div className="md:col-span-2 space-y-6">
          {/* Biografía */}
          {voiceActor.bio && (
            <Card>
              <CardHeader>
                <CardTitle>Biografía</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {voiceActor.bio}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Roles interpretados */}
          {roles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personajes Interpretados ({roles.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {roles.map((role, idx) => (
                    <div 
                      key={idx}
                      className="flex gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      {/* Personaje */}
                      <Link 
                        href={`/character/${role.character_slug || role.character_id}`}
                        className="flex gap-3 flex-1 group"
                      >
                        <div className="relative w-16 h-24 overflow-hidden rounded border bg-muted flex-shrink-0">
                          {role.character_image ? (
                            <Image
                              src={role.character_image}
                              alt={role.character_name_romaji || role.character_name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <User className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                            {role.character_name_romaji || role.character_name}
                          </p>
                          {role.character_name_native && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {role.character_name_native}
                            </p>
                          )}
                          {role.character_role && (
                            <Badge variant="secondary" className="mt-1 text-[10px]">
                              {role.character_role === 'main' ? 'Principal' : 'Secundario'}
                            </Badge>
                          )}
                        </div>
                      </Link>

                      {/* Medio */}
                      {role.media_title && (
                        <Link
                          href={`/${role.media_type}/${role.media_slug || role.media_id}`}
                          className="flex gap-3 w-48 group"
                        >
                          <div className="relative w-12 h-16 overflow-hidden rounded border bg-muted flex-shrink-0">
                            {role.media_image ? (
                              <Image
                                src={role.media_image}
                                alt={role.media_title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <Clapperboard className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium line-clamp-2 group-hover:text-primary transition-colors">
                              {role.media_title}
                            </p>
                            <Badge variant="outline" className="mt-1 text-[9px]">
                              {role.media_type}
                            </Badge>
                          </div>
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {roles.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No hay roles registrados aún.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
