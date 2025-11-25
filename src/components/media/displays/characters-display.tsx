"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import Link from "next/link";
import { Users } from "lucide-react";

interface Character {
  id: number;
  name: string;
  name_romaji?: string;
  name_native?: string;
  image_url?: string;
  description?: string;
  slug?: string;
  favorites_count?: number;
  gender?: string;
  age?: string;
  blood_type?: string;
  date_of_birth?: string;
  role: 'main' | 'supporting';
  // Japanese voice actor
  va_jp_id?: number;
  va_jp_name_romaji?: string;
  va_jp_name_native?: string;
  va_jp_slug?: string;
  va_jp_image?: string;
  va_jp_bio?: string;
  va_jp_gender?: string;
  va_jp_hometown?: string;
  // Spanish voice actor
  va_es_id?: number;
  va_es_name_romaji?: string;
  va_es_name_native?: string;
  va_es_slug?: string;
  va_es_image?: string;
  va_es_bio?: string;
  va_es_gender?: string;
  va_es_hometown?: string;
}

interface CharactersData {
  main: Character[];
  supporting: Character[];
  total: number;
  mainCount: number;
  supportingCount: number;
}

interface CharactersDisplayProps {
  mediaId: number;
  mediaType: 'anime' | 'manga';
}

export default function CharactersDisplay({ mediaId, mediaType }: CharactersDisplayProps) {
  const [data, setData] = useState<CharactersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCharacters() {
      try {
        setLoading(true);
        const response = await fetch(`/api/${mediaType}/${mediaId}/characters`);
        
        if (!response.ok) {
          throw new Error('Error al cargar personajes');
        }

        const result = await response.json();
        
        if (result.success) {
          setData(result.data);
        } else {
          throw new Error(result.error || 'Error desconocido');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar personajes');
        console.error('Error fetching characters:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCharacters();
  }, [mediaId, mediaType]);

  const renderCharacterCard = (character: Character) => (
    <div key={character.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
      <div className="flex gap-4 flex-col md:flex-row">
        {/* Character Section */}
        <div className="flex gap-3 flex-1 min-w-0">
          <Link href={`/character/${character.slug || character.id}`} className="flex-shrink-0">
            <div className="relative w-16 h-24 overflow-hidden rounded border bg-muted">
              {character.image_url ? (
                <Image
                  src={character.image_url}
                  alt={character.name_romaji || character.name}
                  fill
                  className="object-cover hover:scale-110 transition-transform duration-200"
                  sizes="64px"
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-muted">
                  <Users className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
            </div>
          </Link>

          <div className="flex-1 min-w-0">
            <Link 
              href={`/character/${character.slug || character.id}`}
              className="hover:text-primary transition-colors group"
            >
              <h4 className="font-semibold text-sm line-clamp-1 group-hover:underline">
                {character.name_romaji || character.name}
              </h4>
            </Link>
            {character.name_native && (
              <p className="text-xs text-muted-foreground line-clamp-1">
                {character.name_native}
              </p>
            )}
            <Badge 
              variant={character.role === 'main' ? 'default' : 'secondary'}
              className="mt-1 text-[10px] h-5"
            >
              {character.role === 'main' ? 'Principal' : 'Secundario'}
            </Badge>
            {character.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-2">
                {character.description}
              </p>
            )}
            <div className="flex gap-3 mt-1 text-[10px] text-muted-foreground flex-wrap">
              {character.age && <span>Edad: {character.age}</span>}
              {character.gender && <span>{character.gender}</span>}
              {character.blood_type && <span>Tipo {character.blood_type}</span>}
            </div>
          </div>
        </div>

        {/* Voice Actors Section - Side by Side */}
        {(character.va_jp_id || character.va_es_id) && (
          <div className="flex gap-3 md:w-80 border-t md:border-t-0 md:border-l pt-3 md:pt-0 md:pl-3">
            {/* Japanese Voice Actor */}
            {character.va_jp_id && (
              <div className="flex-1">
                <p className="text-[10px] font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                  <span className="text-xs">🇯🇵</span> Japonés
                </p>
                <Link 
                  href={`/voice-actor/${character.va_jp_slug || character.va_jp_id}`}
                  className="flex gap-2 hover:bg-accent/50 rounded p-1 -m-1 transition-colors group"
                >
                  <div className="relative w-10 h-12 overflow-hidden rounded border bg-muted flex-shrink-0">
                    {character.va_jp_image ? (
                      <Image
                        src={character.va_jp_image}
                        alt={character.va_jp_name_romaji || 'VA'}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-muted">
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium line-clamp-1 group-hover:underline">
                      {character.va_jp_name_romaji}
                    </p>
                    {character.va_jp_name_native && (
                      <p className="text-[10px] text-muted-foreground line-clamp-1">
                        {character.va_jp_name_native}
                      </p>
                    )}
                    {character.va_jp_hometown && (
                      <p className="text-[9px] text-muted-foreground line-clamp-1 mt-0.5">
                        📍 {character.va_jp_hometown}
                      </p>
                    )}
                  </div>
                </Link>
              </div>
            )}

            {/* Spanish Voice Actor */}
            {character.va_es_id && (
              <div className="flex-1">
                <p className="text-[10px] font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                  <span className="text-xs">🇪🇸</span> Español
                </p>
                <Link 
                  href={`/voice-actor/${character.va_es_slug || character.va_es_id}`}
                  className="flex gap-2 hover:bg-accent/50 rounded p-1 -m-1 transition-colors group"
                >
                  <div className="relative w-10 h-12 overflow-hidden rounded border bg-muted flex-shrink-0">
                    {character.va_es_image ? (
                      <Image
                        src={character.va_es_image}
                        alt={character.va_es_name_romaji || 'VA'}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-muted">
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium line-clamp-1 group-hover:underline">
                      {character.va_es_name_romaji}
                    </p>
                    {character.va_es_name_native && (
                      <p className="text-[10px] text-muted-foreground line-clamp-1">
                        {character.va_es_name_native}
                      </p>
                    )}
                    {character.va_es_hometown && (
                      <p className="text-[9px] text-muted-foreground line-clamp-1 mt-0.5">
                        📍 {character.va_es_hometown}
                      </p>
                    )}
                  </div>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="border rounded-lg p-4">
            <div className="flex gap-4">
              <Skeleton className="h-24 w-16 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-5 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Personajes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.total === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No hay personajes registrados aún.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Characters */}
      {data.main.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="font-semibold text-sm">Personajes Principales</h3>
            <Badge variant="secondary" className="text-xs">
              {data.mainCount}
            </Badge>
          </div>
          <div className="space-y-3">
            {data.main.map(renderCharacterCard)}
          </div>
        </div>
      )}

      {/* Supporting Characters */}
      {data.supporting.length > 0 && (
        <div>
          <Separator className="my-4" />
          <div className="flex items-center gap-2 mb-3">
            <h3 className="font-semibold text-sm">Personajes Secundarios</h3>
            <Badge variant="secondary" className="text-xs">
              {data.supportingCount}
            </Badge>
          </div>
          <div className="space-y-3">
            {data.supporting.map(renderCharacterCard)}
          </div>
        </div>
      )}
    </div>
  );
}
