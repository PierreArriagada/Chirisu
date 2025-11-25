/**
 * ========================================
 * COMPONENTE: SELECTOR DE ESTUDIOS
 * ========================================
 * Permite buscar estudios existentes o crear nuevos
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Studio {
  id: number;
  name: string;
  isMain?: boolean;
}

interface StudioSelectorProps {
  selectedStudios: Studio[];
  onChange: (studios: Studio[]) => void;
}

export function StudioSelector({ selectedStudios, onChange }: StudioSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Studio[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [newStudioName, setNewStudioName] = useState('');
  const { toast } = useToast();

  // Buscar estudios
  useEffect(() => {
    const searchStudios = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(`/api/studios?search=${encodeURIComponent(searchQuery)}`);
        const data = await response.json();
        
        if (data.success) {
          setSearchResults(data.studios || []);
        }
      } catch (error) {
        console.error('Error al buscar estudios:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchStudios, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const addStudio = (studio: Studio, asMain: boolean = false) => {
    // Verificar si ya está agregado
    if (selectedStudios.find(s => s.id === studio.id)) {
      toast({
        title: 'Ya agregado',
        description: 'Este estudio ya está en la lista',
        variant: 'destructive',
      });
      return;
    }

    // Si es main studio, quitar el flag de otros
    const updatedStudios = asMain
      ? selectedStudios.map(s => ({ ...s, isMain: false }))
      : selectedStudios;

    onChange([...updatedStudios, { ...studio, isMain: asMain }]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const createNewStudio = async () => {
    if (!newStudioName.trim()) {
      toast({
        title: 'Error',
        description: 'El nombre del estudio no puede estar vacío',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/studios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newStudioName.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        addStudio(data.studio, selectedStudios.length === 0);
        setNewStudioName('');
        toast({
          title: 'Estudio agregado',
          description: data.message,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo crear el estudio',
        variant: 'destructive',
      });
    }
  };

  const removeStudio = (id: number) => {
    onChange(selectedStudios.filter(s => s.id !== id));
  };

  const toggleMainStudio = (id: number) => {
    onChange(
      selectedStudios.map(s => ({
        ...s,
        isMain: s.id === id ? !s.isMain : false,
      }))
    );
  };

  return (
    <div className="space-y-4">
      {/* Búsqueda */}
      <div className="relative">
        <Label>Buscar Estudio</Label>
        <div className="relative mt-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Resultados de búsqueda */}
        {searchResults.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-y-auto">
            {searchResults.map((studio) => (
              <div
                key={studio.id}
                className="p-3 hover:bg-accent cursor-pointer flex justify-between items-center"
              >
                <span>{studio.name}</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addStudio(studio, false)}
                  >
                    Agregar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => addStudio(studio, true)}
                  >
                    Principal
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Crear nuevo estudio */}
      <div>
        <Label>O Crear Nuevo Estudio</Label>
        <div className="flex gap-2 mt-1">
          <Input
            placeholder="Nombre del nuevo estudio"
            value={newStudioName}
            onChange={(e) => setNewStudioName(e.target.value)}
          />
          <Button onClick={createNewStudio} type="button">
            <Plus className="h-4 w-4 mr-2" />
            Crear
          </Button>
        </div>
      </div>

      {/* Estudios seleccionados */}
      {selectedStudios.length > 0 && (
        <div>
          <Label>Estudios Seleccionados</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedStudios.map((studio) => (
              <Badge
                key={studio.id}
                variant={studio.isMain ? 'default' : 'secondary'}
                className="px-3 py-1 flex items-center gap-2"
              >
                {studio.name}
                {studio.isMain && <span className="text-xs">(Principal)</span>}
                <button
                  type="button"
                  onClick={() => removeStudio(studio.id)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
                {!studio.isMain && (
                  <button
                    type="button"
                    onClick={() => toggleMainStudio(studio.id)}
                    className="ml-1 text-xs underline"
                  >
                    Hacer principal
                  </button>
                )}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
