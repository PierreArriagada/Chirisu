/**
 * @fileoverview Plantilla principal para la página de detalles de un medio.
 * 
 * Este es un componente de servidor que ensambla la página de detalles completa para
 * un anime, manga, etc. Recibe todos los datos necesarios (`mediaData`) y los distribuye
 * a componentes hijos más pequeños y especializados.
 * 
 * Orquesta la renderización de:
 * - `CoreInfoCard`: Información principal y portada.
 * - `SocialsCard`: Enlaces a redes sociales.
 * - `SynopsisCard`: Descripción del título.
 * - `DetailsCard`: Detalles técnicos.
 * - `OfficialLinksCard`: Enlaces oficiales.
 * - Y varias secciones en acordeones como Personajes, Episodios, Estadísticas, etc.
 * También integra `DynamicTheme` para el tema de color basado en la portada.
 */

import CoreInfoCard from '@/components/core-info-card';
import Recommendations from '@/components/recommendations';
import SynopsisCard from '@/components/synopsis-card';
import DetailsCard from '@/components/details-card';
import CharactersCard from '@/components/characters-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SocialsCard from '@/components/socials-card';
import OfficialLinksCard from '@/components/official-links-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import StatsCard from '@/components/stats-card';
import ReviewsCard from '@/components/reviews-card';
import RelatedCard from '@/components/related-card';
import EpisodesCard from '@/components/episodes-card';
import Image from 'next/image';
import { MessageSquare, UserCircle } from 'lucide-react';
import MediaGallery from '@/components/media-gallery';
import { getMediaPageData } from '@/lib/db';
import { MediaType } from '@/lib/types';
import DynamicTheme from '@/components/dynamic-theme';

type MediaPageProps = {
  mediaData: NonNullable<ReturnType<typeof getMediaPageData>>
}

