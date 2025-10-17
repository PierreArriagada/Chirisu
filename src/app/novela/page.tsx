/**
 * @fileoverview Página de la categoría "Novela".
 * 
 * Hub principal para todo el contenido de novelas. Utiliza el componente
 * AnimePageClient con el tipo de media "Novela" para mostrar rankings,
 * géneros y últimas adiciones.
 */

import AnimePageClient from "@/components/anime-page-client";

export default function NovelaPage() {
    return <AnimePageClient mediaType="Novela" />;
}
