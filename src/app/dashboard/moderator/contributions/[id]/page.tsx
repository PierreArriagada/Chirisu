/**
 * ========================================
 * PÁGINA: DETALLE DE CONTRIBUCIÓN
 * ========================================
 * Vista detallada para revisar y aprobar/rechazar contribución
 */

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle, ArrowLeft, User, Calendar, Film } from 'lucide-react';
import Link from 'next/link';

interface Contribution {
  id: string;
  userId: string;
  contributableType: string;
  contributionData: any;
  status: string;
  createdAt: string;
  user: {
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
}

export default function ContributionDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [contribution, setContribution] = useState<Contribution | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    fetchContribution();
  }, [user, router, params.id]);

  const fetchContribution = async () => {
    try {
      const response = await fetch(`/api/moderation/contributions/${params.id}`);
      const data = await response.json();

      if (data.success) {
        setContribution(data.contribution);
      } else {
        toast({
          title: 'Error',
          description: 'No se pudo cargar la contribución',
          variant: 'destructive',
        });
        router.push('/dashboard/moderator/contributions');
      }
    } catch (error) {
      console.error('Error al cargar contribución:', error);
      toast({
        title: 'Error',
        description: 'Error al cargar la contribución',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!contribution) return;

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/moderation/contributions/${contribution.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: '¡Contribución aprobada!',
          description: 'El anime ha sido creado exitosamente',
        });
        router.push('/dashboard/moderator/contributions');
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo aprobar la contribución',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!contribution) return;

    if (!rejectionReason.trim()) {
      toast({
        title: 'Error',
        description: 'Debes proporcionar un motivo de rechazo',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/moderation/contributions/${contribution.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          rejectionReason: rejectionReason.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Contribución rechazada',
          description: 'El usuario ha sido notificado',
        });
        router.push('/dashboard/moderator/contributions');
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo rechazar la contribución',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!contribution) {
    return null;
  }

  const data = contribution.contributionData;

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <Link href="/dashboard/moderator/contributions">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al panel
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-3xl font-bold mb-2">
                {data.title_romaji || data.title_english || data.name || data.name_romaji || 'Sin título'}
              </CardTitle>
              <CardDescription className="text-base">
                Revisión de contribución - {
                  contribution.contributableType === 'anime' ? 'Anime' : 
                  contribution.contributableType === 'manga' ? 'Manga' : 
                  contribution.contributableType === 'novel' ? 'Novela' :
                  contribution.contributableType === 'donghua' ? 'Donghua' :
                  contribution.contributableType === 'manhua' ? 'Manhua' :
                  contribution.contributableType === 'manhwa' ? 'Manhwa' :
                  contribution.contributableType === 'fan_comic' ? 'Fan Comic' :
                  contribution.contributableType === 'character' ? 'Personaje' :
                  contribution.contributableType === 'staff' ? 'Staff' :
                  contribution.contributableType === 'voice_actor' ? 'Actor de Voz' :
                  contribution.contributableType === 'studio' ? 'Estudio' :
                  contribution.contributableType === 'genre' ? 'Género' : 'Contenido'
                }
              </CardDescription>
            </div>
            <Badge variant={contribution.status === 'pending' ? 'default' : 'secondary'}>
              {contribution.status === 'pending' ? 'Pendiente' : 
               contribution.status === 'approved' ? 'Aprobada' : 'Rechazada'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Información del usuario */}
          <Card className="mb-6 bg-muted/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Contribuido por</p>
                  <p className="font-medium">{contribution.user.displayName || contribution.user.username}</p>
                </div>
                <Separator orientation="vertical" className="h-8" />
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Fecha</p>
                  <p className="font-medium">
                    {new Date(contribution.createdAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información básica */}
          <div className="space-y-6">
            {/* MEDIOS: anime, manga, novel, donghua, manhua, manhwa, fan_comic */}
            {['anime', 'manga', 'novel', 'donghua', 'manhua', 'manhwa', 'fan_comic'].includes(contribution.contributableType) && (
              <>
                <div>
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Film className="h-5 w-5" />
                    Información Básica
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <InfoField label="Título Romaji" value={data.title_romaji} />
                    <InfoField label="Título Inglés" value={data.title_english} />
                    <InfoField label="Título Español" value={data.title_spanish} />
                    <InfoField label="Título Nativo" value={data.title_native} />
                    <InfoField label="Tipo" value={data.type} />
                    <InfoField label="Fuente" value={data.source} />
                    <InfoField label="Episodios" value={data.episode_count} />
                    <InfoField label="Capítulos" value={data.chapters} />
                    <InfoField label="Volúmenes" value={data.volumes} />
                    <InfoField label="Duración" value={data.duration ? `${data.duration} min` : undefined} />
                    <InfoField label="Estado" value={data.status} />
                  </div>
                </div>

                <Separator />

                {/* Sinopsis */}
                {data.synopsis && (
                  <>
                    <div>
                      <h3 className="text-xl font-semibold mb-3">Sinopsis</h3>
                      <p className="text-muted-foreground leading-relaxed">{data.synopsis}</p>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Fechas y temporada */}
                <div>
                  <h3 className="text-xl font-semibold mb-4">Fechas y Temporada</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <InfoField label="Fecha de Inicio" value={data.start_date} />
                    <InfoField label="Fecha de Fin" value={data.end_date} />
                    <InfoField label="Temporada" value={data.season} />
                    <InfoField label="Año" value={data.season_year} />
                  </div>
                </div>
              </>
            )}

            {/* PERSONAJES */}
            {contribution.contributableType === 'character' && (
              <>
                <div>
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Información del Personaje
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <InfoField label="Nombre" value={data.name} />
                    <InfoField label="Nombre Romaji" value={data.name_romaji} />
                    <InfoField label="Nombre Nativo" value={data.name_native} />
                    <InfoField label="Género" value={data.gender} />
                    <InfoField label="Edad" value={data.age} />
                    <InfoField label="Tipo de Sangre" value={data.blood_type} />
                    <InfoField label="Fecha de Nacimiento" value={data.date_of_birth} />
                  </div>
                </div>

                {data.image_url && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-xl font-semibold mb-3">Imagen</h3>
                      <p className="text-sm text-muted-foreground break-all">{data.image_url}</p>
                    </div>
                  </>
                )}

                {data.description && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-xl font-semibold mb-3">Descripción</h3>
                      <p className="text-muted-foreground leading-relaxed">{data.description}</p>
                    </div>
                  </>
                )}
              </>
            )}

            {/* STAFF */}
            {contribution.contributableType === 'staff' && (
              <>
                <div>
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Información del Staff
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <InfoField label="Nombre" value={data.name} />
                    <InfoField label="Nombre Romaji" value={data.name_romaji} />
                    <InfoField label="Nombre Nativo" value={data.name_native} />
                    <InfoField label="Género" value={data.gender} />
                    <InfoField label="Fecha de Nacimiento" value={data.date_of_birth} />
                    <InfoField label="Lugar de Origen" value={data.hometown} />
                    <InfoField label="Ocupaciones" value={data.primary_occupations} />
                  </div>
                </div>

                {data.image_url && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-xl font-semibold mb-3">Imagen</h3>
                      <p className="text-sm text-muted-foreground break-all">{data.image_url}</p>
                    </div>
                  </>
                )}

                {data.bio && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-xl font-semibold mb-3">Biografía</h3>
                      <p className="text-muted-foreground leading-relaxed">{data.bio}</p>
                    </div>
                  </>
                )}
              </>
            )}

            {/* VOICE ACTOR */}
            {contribution.contributableType === 'voice_actor' && (
              <>
                <div>
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Información del Actor de Voz
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <InfoField label="Nombre Romaji" value={data.name_romaji} />
                    <InfoField label="Nombre Nativo" value={data.name_native} />
                    <InfoField label="Idioma" value={data.language} />
                    <InfoField label="Género" value={data.gender} />
                    <InfoField label="Fecha de Nacimiento" value={data.date_of_birth} />
                    <InfoField label="Tipo de Sangre" value={data.blood_type} />
                    <InfoField label="Lugar de Origen" value={data.hometown} />
                  </div>
                </div>

                {data.image_url && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-xl font-semibold mb-3">Imagen</h3>
                      <p className="text-sm text-muted-foreground break-all">{data.image_url}</p>
                    </div>
                  </>
                )}

                {data.bio && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-xl font-semibold mb-3">Biografía</h3>
                      <p className="text-muted-foreground leading-relaxed">{data.bio}</p>
                    </div>
                  </>
                )}
              </>
            )}

            {/* STUDIO */}
            {contribution.contributableType === 'studio' && (
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Film className="h-5 w-5" />
                  Información del Estudio
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <InfoField label="Nombre" value={data.name} />
                </div>
              </div>
            )}

            {/* GENRE */}
            {contribution.contributableType === 'genre' && (
              <>
                <div>
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Film className="h-5 w-5" />
                    Información del Género
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <InfoField label="Código" value={data.code} />
                    <InfoField label="Nombre (ES)" value={data.name_es} />
                    <InfoField label="Nombre (EN)" value={data.name_en} />
                    <InfoField label="Nombre (JA)" value={data.name_ja} />
                  </div>
                </div>

                {(data.description_es || data.description_en) && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      {data.description_es && (
                        <div>
                          <h3 className="text-xl font-semibold mb-3">Descripción (Español)</h3>
                          <p className="text-muted-foreground leading-relaxed">{data.description_es}</p>
                        </div>
                      )}
                      {data.description_en && (
                        <div>
                          <h3 className="text-xl font-semibold mb-3">Descripción (Inglés)</h3>
                          <p className="text-muted-foreground leading-relaxed">{data.description_en}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            )}

            <Separator />

            {/* Géneros (solo para medios) - ahora usa array de nombres */}
            {['anime', 'manga', 'novel', 'donghua', 'manhua', 'manhwa', 'fan_comic'].includes(contribution.contributableType) && data.genres && data.genres.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-3">Géneros</h3>
                <div className="flex flex-wrap gap-2">
                  {data.genres.map((genre: string, index: number) => (
                    <Badge key={index} variant="secondary">
                      {genre}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Estudios (solo para medios) */}
            {['anime', 'manga', 'novel', 'donghua', 'manhua', 'manhwa', 'fan_comic'].includes(contribution.contributableType) && data.studios && (
              <div>
                <h3 className="text-xl font-semibold mb-3">Estudios</h3>
                {typeof data.studios === 'string' ? (
                  <p className="font-medium">{data.studios}</p>
                ) : Array.isArray(data.studios) && data.studios.length > 0 ? (
                  <div className="space-y-2">
                    {data.studios.map((studio: any, index: number) => (
                      <div key={index} className="flex items-center gap-2">
                        <Badge variant={studio.isMain ? 'default' : 'secondary'}>
                          {typeof studio === 'string' ? studio : studio.name}
                        </Badge>
                        {studio.isMain && <span className="text-xs text-muted-foreground">(Principal)</span>}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            )}

            <Separator />

            {/* Staff (solo para medios) */}
            {['anime', 'manga', 'novel', 'donghua', 'manhua', 'manhwa', 'fan_comic'].includes(contribution.contributableType) && data.staff && data.staff.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-3">Staff</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {data.staff.map((member: any, index: number) => (
                    <div key={index} className="p-3 border rounded-md">
                      <p className="font-medium">{member.nameRomaji}</p>
                      {member.nameNative && (
                        <p className="text-sm text-muted-foreground">{member.nameNative}</p>
                      )}
                      <p className="text-sm text-primary mt-1">{member.role}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Personajes (solo para medios) */}
            {['anime', 'manga', 'novel', 'donghua', 'manhua', 'manhwa', 'fan_comic'].includes(contribution.contributableType) && data.characters && data.characters.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-3">Personajes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {data.characters.map((character: any, index: number) => (
                    <div key={index} className="p-3 border rounded-md">
                      <p className="font-medium">{character.name}</p>
                      {character.name_native && (
                        <p className="text-sm text-muted-foreground">{character.name_native}</p>
                      )}
                      {character.description && (
                        <p className="text-sm text-muted-foreground mt-1">{character.description}</p>
                      )}
                      <Badge variant={character.role === 'main' ? 'default' : 'secondary'} className="mt-2">
                        {character.role === 'main' ? 'Principal' : 'Secundario'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Autores y Artistas (manga/manhwa/manhua/novel) */}
            {['manga', 'novel', 'manhua', 'manhwa', 'fan_comic'].includes(contribution.contributableType) && (data.authors || data.artists) && (
              <div>
                <h3 className="text-xl font-semibold mb-3">Creadores</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <InfoField label="Autores" value={data.authors} />
                  <InfoField label="Artistas" value={data.artists} />
                  <InfoField label="Serialización" value={data.serialization} />
                </div>
              </div>
            )}

            {(data.authors || data.artists) && <Separator />}

            {/* Productores y Demografía (anime/donghua) */}
            {['anime', 'donghua'].includes(contribution.contributableType) && data.producers && (
              <div>
                <h3 className="text-xl font-semibold mb-3">Producción</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <InfoField label="Productores" value={data.producers} />
                  <InfoField label="Demografía" value={data.demographics} />
                </div>
              </div>
            )}

            {data.producers && <Separator />}

            {/* Enlaces Externos */}
            {['anime', 'manga', 'novel', 'donghua', 'manhua', 'manhwa', 'fan_comic'].includes(contribution.contributableType) && data.external_links && data.external_links.length > 0 && (
              <>
                <div>
                  <h3 className="text-xl font-semibold mb-3">Enlaces Externos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {data.external_links.map((link: any, index: number) => (
                      <div key={index} className="p-3 border rounded-md">
                        <p className="font-medium">{link.site_name || 'Sin nombre'}</p>
                        <a 
                          href={link.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-500 hover:underline break-all"
                        >
                          {link.url}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Enlaces de Fan Translation */}
            {['anime', 'manga', 'novel', 'donghua', 'manhua', 'manhwa', 'fan_comic'].includes(contribution.contributableType) && data.fan_translation_links && data.fan_translation_links.length > 0 && (
              <>
                <div>
                  <h3 className="text-xl font-semibold mb-3">Fan Translations</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {data.fan_translation_links.map((link: any, index: number) => (
                      <div key={index} className="p-3 border rounded-md bg-muted/30">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{link.language || 'Sin idioma'}</Badge>
                          <span className="font-medium">{link.site_name || 'Sin nombre'}</span>
                        </div>
                        <a 
                          href={link.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-500 hover:underline break-all mt-2 block"
                        >
                          {link.url}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Relaciones con otras obras */}
            {['anime', 'manga', 'novel', 'donghua', 'manhua', 'manhwa', 'fan_comic'].includes(contribution.contributableType) && data.relations && data.relations.length > 0 && (
              <>
                <div>
                  <h3 className="text-xl font-semibold mb-3">Obras Relacionadas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {data.relations.map((relation: any, index: number) => (
                      <div key={index} className="p-3 border rounded-md">
                        <p className="font-medium">{relation.title || relation.name}</p>
                        <Badge variant="secondary" className="mt-1">{relation.relation_type}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* IDs Externos (MAL, AniList) */}
            {['anime', 'manga', 'novel', 'donghua', 'manhua', 'manhwa', 'fan_comic'].includes(contribution.contributableType) && (data.mal_id || data.anilist_id) && (
              <>
                <div>
                  <h3 className="text-xl font-semibold mb-3">IDs Externos</h3>
                  <div className="flex flex-wrap gap-4">
                    {data.mal_id > 0 && (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">MAL ID:</Badge>
                        <span>{data.mal_id}</span>
                      </div>
                    )}
                    {data.anilist_id > 0 && (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">AniList ID:</Badge>
                        <span>{data.anilist_id}</span>
                      </div>
                    )}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Información Adicional */}
            {['anime', 'manga', 'novel', 'donghua', 'manhua', 'manhwa', 'fan_comic'].includes(contribution.contributableType) && (data.rating || data.is_adult || data.background || data.tags || data.themes) && (
              <>
                <div>
                  <h3 className="text-xl font-semibold mb-3">Información Adicional</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <InfoField label="Clasificación" value={data.rating} />
                    <InfoField label="Contenido Adulto" value={data.is_adult ? 'Sí' : 'No'} />
                    <InfoField label="País de Origen" value={data.country_of_origin} />
                    <InfoField label="Temas" value={data.themes} />
                    <InfoField label="Tags" value={data.tags} />
                  </div>
                  {data.background && (
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground mb-1">Información de Fondo</p>
                      <p className="font-medium">{data.background}</p>
                    </div>
                  )}
                </div>
                <Separator />
              </>
            )}

            {/* Notas del Contribuidor */}
            {data.contributor_notes && (
              <>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md border border-yellow-200 dark:border-yellow-800">
                  <h3 className="text-xl font-semibold mb-2 text-yellow-800 dark:text-yellow-200">📝 Notas del Contribuidor</h3>
                  <p className="text-yellow-700 dark:text-yellow-300">{data.contributor_notes}</p>
                </div>
                <Separator />
              </>
            )}

            {/* Imágenes y Multimedia (solo para medios) */}
            {['anime', 'manga', 'novel', 'donghua', 'manhua', 'manhwa', 'fan_comic'].includes(contribution.contributableType) && (
              <>
                <Separator />
                <div>
                  <h3 className="text-xl font-semibold mb-4">Imágenes y Multimedia</h3>
                  <div className="space-y-2">
                    <InfoField label="Cover Image URL" value={data.cover_image_url} />
                    <InfoField label="Banner Image URL" value={data.banner_image_url} />
                    <InfoField label="Trailer URL" value={data.trailer_url} />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Acciones de moderación */}
          {(contribution.status === 'pending' || contribution.status === 'in_review') && (
            <div className="mt-8 pt-6 border-t">
              <h3 className="text-xl font-semibold mb-4">Acciones de Moderación</h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="rejection-reason">Motivo de Rechazo (requerido para rechazar)</Label>
                  <Textarea
                    id="rejection-reason"
                    placeholder="Escribe el motivo si vas a rechazar esta contribución..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={4}
                    className="mt-2"
                  />
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={handleApprove}
                    disabled={isProcessing}
                    className="flex-1"
                    size="lg"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-5 w-5 mr-2" />
                    )}
                    Aprobar Contribución
                  </Button>

                  <Button
                    onClick={handleReject}
                    disabled={isProcessing}
                    variant="destructive"
                    className="flex-1"
                    size="lg"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    ) : (
                      <XCircle className="h-5 w-5 mr-2" />
                    )}
                    Rechazar Contribución
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value?: string | number }) {
  if (!value) return null;

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
