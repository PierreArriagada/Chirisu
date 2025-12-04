/**
 * ========================================
 * COMPONENTE: BARRA DE BÚSQUEDA AVANZADA
 * ========================================
 * Búsqueda en tiempo real con debounce
 * Mínimo 1 carácter, búsqueda en múltiples idiomas
 */

'use client';

import { usePathname, useRouter } from 'next/navigation';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SafeImage } from '@/components/ui/safe-image';
import Link from 'next/link';

interface SearchResult {
  id: string;
  slug: string;
  title: string;
  titleRomaji: string;
  titleEnglish: string;
  titleNative: string;
  titleSpanish: string | null;
  imageUrl: string;
  rating: number;
  type: string;
  relevance: number;
}

export default function SearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>(undefined);

  // Cerrar resultados al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Búsqueda en tiempo real con debounce
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.trim().length < 1) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}&type=all&limit=10`
      );

      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Error en búsqueda:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounce: esperar 300ms después de que el usuario deje de escribir
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, performSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleClearSearch = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (query.trim()) {
      setShowResults(false);
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const handleResultClick = () => {
    setShowResults(false);
    setQuery('');
  };

  const getMediaTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'anime': 'Anime',
      'manga': 'Manga',
      'novel': 'Novela',
      'donghua': 'Donghua',
      'manhua': 'Manhua',
      'manhwa': 'Manhwa',
      'fan_comic': 'Fan Comic',
    };
    return labels[type] || type;
  };

  const getMediaUrl = (result: SearchResult) => {
    const typeMap: Record<string, string> = {
      'anime': 'anime',
      'manga': 'manga',
      'novel': 'novela',
      'donghua': 'donghua',
      'manhua': 'manhua',
      'manhwa': 'manhwa',
      'fan_comic': 'fan-comic',
    };
    return `/${typeMap[result.type] || result.type}/${result.slug}`;
  };

  const searchVisiblePaths = [
    '/',
    '/anime',
    '/manga',
    '/manhua',
    '/manhwa',
    '/novela',
    '/donghua',
    '/fan-comic',
  ];
  const showSearch = searchVisiblePaths.includes(pathname);

  return (
    <div className={cn("w-full pb-4 px-4 sm:px-6 lg:px-8", { "hidden": !showSearch })}>
      <div ref={searchContainerRef} className="w-full max-w-2xl mx-auto relative">
        <form onSubmit={handleSubmit} className="w-full flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              value={query}
              onChange={handleInputChange}
              onFocus={() => query.length >= 1 && results.length > 0 && setShowResults(true)}
              placeholder="Buscar en todos los idiomas (romaji, inglés, nativo, español)..."
              className="pl-10 pr-10 bg-secondary/50 border-0 focus-visible:ring-2 focus-visible:ring-primary/20"
            />
            {isLoading && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
            )}
            {!isLoading && query && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button type="submit" size="default" className="hidden sm:flex" disabled={!query.trim()}>
            Buscar
          </Button>
        </form>

        {/* Resultados en tiempo real */}
        {showResults && results.length > 0 && (
          <Card className="absolute z-50 w-full mt-2 max-h-[500px] overflow-y-auto shadow-lg">
            <div className="p-2">
              <div className="text-xs text-muted-foreground px-2 py-1 mb-1">
                {results.length} resultados encontrados
              </div>
              <div className="space-y-1">
                {results.map((result) => (
                  <Link
                    key={result.id}
                    href={getMediaUrl(result)}
                    onClick={handleResultClick}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="relative w-12 h-16 flex-shrink-0 rounded overflow-hidden">
                      <SafeImage
                        src={result.imageUrl}
                        alt={result.title}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-sm line-clamp-1">
                          {result.title}
                        </h4>
                        <Badge variant="secondary" className="text-xs flex-shrink-0">
                          {getMediaTypeLabel(result.type)}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                        {result.titleRomaji && result.titleRomaji !== result.title && (
                          <p className="line-clamp-1">Romaji: {result.titleRomaji}</p>
                        )}
                        {result.titleEnglish && result.titleEnglish !== result.title && (
                          <p className="line-clamp-1">English: {result.titleEnglish}</p>
                        )}
                        {result.titleNative && (
                          <p className="line-clamp-1">原題: {result.titleNative}</p>
                        )}
                        {result.titleSpanish && result.titleSpanish !== result.title && (
                          <p className="line-clamp-1">Español: {result.titleSpanish}</p>
                        )}
                      </div>
                      {result.rating > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-yellow-500 text-xs">★</span>
                          <span className="text-xs font-medium">{result.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
              <Link
                href={`/search?q=${encodeURIComponent(query)}`}
                onClick={handleResultClick}
                className="block text-center text-sm text-primary hover:underline mt-2 py-2"
              >
                Ver todos los resultados
              </Link>
            </div>
          </Card>
        )}

        {/* Mensaje cuando no hay resultados */}
        {showResults && query.length >= 1 && results.length === 0 && !isLoading && (
          <Card className="absolute z-50 w-full mt-2 p-4 shadow-lg">
            <p className="text-sm text-muted-foreground text-center">
              No se encontraron resultados para &quot;{query}&quot;
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
