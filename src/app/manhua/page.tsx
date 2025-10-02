import TopMediaList from "@/components/top-media-list";
import { getMediaListPage } from "@/lib/db";
import { MediaType } from "@/lib/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Manhua | Chirisu',
    description: 'Top ranking manhua.',
}

export default function ManhuaPage() {
    const mediaType: MediaType = "Manhua";
    const { topAllTime, topWeekly } = getMediaListPage(mediaType);
    
    return (
        <main className="container mx-auto p-4 sm:p-8">
            <h1 className="text-4xl font-headline mb-8 text-center">Manhua</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <TopMediaList title="Top de Siempre" items={topAllTime} />
                <TopMediaList title="Top Semanal" items={topWeekly} />
            </div>
        </main>
    );
}
