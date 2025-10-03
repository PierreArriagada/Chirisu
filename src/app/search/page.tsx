'use client';

import { useSearchParams } from 'next/navigation';
import { searchTitles } from '@/lib/db';
import { TitleInfo } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';

function SearchResults() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q');
    const results: TitleInfo[] = query ? searchTitles(query) : [];

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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {results.map((item) => (
                             <Link key={item.id} href={`/${item.type.toLowerCase().replace(/ /g, '-')}/${item.slug}`} className="block group">
                                <Card className="flex items-center gap-4 p-3 overflow-hidden transition-all duration-200 group-hover:bg-accent/50 group-hover:shadow-md">
                                    <div className="flex-shrink-0">
                                        <Image
                                            src={item.imageUrl}
                                            alt={`Cover for ${item.title}`}
                                            width={50}
                                            height={75}
                                            className="rounded-md object-cover aspect-[2/3]"
                                            data-ai-hint={item.imageHint}
                                        />
                                    </div>
                                    <div className="flex flex-col justify-center gap-1 overflow-hidden">
                                    <h4 className="font-semibold leading-tight truncate group-hover:text-accent-foreground">{item.title}</h4>
                                    <p className="text-sm text-muted-foreground">{item.type}</p>
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground">
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
            <Suspense fallback={<p>Cargando...</p>}>
                <SearchResults />
            </Suspense>
        </main>
    )
}
