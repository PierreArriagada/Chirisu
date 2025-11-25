/**
 * @fileoverview Página de detalles para un manga específico.
 */

import { MediaPageClient } from "@/components/media";
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Manga ${id} | Chirisu`,
    description: 'Detalles del manga',
  }
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MediaPageClient id={id} type="Manga" />;
}
