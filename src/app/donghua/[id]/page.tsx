/**
 * @fileoverview Página de detalles para un donghua específico.
 * 
 * Esta es una página que muestra información detallada sobre un donghua,
 * identificado por su ID en la URL.
 * Usa el componente cliente MediaPageClient que carga datos desde la API.
 */

import { MediaPageClient } from "@/components/media";
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Donghua ${id} | Chirisu`,
    description: 'Detalles del donghua',
  }
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MediaPageClient id={id} type="Donghua" />;
}
