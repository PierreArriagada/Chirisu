/**
 * @fileoverview AllMediaCatalog - Catálogo completo de medios con filtros y paginación
 * 
 * Muestra:
 * - Primeros 6 items como "Recomendaciones del año" con estilo destacado
 * - Resto del catálogo ordenado alfabéticamente
 * - Filtros: año, temporada, tipo, género
 * - Paginación con botones numéricos
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PaginationControls } from "@/components/shared";
import { ChevronDown, ChevronUp, Star } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface MediaItem {
  id: number;
  slug: string;
  title: string;
  coverImage: string;
  type: string;
  startDate: string | null;
  averageScore: number;
  ratingsCount: number;
  popularity: number;
  season?: string;
  seasonYear?: number;
}

interface AllMediaCatalogProps {
  mediaType: 'anime' | 'manga' | 'manhwa' | 'manhua' | 'novel' | 'donghua' | 'fan_comic';
  title: string; // Ej: "Todos los Anime", "Todos los Manga"
}

export default function AllMediaCatalog({ mediaType, title }: AllMediaCatalogProps) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Filtros
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedSeason, setSelectedSeason] = useState<string>('all');
  const [selectedFormat, setSelectedFormat] = useState<string>('all');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'alpha' | 'recent' | 'popular'>('alpha');

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

  // Formatos según tipo de media
  const formatsByType: Record<string, string[]> = {
    anime: ['TV', 'Movie', 'OVA', 'ONA', 'Special', 'Music'],
    donghua: ['TV', 'Movie', 'OVA', 'ONA', 'Special'],
    manga: ['Manga', 'One-shot'],
    manhwa: ['Manhwa', 'Webtoon', 'One-shot'],
    manhua: ['Manhua', 'Web Manhua', 'One-shot'],
    novel: ['Light_Novel', 'Web_Novel', 'Novel'],
    fan_comic: ['Fan Comic', 'Doujinshi']
  };

  const formats = formatsByType[mediaType] || [];

  const seasons = ['WINTER', 'SPRING', 'SUMMER', 'FALL'];
  const seasonLabels: Record<string, string> = {
    WINTER: 'Invierno',
    SPRING: 'Primavera',
    SUMMER: 'Verano',
    FALL: 'Otoño'
  };

  // Géneros populares por tipo
  const genresByType: Record<string, string[]> = {
    anime: ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Romance', 'Sci-Fi', 'Slice of Life', 'Supernatural', 'Mystery'],
    manga: ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Romance', 'Seinen', 'Shounen', 'Shoujo', 'Josei'],
    manhwa: ['Action', 'Drama', 'Fantasy', 'Romance', 'Supernatural'],
    manhua: ['Action', 'Adventure', 'Fantasy', 'Martial Arts'],
    novel: ['Fantasy', 'Romance', 'Drama', 'Sci-Fi', 'Mystery'],
    donghua: ['Action', 'Adventure', 'Fantasy', 'Martial Arts', 'Romance'],
    fan_comic: ['Comedy', 'Romance', 'Drama', 'Fantasy']
  };

  const genres = genresByType[mediaType] || [];

  // Cargar datos
  useEffect(() => {
    fetchCatalog();
  }, [page, selectedYear, selectedSeason, selectedFormat, selectedGenre, sortBy]);

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: mediaType,
        page: page.toString(),
        limit: '24',
        sort: sortBy
      });

      if (selectedYear && selectedYear !== 'all') params.append('year', selectedYear);
      if (selectedSeason && selectedSeason !== 'all') params.append('season', selectedSeason);
      if (selectedFormat && selectedFormat !== 'all') params.append('format', selectedFormat);
      if (selectedGenre && selectedGenre !== 'all') params.append('genre', selectedGenre);

      const response = await fetch(`/api/catalog?${params.toString()}`);
      const data = await response.json();

      if (data.items) {
        setItems(data.items);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Error cargando catálogo:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setSelectedYear('all');
    setSelectedSeason('all');
    setSelectedFormat('all');
    setSelectedGenre('all');
    setSortBy('alpha');
    setPage(1);
  };

  // Primeros 6 items son "recomendaciones del año"
  const recommendedItems = items.slice(0, 6);
  const catalogItems = items.slice(6);

  const showSeasonFilter = mediaType === 'anime' || mediaType === 'donghua';

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {total.toLocaleString()} títulos disponibles
          </p>
        </div>
        
        <Button
          variant="outline"
          onClick={() => setExpanded(!expanded)}
          className="gap-2"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Ocultar catálogo
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              Ver más
            </>
          )}
        </Button>
      </div>

      {/* Recomendaciones del año (primeros 6) */}
      {!expanded && recommendedItems.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            <h3 className="text-lg font-semibold">Recomendaciones del {currentYear}</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {recommendedItems.map((item) => (
              <MediaCard key={item.id} item={item} isRecommended mediaType={mediaType} />
            ))}
          </div>
        </div>
      )}

      {/* Catálogo completo */}
      {expanded && (
        <div>
          {/* Filtros */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {/* Filtro por año */}
                <Select value={selectedYear} onValueChange={(v) => setSelectedYear(v === 'all' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Año" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los años</SelectItem>
                    {years.map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Filtro por temporada (solo anime/donghua) */}
                {showSeasonFilter && (
                  <Select value={selectedSeason} onValueChange={(v) => setSelectedSeason(v === 'all' ? '' : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Temporada" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {seasons.map(season => (
                        <SelectItem key={season} value={season}>
                          {seasonLabels[season]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Filtro por formato */}
                <Select value={selectedFormat} onValueChange={(v) => setSelectedFormat(v === 'all' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Formato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {formats.map(format => (
                      <SelectItem key={format} value={format}>
                        {format}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Filtro por género */}
                <Select value={selectedGenre} onValueChange={(v) => setSelectedGenre(v === 'all' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Género" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {genres.map(genre => (
                      <SelectItem key={genre} value={genre}>
                        {genre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Ordenar por */}
                <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ordenar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alpha">Alfabético</SelectItem>
                    <SelectItem value="recent">Más recientes</SelectItem>
                    <SelectItem value="popular">Más populares</SelectItem>
                  </SelectContent>
                </Select>

                {/* Botón resetear */}
                <Button variant="outline" onClick={resetFilters} className="w-full">
                  Limpiar filtros
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Grid de items */}
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              Cargando...
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No se encontraron resultados con los filtros seleccionados
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {items.map((item, index) => (
                  <MediaCard 
                    key={item.id} 
                    item={item} 
                    isRecommended={index < 6}
                    mediaType={mediaType}
                  />
                ))}
              </div>

              {/* Paginación */}
              <PaginationControls
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      )}
    </section>
  );
}

// Componente de card individual
function MediaCard({ item, isRecommended, mediaType }: { 
  item: MediaItem; 
  isRecommended: boolean;
  mediaType: string;
}) {
  // Mapear mediaType a la ruta correcta
  const mediaTypeRouteMap: Record<string, string> = {
    'anime': 'anime',
    'manga': 'manga',
    'manhwa': 'manhwa',
    'manhua': 'manhua',
    'novel': 'novela',
    'donghua': 'donghua',
    'fan_comic': 'fan-comic'
  };
  
  const route = mediaTypeRouteMap[mediaType] || 'anime';

  return (
    <Link href={`/${route}/${item.slug}`}>
      <Card className={`group overflow-hidden transition-all hover:scale-105 ${
        isRecommended ? 'ring-2 ring-yellow-500/50 bg-gradient-to-b from-yellow-500/10 to-transparent' : ''
      }`}>
        <div className="relative aspect-[2/3]">
          <Image
            src={item.coverImage || '/placeholder-cover.jpg'}
            alt={item.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 16vw"
          />
          
          {isRecommended && (
            <Badge className="absolute top-2 right-2 bg-yellow-500 text-black">
              <Star className="h-3 w-3 mr-1 fill-current" />
              Recomendación
            </Badge>
          )}
          
          {item.averageScore > 0 && (
            <div className="absolute bottom-2 left-2 bg-black/75 rounded px-2 py-1 text-xs font-bold">
              ⭐ {item.averageScore.toFixed(1)}
            </div>
          )}
        </div>
        
        <CardContent className="p-3">
          <p className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
            {item.title}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {item.type} {item.startDate && `• ${new Date(item.startDate).getFullYear()}`}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
