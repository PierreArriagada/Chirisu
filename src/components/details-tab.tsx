/**
 * @fileoverview DetailsTab - Pestaña con información detallada de un título.
 * 
 * Este componente es una alternativa a `DetailsCard`. En lugar de usar pestañas
 * internas, presenta todos los detalles técnicos y los títulos alternativos
 * en una sola vista, organizados en columnas. Es una forma más directa de
 * mostrar la información si no se desea la interactividad de las pestañas.
 */

import type { AnimeDetails } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DetailsCard({ details }: { details: AnimeDetails }) {

  const detailItem = (label: string, value: string | number | string[]) => (
    <div className="text-sm">
      <span className="font-semibold text-foreground">{label}: </span>
      <span className="text-muted-foreground">
        {Array.isArray(value) ? value.join(', ') : value}
      </span>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalles</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
            {detailItem('Tipo', details.type)}
            {detailItem('Episodios', details.episodes)}
            {detailItem('Fecha', new Date(details.releaseDate).toLocaleDateString())}
            {detailItem('Promoción', details.promotion)}
            {detailItem('Productor', details.producer)}
        </div>
         <div className="flex flex-col gap-2">
            {detailItem('Licencias', details.licensors)}
            {detailItem('Géneros', details.genres)}
            {detailItem('Duración', details.duration)}
            {detailItem('Rating', details.rating)}
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-1">
             <h4 className="font-semibold text-foreground">Títulos alternativos:</h4>
             {details.alternativeTitles.map(alt => (
                <div key={alt.lang} className="text-sm text-muted-foreground flex items-center gap-2">
                   <span>{alt.flag}</span>
                   <span>{alt.title}</span>
                </div>
             ))}
        </div>
      </CardContent>
    </Card>
  );
}
