/**
 * @fileoverview Página de detalles para un anime específico.
 * 
 * Esta es una página que muestra información detallada sobre un anime,
 * identificado por su ID en la URL.
 * Ahora usa el componente cliente MediaPageClient que carga datos desde la API.
 */

import { MediaPageClient } from '@/components/media';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  // TODO: Podríamos hacer fetch aquí para metadata más precisa
  return {
    title: `Anime ${id} | Chirisu`,
    description: 'Detalles del anime',
  }
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MediaPageClient id={id} type="Anime" />;
}
