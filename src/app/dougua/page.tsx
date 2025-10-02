import TopMediaList from "@/components/top-media-list";
import { getMediaListPage } from "@/lib/db";
import { MediaType } from "@/lib/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Dougua | AniHub Info',
    description: 'Top ranking dougua.',
}

export default function DouguaPage() {
    const mediaType: MediaType = "Dougua";
    const { topAllTime, topWeekly } = getMediaListPage(mediaType);
    
    return (
        <main className="container mx-auto p-4 sm:p-8">
            <h1 className="text-4xl font-headline mb-8 text-center">Dougua</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <TopMediaList title="Top de Siempre" items={topAllTime} />
                <TopMediaList title="Top Semanal" items={topWeekly} />
            </div>
        </main>
    );
}
