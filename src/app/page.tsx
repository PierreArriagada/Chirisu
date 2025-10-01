import CoreInfoCard from '@/components/core-info-card';
import Recommendations from '@/components/recommendations';
import SynopsisCard from '@/components/synopsis-card';
import { mockAnimeDetails, mockTitle, mockOfficialLinks } from '@/lib/data';
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

export default function Home() {
  const titleInfo = mockTitle;
  const animeDetails = mockAnimeDetails;
  const officialLinks = mockOfficialLinks;

  return (
    <div className="bg-background min-h-screen">
      <main className="p-4 sm:p-2">
        <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-8">
          <div className="lg:col-span-2 flex flex-col gap-8">
            <CoreInfoCard titleInfo={titleInfo} />
            <SocialsCard />
            <SynopsisCard description={titleInfo.description} />
            <DetailsCard details={animeDetails} />
            <OfficialLinksCard links={officialLinks} />

            <Accordion type="multiple" className="w-full space-y-8">
              <AccordionItem value="characters" className="border-0">
                <Card>
                  <AccordionTrigger className="p-6 hover:no-underline">
                      <CardTitle>Personajes & Actores</CardTitle>
                  </AccordionTrigger>
                  <AccordionContent>
                    <CharactersCard characters={animeDetails.characters} />
                  </AccordionContent>
                </Card>
              </AccordionItem>
              
              <AccordionItem value="chapters" className="border-0">
                <Card>
                  <AccordionTrigger className="p-6 hover:no-underline">
                    <CardTitle>Capítulos</CardTitle>
                  </AccordionTrigger>
                  <AccordionContent>
                    <CardContent>
                      <p className="text-center text-muted-foreground">Contenido de Capítulos próximamente.</p>
                    </CardContent>
                  </AccordionContent>
                </Card>
              </AccordionItem>

              <AccordionItem value="stats" className="border-0">
                <Card>
                  <AccordionTrigger className="p-6 hover:no-underline">
                    <CardTitle>Estadísticas</CardTitle>
                  </AccordionTrigger>
                  <AccordionContent>
                    <CardContent>
                      <p className="text-center text-muted-foreground">Contenido de Estadísticas próximamente.</p>
                    </CardContent>
                  </AccordionContent>
                </Card>
              </AccordionItem>

              <AccordionItem value="reviews" className="border-0">
                <Card>
                   <AccordionTrigger className="p-6 hover:no-underline">
                    <CardTitle>Reseñas</CardTitle>
                  </AccordionTrigger>
                  <AccordionContent>
                    <CardContent>
                      <p className="text-center text-muted-foreground">Contenido de Reseñas próximamente.</p>
                    </CardContent>
                  </AccordionContent>
                </Card>
              </AccordionItem>

              <AccordionItem value="forum" className="border-0">
                <Card>
                  <AccordionTrigger className="p-6 hover:no-underline">
                    <CardTitle>Foro</CardTitle>
                  </AccordionTrigger>
                  <AccordionContent>
                    <CardContent>
                      <p className="text-center text-muted-foreground">Contenido de Foro próximamente.</p>
                    </CardContent>
                  </AccordionContent>
                </Card>
              </AccordionItem>
              
              <AccordionItem value="media" className="border-0">
                <Card>
                  <AccordionTrigger className="w-full p-0">
                     <Tabs defaultValue="trailers" className="w-full">
                        <CardHeader>
                          <TabsList className="p-0 h-auto bg-transparent border-b-0">
                            <TabsTrigger value="trailers">Trailers</TabsTrigger>
                            <TabsTrigger value="videos">Videos</TabsTrigger>
                            <TabsTrigger value="images">Imágenes</TabsTrigger>
                          </TabsList>
                        </CardHeader>
                      </Tabs>
                  </AccordionTrigger>
                  <AccordionContent>
                     <Tabs defaultValue="trailers" className="w-full">
                       <TabsContent value="trailers">
                        <CardContent>
                          <p className="text-center text-muted-foreground">Contenido de Trailers próximamente.</p>
                        </CardContent>
                      </TabsContent>
                      <TabsContent value="videos">
                        <CardContent>
                          <p className="text-center text-muted-foreground">Contenido de Videos próximamente.</p>
                        </CardContent>
                      </TabsContent>
                      <TabsContent value="images">
                        <CardContent>
                          <p className="text-center text-muted-foreground">Contenido de Imágenes próximamente.</p>
                        </CardContent>
                      </TabsContent>
                    </Tabs>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            </Accordion>


            <Card>
              <CardHeader>
                <CardTitle>Relacionados</CardTitle>
              </CardHeader>
              <CardContent>
                 <p className="text-center text-muted-foreground">Contenido de Relacionados próximamente.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Comentarios</CardTitle>
              </CardHeader>
              <CardContent>
                 <p className="text-center text-muted-foreground">Contenido de Comentarios próximamente.</p>
              </CardContent>
            </Card>

            <div className="lg:hidden">
              <h2 className="text-2xl font-headline mb-4">Recomendaciones</h2>
              <Recommendations titleInfo={titleInfo} />
            </div>
          </div>

          <div className="hidden lg:flex flex-col gap-4 sticky top-8 h-max">
            <h2 className="text-2xl font-headline">Recomendaciones</h2>
            <Recommendations titleInfo={titleInfo} />
          </div>
        </div>
      </main>
    </div>
  );
}
