/**
 * @fileoverview SynopsisCard - Tarjeta para mostrar la sinopsis de un título.
 * 
 * Un componente simple que recibe una cadena de texto (la descripción o sinopsis)
 * y la presenta de manera legible dentro de una tarjeta con un título "Synopsis".
 * Ayuda a separar visualmente la descripción del resto de los detalles en la página.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SynopsisCard({ description }: { description: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Synopsis</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground leading-relaxed">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
