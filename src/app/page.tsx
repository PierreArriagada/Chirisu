import CoreInfoCard from '@/components/core-info-card';
import Recommendations from '@/components/recommendations';
import SynopsisCard from '@/components/synopsis-card';
import { mockAnimeDetails, mockTitle } from '@/lib/data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DetailsTab from '@/components/details-tab';
import CharactersTab from '@/components/characters-tab';

export default function Home() {
  const titleInfo = mockTitle;
  const animeDetails = mockAnimeDetails;

  return (
    <div className="bg-background min-h-screen">
      <main className="p-4 sm:p-2">
        <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-8">
          <div className="lg:col-span-2 flex flex-col gap-8">
            <CoreInfoCard titleInfo={titleInfo} />
            <SynopsisCard description={titleInfo.description} />
            
            <Tabs defaultValue="details" className="w-full">
              <div className="overflow-x-auto">
                <TabsList className="flex w-max">
                  <TabsTrigger value="details">Detalles</TabsTrigger>
                  <TabsTrigger value="characters">Personajes & Actores</TabsTrigger>
                  <TabsTrigger value="episodes">Capítulos</TabsTrigger>
                  <TabsTrigger value="stats">Estadísticas</TabsTrigger>
                  <TabsTrigger value="reviews">Reseñas</TabsTrigger>
                  <TabsTrigger value="forum">Foro</TabsTrigger>
                  <TabsTrigger value="media">Videos & Imágenes</TabsTrigger>
                  <TabsTrigger value="related">Relacionados</TabsTrigger>
                  <TabsTrigger value="comments">Comentarios</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="details">
                <DetailsTab details={animeDetails} />
              </TabsContent>
              <TabsContent value="characters">
                <CharactersTab characters={animeDetails.characters} />
              </TabsContent>
              <TabsContent value="episodes">
                <p className="p-4 text-center text-muted-foreground">Contenido de Capítulos próximamente.</p>
              </TabsContent>
              <TabsContent value="stats">
                 <p className="p-4 text-center text-muted-foreground">Contenido de Estadísticas próximamente.</p>
              </TabsContent>
              <TabsContent value="reviews">
                 <p className="p-4 text-center text-muted-foreground">Contenido de Reseñas próximamente.</p>
              </TabsContent>
               <TabsContent value="forum">
                 <p className="p-4 text-center text-muted-foreground">Contenido de Foro próximamente.</p>
              </TabsContent>
               <TabsContent value="media">
                 <p className="p-4 text-center text-muted-foreground">Contenido de Videos & Imágenes próximamente.</p>
              </TabsContent>
               <TabsContent value="related">
                 <p className="p-4 text-center text-muted-foreground">Contenido de Relacionados próximamente.</p>
              </TabsContent>
              <TabsContent value="comments">
                 <p className="p-4 text-center text-muted-foreground">Contenido de Comentarios próximamente.</p>
              </TabsContent>
            </Tabs>

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
