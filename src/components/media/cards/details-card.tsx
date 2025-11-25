/**
 * @fileoverview DetailsCard - Tarjeta con detalles técnicos y alternativos de un título.
 * 
 * Este componente utiliza un sistema de pestañas para organizar y mostrar información
 * detallada sobre un medio:
 * - Pestaña "Detalles": Muestra datos como tipo, número de episodios, fecha de
 *   lanzamiento, géneros, duración, etc.
 * - Pestaña "Títulos alternativos": Lista los diferentes nombres que tiene el
 *   título en varios idiomas, junto con una bandera representativa.
 * Es una forma compacta de presentar una gran cantidad de datos secundarios.
 */

import type { AnimeDetails } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DetailsCard({ details }: { details: AnimeDetails }) {

  const detailItem = (label: string, value: string | number | string[] | undefined) => {
    if (!value || (Array.isArray(value) && value.length === 0)) {
        return null;
    }
    return (
        <div className="text-sm">
        <span className="font-semibold text-foreground">{label}: </span>
        <span className="text-muted-foreground">
            {Array.isArray(value) ? value.join(', ') : value}
        </span>
        </div>
    );
  };

  return (
    <Card>
      <Tabs defaultValue="details">
        <CardHeader>
          <TabsList className="p-0 h-auto bg-transparent border-b-0">
            <TabsTrigger value="details">Detalles</TabsTrigger>
            <TabsTrigger value="alternatives">Títulos alternativos</TabsTrigger>
          </TabsList>
        </CardHeader>
        <TabsContent value="details">
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
                {detailItem('Tipo', details.type)}
                {detailItem('Episodios', details.episodes)}
                {detailItem('Estado', details.status)}
                {detailItem('Fecha', details.releaseDate)}
                {detailItem('Temporada', details.season)}
            </div>
            <div className="flex flex-col gap-2">
                {detailItem('País', details.countryOfOrigin)}
                {detailItem('Productor', details.producer)}
                {detailItem('Licencias', details.licensors)}
                {detailItem('Géneros', details.genres)}
                {detailItem('Duración', details.duration)}
            </div>
             <div className="flex flex-col gap-2">
                {detailItem('Rating', details.rating)}
                {detailItem('Promoción', details.promotion)}
            </div>
          </CardContent>
        </TabsContent>
        <TabsContent value="alternatives">
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {details.alternativeTitles.map((alt, index) => (
          <Card key={alt.lang || `${alt.title}-${index}`} className="p-4 flex items-center gap-4">
                    <span className="text-3xl">{alt.flag}</span>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">{alt.lang}</span>
                      <span className="text-sm text-muted-foreground">{alt.title}</span>
                    </div>
                  </Card>
              ))}
            </CardContent>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