export default function MediaPage({ mediaData }: MediaPageProps) {
  
  const { titleInfo, details, officialLinks, characters, episodes, reviews, related, galleryImages } = mediaData;
  const showEpisodes = titleInfo.type === 'Anime' || titleInfo.type === 'Dougua';

  return (
    <div className="bg-background min-h-screen">
      <DynamicTheme imageUrl={titleInfo.imageUrl} />
      <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-8">
        <div className="lg:col-span-2 flex flex-col gap-8">
          <CoreInfoCard titleInfo={titleInfo} />
          <SocialsCard titleInfo={titleInfo} />
          <SynopsisCard description={titleInfo.description} />
          <DetailsCard details={details} />
          <OfficialLinksCard links={officialLinks} />

          <Accordion type="multiple" className="w-full space-y-8" defaultValue={['characters', 'episodes', 'stats', 'reviews', 'media', 'related', 'forum']}>
            {characters && characters.length > 0 && (
              <AccordionItem value="characters" className="border-0">
                <Card>
                  <AccordionTrigger className="p-6 hover:no-underline">
                      <CardTitle>Personajes & Actores</CardTitle>
                  </AccordionTrigger>
                  <AccordionContent>
                    <CharactersCard characters={characters} />
                  </AccordionContent>
                </Card>
              </AccordionItem>
            )}
            
            {showEpisodes && episodes && episodes.length > 0 && (
              <AccordionItem value="episodes" className="border-0">
                <Card>
                  <AccordionTrigger className="p-6 hover:no-underline">
                    <CardTitle>Capítulos</CardTitle>
                  </AccordionTrigger>
                  <AccordionContent>
                    <EpisodesCard episodes={episodes} />
                  </AccordionContent>
                </Card>
              </AccordionItem>
            )}

            {details.stats && (
              <AccordionItem value="stats" className="border-0">
                <Card>
                  <AccordionTrigger className="p-6 hover:no-underline">
                    <CardTitle>Estadísticas</CardTitle>
                  </AccordionTrigger>
                  <AccordionContent>
                    <StatsCard stats={details.stats} />
                  </AccordionContent>
                </Card>
              </AccordionItem>
            )}

            {reviews && reviews.length > 0 && (
              <AccordionItem value="reviews" className="border-0">
                <Card>
                   <AccordionTrigger className="p-6 hover:no-underline">
                    <CardTitle>Reseñas</CardTitle>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ReviewsCard reviews={reviews} />
                  </AccordionContent>
                </Card>
              </AccordionItem>
            )}
            
            <AccordionItem value="media" className="border-0">
              <Card>
                 <CardHeader className="flex flex-row items-center justify-between">
                  <Tabs defaultValue="trailers" className="w-full">
                    <TabsList className="p-0 h-auto bg-transparent border-b-0 justify-start">
                      <TabsTrigger value="trailers">Trailers</TabsTrigger>
                      <TabsTrigger value="videos">Videos</TabsTrigger>
                      <TabsTrigger value="images">Imágenes</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <AccordionTrigger className="p-0 w-auto hover:no-underline ml-4" />
                </CardHeader>
                <AccordionContent>
                   <Tabs defaultValue="trailers" className="w-full">
                    <TabsContent value="trailers">
                      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="relative aspect-video">
                              <Image src="https://picsum.photos/seed/trailer1/320/180" alt="Trailer 1" fill className="rounded-lg object-cover" data-ai-hint="anime trailer" />
                          </div>
                           <div className="relative aspect-video">
                              <Image src="https://picsum.photos/seed/trailer2/320/180" alt="Trailer 2" fill className="rounded-lg object-cover" data-ai-hint="anime trailer" />
                          </div>
                      </CardContent>
                    </TabsContent>
                    <TabsContent value="videos">
                       <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="relative aspect-video">
                              <Image src="https://picsum.photos/seed/video1/320/180" alt="Video 1" fill className="rounded-lg object-cover" data-ai-hint="promotional video" />
                               <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-lg">
                                  <p className="text-white font-semibold">Opening 1</p>
                              </div>
                          </div>
                           <div className="relative aspect-video">
                              <Image src="https://picsum.photos/seed/video2/320/180" alt="Video 2" fill className="rounded-lg object-cover" data-ai-hint="promotional video" />
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-lg">
                                  <p className="text-white font-semibold">Ending 1</p>
                              </div>
                          </div>
                      </CardContent>
                    </TabsContent>
                    <TabsContent value="images">
                      <CardContent>
                        <MediaGallery images={galleryImages} />
                      </CardContent>
                    </TabsContent>
                  </Tabs>
                </AccordionContent>
              </Card>
            </AccordionItem>

            <AccordionItem value="forum" className="border-0">
              <Card>
                <AccordionTrigger className="p-6 hover:no-underline">
                  <CardTitle>Foro</CardTitle>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="space-y-4">
                    <div className="border p-4 rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <UserCircle size={24} className="text-muted-foreground" />
                        <h4 className="font-semibold">¿Qué tan fiel es la adaptación?</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">Iniciado por @MangaReader</p>
                      <div className="flex items-center text-xs text-muted-foreground gap-2">
                        <MessageSquare size={14} /> 45 respuestas
                      </div>
                    </div>
                    <div className="border p-4 rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                         <UserCircle size={24} className="text-muted-foreground" />
                        <h4 className="font-semibold">Mejor momento del último capítulo</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">Iniciado por @AnimeWatcher</p>
                       <div className="flex items-center text-xs text-muted-foreground gap-2">
                        <MessageSquare size={14} /> 102 respuestas
                      </div>
                    </div>
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>
          </Accordion>


          {related && related.length > 0 && <RelatedCard relatedTitles={related} />}
          
          <div className="lg:hidden">
            <h2 className="text-2xl font-headline mb-4">Recomendaciones</h2>
            <Recommendations titleInfo={titleInfo} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Comentarios</CardTitle>
            </CardHeader>
            <CardContent>
               <p className="text-center text-muted-foreground">Contenido de Comentarios próximamente.</p>
            </CardContent>
          </Card>

        </div>

        <div className="hidden lg:flex flex-col gap-4 sticky top-8 h-max">
          <h2 className="text-2xl font-headline">Recomendaciones</h2>
          <Recommendations titleInfo={titleInfo} />
        </div>
      </div>
    </div>
  );
}
