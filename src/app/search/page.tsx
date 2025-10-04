'use client';

import { useSearchParams } from 'next/navigation';
import { searchTitles, getMediaPageData } from '@/lib/db';
import type { TitleInfo, MediaType } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense, useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye } from 'lucide-react';

const mediaTypes: MediaType[] = ['Anime', 'Manga', 'Manhua', 'Manwha', 'Novela', 'Fan Comic', 'Dougua'];

function SearchResults() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q');
    const initialResults: TitleInfo[] = query ? searchTitles(query) : [];

    const [selectedType, setSelectedType] = useState<MediaType | 'all'>('all');
    const [selectedGenre, setSelectedGenre] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

    const allGenres = useMemo(() => {
        const genreSet = new Set<string>();
        initialResults.forEach(item => {
            const mediaData = getMediaPageData(item.id, item.type);
            mediaData?.details.genres.forEach(genre => genreSet.add(genre));
        });
        return ['all', ...Array.from(genreSet).sort()];
    }, [initialResults]);

    const filteredAndSortedResults = useMemo(() => {
        let results = [...initialResults];

        if (selectedType !== 'all') {
            results = results.filter(item => item.type === selectedType);
        }

        if (selectedGenre !== 'all') {
            results = results.filter(item => {
                const mediaData = getMediaPageData(item.id, item.type);
                return mediaData?.details.genres.includes(selectedGenre);
            });
        }
        
        results.sort((a, b) => {
            const dateA = getMediaPageData(a.id, a.type)?.details.releaseDate || '0';
            const dateB = getMediaPageData(b.id, b.type)?.details.releaseDate || '0';
            
            if (sortBy === 'newest') {
                return new Date(dateB).getTime() - new Date(dateA).getTime();
            } else {
                return new Date(dateA).getTime() - new Date(dateB).getTime();
            }
        });

        return results;
    }, [initialResults, selectedType, selectedGenre, sortBy]);

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
        <>
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Filtros</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-4">
                    <div className="flex flex-wrap gap-2 items-center">
                        <span className="font-semibold text-sm">Tipo:</span>
                        <Button variant={selectedType === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setSelectedType('all')}>Todos</Button>
                        {mediaTypes.map(type => (
                             <Button key={type} variant={selectedType === type ? 'default' : 'outline'} size="sm" onClick={() => setSelectedType(type)}>{type}</Button>
                        ))}
                    </div>
                     <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">Género:</span>
                        <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Seleccionar género" />
                            </SelectTrigger>
                            <SelectContent>
                                {allGenres.map(genre => (
                                    <SelectItem key={genre} value={genre}>{genre === 'all' ? 'Todos' : genre}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center gap-2">
                         <span className="font-semibold text-sm">Ordenar por:</span>
                        <Button variant={sortBy === 'newest' ? 'default' : 'outline'} size="sm" onClick={() => setSortBy('newest')}>Más reciente</Button>
                        <Button variant={sortBy === 'oldest' ? 'default' : 'outline'} size="sm" onClick={() => setSortBy('oldest')}>Más antiguo</Button>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Resultados para "{query}"</CardTitle>
                </CardHeader>
                <CardContent>
                    {filteredAndSortedResults.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {filteredAndSortedResults.map((item) => (
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
                            No se encontraron resultados para tu búsqueda con los filtros aplicados.
                        </p>
                    )}
                </CardContent>
            </Card>
        </>
    );
}


export default function SearchPage() {
    return (
        <Suspense fallback={<div className="text-center p-8">Cargando resultados...</div>}>
            <SearchResults />
        </Suspense>
    )
}
