'use client';

import { useSearchParams } from 'next/navigation';
import { searchTitles } from '@/lib/db';
import type { TitleInfo } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import { Badge } from '@/components/ui/badge';
import { Eye } from 'lucide-react';

function SearchResults() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q');
    const results: TitleInfo[] = query ? searchTitles(query) : [];

    const formatNumber = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
        return num.toString();
    };

    if (!query) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">
                        Por favor, introduce un término de búsqueda.
                    </p>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Resultados para "{query}"</CardTitle>
            </CardHeader>
            <CardContent>
                {results.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {results.map((item) => (
                             <Link key={item.id} href={`/${item.type.toLowerCase().replace(/ /g, '-')}/${item.slug}`} className="block group">
                                <Card className="overflow-hidden h-full flex flex-col hover:shadow-lg transition-shadow duration-300">
                                    <div className="relative aspect-[2/3] w-full">
                                        <Image
                                            src={item.imageUrl}
                                            alt={`Cover for ${item.title}`}
                                            fill
                                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                                            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                                            data-ai-hint={item.imageHint}
                                        />
                                        <Badge variant="secondary" className="absolute top-2 left-2 capitalize bg-background/80 backdrop-blur-sm z-10">{item.type}</Badge>
                                    </div>
                                    <div className="p-3 flex flex-col flex-grow">
                                        <h4 className="font-semibold leading-tight line-clamp-2 text-sm group-hover:text-primary transition-colors">{item.title}</h4>
                                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                                            <Eye size={12} className="mr-1" />
                                            <span>{formatNumber(item.listsCount)}</span>
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground py-10">
                        No se encontraron resultados para tu búsqueda.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}


export default function SearchPage() {
    return (
        <main className="container mx-auto p-4 sm:p-8">
            <Suspense fallback={<div className="text-center p-8">Cargando resultados...</div>}>
                <SearchResults />
            </Suspense>
        </main>
    )
}
