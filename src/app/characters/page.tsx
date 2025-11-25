'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { FavoriteButton } from '@/components/shared';

interface Character {
  id: number;
  name: string;
  name_romaji: string;
  name_native: string;
  image_url: string;
  slug: string;
  favorites_count: number;
  gender: string;
  age: number;
  description: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function CharactersPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 24,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [search, setSearch] = useState('');
  const [gender, setGender] = useState('all');
  const [sortBy, setSortBy] = useState('favorites');

  const fetchCharacters = async (page: number = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '24',
        sortBy,
        order: 'DESC'
      });

      if (search) params.append('search', search);
      if (gender && gender !== 'all') params.append('gender', gender);

      const response = await fetch(`/api/characters/all?${params}`);
      const data = await response.json();

      setCharacters(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching characters:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharacters(1);
  }, [search, gender, sortBy]);

  const handlePageChange = (newPage: number) => {
    fetchCharacters(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Personajes</h1>
        <p className="text-muted-foreground">
          Explora todos los personajes de anime, manga y novelas
        </p>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Buscar personajes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtro por Género */}
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los géneros" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los géneros</SelectItem>
                <SelectItem value="male">Masculino</SelectItem>
                <SelectItem value="female">Femenino</SelectItem>
              </SelectContent>
            </Select>

            {/* Ordenar por */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="favorites">Más Favoritos</SelectItem>
                <SelectItem value="name">Nombre (A-Z)</SelectItem>
                <SelectItem value="created">Más Recientes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contador de resultados */}
      {!loading && (
        <div className="mb-4 text-sm text-muted-foreground">
          Mostrando {characters.length} de {pagination.total} personajes
        </div>
      )}

      {/* Grid de personajes */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 24 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="aspect-[2/3] bg-muted rounded-t-lg" />
              <CardContent className="p-3">
                <div className="h-4 bg-muted rounded mb-2" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : characters.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No se encontraron personajes</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {characters.map((character) => (
            <Card key={character.id} className="group hover:shadow-lg transition-all duration-200 relative">
              {character.image_url && (
                <Link href={`/character/${character.slug}`}>
                  <div className="relative aspect-[2/3] overflow-hidden rounded-t-lg">
                    <Image
                      src={character.image_url}
                      alt={character.name_romaji || character.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                </Link>
              )}
              <div className="absolute top-2 right-2 z-10 bg-background/80 backdrop-blur-sm rounded-full">
                <FavoriteButton itemType="character" itemId={character.id} size="sm" />
              </div>
              <CardContent className="p-3">
                <Link href={`/character/${character.slug}`}>
                  <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                    {character.name_romaji || character.name}
                  </h3>
                </Link>
                <div className="flex items-center gap-2 mt-2">
                  {character.gender && (
                    <Badge variant="secondary" className="text-xs capitalize">
                      {character.gender === 'male' ? '♂' : '♀'}
                    </Badge>
                  )}
                  {character.favorites_count > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Heart className="w-3 h-3" />
                      {character.favorites_count}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Paginación */}
      {!loading && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={!pagination.hasPrev}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Anterior
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageNum;
              if (pagination.totalPages <= 5) {
                pageNum = i + 1;
              } else if (pagination.page <= 3) {
                pageNum = i + 1;
              } else if (pagination.page >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + i;
              } else {
                pageNum = pagination.page - 2 + i;
              }

              return (
                <Button
                  key={pageNum}
                  variant={pagination.page === pageNum ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={!pagination.hasNext}
          >
            Siguiente
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
