/**
 * @fileoverview Pagina de la categoria "Novela".
 * 
 * Hub principal para todo el contenido de novelas. Utiliza el componente
 * AnimePageClient con el tipo de media "Novela" para mostrar rankings,
 * generos y ultimas adiciones.
 */

import { AnimePageClient } from "@/components/media";
import { AllMediaCatalog } from '@/components/catalog';

export default function NovelaPage() {
    return (
        <div className="my-8">
            <AnimePageClient mediaType="Novela" />
            <AllMediaCatalog mediaType="novel" title="Todas las Novelas" />
        </div>
    );
}
