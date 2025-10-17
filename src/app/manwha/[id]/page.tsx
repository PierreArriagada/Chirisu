import MediaPageClient from "@/components/media-page-client";
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Manwha ${id} | Chirisu`,
    description: 'Detalles del manwha',
  }
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MediaPageClient id={id} type="Manwha" />;
}
