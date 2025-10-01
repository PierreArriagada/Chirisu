import CoreInfoCard from '@/components/core-info-card';
import Recommendations from '@/components/recommendations';
import SynopsisCard from '@/components/synopsis-card';
import { mockAnimeDetails, mockTitle } from '@/lib/data';
import DetailsCard from '@/components/details-card';
import CharactersCard from '@/components/characters-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SocialsCard from '@/components/socials-card';

export default function Home() {
  const titleInfo = mockTitle;
  const animeDetails = mockAnimeDetails;

  return (
    <div className="bg-background min-h-screen">
      <main className="p-4 sm:p-2">
        <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-8">
          <div className="lg:col-span-2 flex flex-col gap-8">
            <CoreInfoCard titleInfo={titleInfo} />
            <SocialsCard />
            <SynopsisCard description={titleInfo.description} />
            <DetailsCard details={animeDetails} />
            <CharactersCard characters={animeDetails.characters} />

            <Card>
              <CardHeader>
                <CardTitle>Capítulos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground">Contenido de Capítulos próximamente.</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Estadísticas</CardTitle>
              </CardHeader>
              <CardContent>
                 <p className="text-center text-muted-foreground">Contenido de Estadísticas próximamente.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reseñas</CardTitle>
              </CardHeader>
              <CardContent>
                 <p className="text-center text-muted-foreground">Contenido de Reseñas próximamente.</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Foro</CardTitle>
              </CardHeader>
              <CardContent>
                 <p className="text-center text-muted-foreground">Contenido de Foro próximamente.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Videos & Imágenes</CardTitle>
              </CardHeader>
              <CardContent>
                 <p className="text-center text-muted-foreground">Contenido de Videos & Imágenes próximamente.</p>
              </CardContent>
            </Card>

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
