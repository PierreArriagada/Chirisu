'use client';

import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Link from 'next/link';

const CONTENT_TYPES = [
  { value: 'anime', label: 'Anime' },
  { value: 'manga', label: 'Manga' },
  { value: 'novels', label: 'Novelas' },
  { value: 'donghua', label: 'Donghua' },
  { value: 'manhua', label: 'Manhua' },
  { value: 'manhwa', label: 'Manhwa' },
  { value: 'fan_comic', label: 'Fan Comics' },
];

interface SearchResult {
  id: number;
  title_romaji?: string;
  title?: string;
  title_english?: string;
  status?: string;
  type?: string;
  created_at: string;
}

export default function AdvancedSearchPage() {
  const [contentType, setContentType] = useState<string>('anime');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const response = await fetch(
        `/api/admin/search?type=${contentType}&query=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error('Error al buscar:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getViewLink = (type: string, id: number) => {
    const typeMap: Record<string, string> = {
      anime: 'anime',
      manga: 'manga',
      novels: 'novela',
      donghua: 'dougua',
      manhua: 'manhua',
      manhwa: 'manwha',
      fan_comic: 'fan-comic',
    };
    return `/${typeMap[type] || type}/${id}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Búsqueda Avanzada</h1>
        <p className="text-muted-foreground mt-2">
          Busca contenido por tipo y nombre en toda la base de datos
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Parámetros de Búsqueda</CardTitle>
          <CardDescription>
            Selecciona el tipo de contenido y escribe el nombre para buscar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">Tipo de Contenido</label>
              <Select value={contentType} onValueChange={setContentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {CONTENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-[2] space-y-2">
              <label className="text-sm font-medium">Nombre o Título</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Buscar por nombre..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <Button onClick={handleSearch} disabled={loading || !searchQuery.trim()}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  <span className="ml-2 hidden sm:inline">Buscar</span>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {searched && (
        <Card>
          <CardHeader>
            <CardTitle>
              Resultados {results.length > 0 && `(${results.length})`}
            </CardTitle>
            <CardDescription>
              {results.length === 0
                ? 'No se encontraron resultados'
                : `Se encontraron ${results.length} resultado(s)`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {results.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha de Creación</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result) => (
                    <TableRow key={result.id}>
                      <TableCell className="font-mono">{result.id}</TableCell>
                      <TableCell className="font-medium">
                        {result.title_romaji || result.title || result.title_english || 'Sin título'}
                      </TableCell>
                      <TableCell>{result.type || 'N/A'}</TableCell>
                      <TableCell>
                        <span className="capitalize">{result.status || 'N/A'}</span>
                      </TableCell>
                      <TableCell>
                        {new Date(result.created_at).toLocaleDateString('es-ES')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Link href={getViewLink(contentType, result.id)}>
                            <Button variant="outline" size="sm">
                              Ver
                            </Button>
                          </Link>
                          <Link href={`/dashboard/admin/edit/${contentType}/${result.id}`}>
                            <Button variant="default" size="sm">
                              Editar
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No se encontraron resultados para &quot;{searchQuery}&quot;
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
