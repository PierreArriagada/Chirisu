'use client';

import { useState, useEffect, useCallback } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export type SelectedStudio = {
  id: number;
  name: string;
  name_native?: string;
};

type StudioSearchProps = {
  onSelect: (studio: SelectedStudio | null) => void;
  selectedStudio: SelectedStudio | null;
  placeholder?: string;
};

export function StudioSearch({ onSelect, selectedStudio, placeholder = "Buscar estudio..." }: StudioSearchProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<SelectedStudio[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewStudioDialog, setShowNewStudioDialog] = useState(false);
  const [newStudioName, setNewStudioName] = useState('');
  const [newStudioNameNative, setNewStudioNameNative] = useState('');

  const searchStudios = useCallback(async (query: string) => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/search/studios?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      }
    } catch (error) {
      console.error('Error searching studios:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search) {
        searchStudios(search);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search, searchStudios]);

  const handleCreateNewStudio = () => {
    if (newStudioName.trim()) {
      const newStudio: SelectedStudio = {
        id: -Date.now(),
        name: newStudioName.trim(),
        name_native: newStudioNameNative.trim() || undefined,
      };
      onSelect(newStudio);
      setShowNewStudioDialog(false);
      setNewStudioName('');
      setNewStudioNameNative('');
      setOpen(false);
    }
  };

  return (
    <>
      <div className="flex gap-2 items-start">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="flex-1 justify-between"
            >
              {selectedStudio ? (
                <span className="truncate">
                  {selectedStudio.name}
                  {selectedStudio.name_native && (
                    <span className="text-muted-foreground ml-2">({selectedStudio.name_native})</span>
                  )}
                </span>
              ) : (
                placeholder
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0">
            <Command shouldFilter={false}>
              <CommandInput 
                placeholder="Buscar por nombre..." 
                value={search}
                onValueChange={setSearch}
              />
              <CommandList>
                <CommandEmpty>
                  {loading ? (
                    <div className="py-6 text-center text-sm">Buscando...</div>
                  ) : search.length < 2 ? (
                    <div className="py-6 text-center text-sm">Escribe al menos 2 caracteres</div>
                  ) : (
                    <div className="py-6 text-center">
                      <p className="text-sm text-muted-foreground mb-3">No se encontró estudio</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setNewStudioName(search);
                          setShowNewStudioDialog(true);
                          setOpen(false);
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Crear "{search}"
                      </Button>
                    </div>
                  )}
                </CommandEmpty>
                <CommandGroup>
                  {results.map((studio) => (
                    <CommandItem
                      key={studio.id}
                      value={studio.id.toString()}
                      onSelect={() => {
                        onSelect(studio);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedStudio?.id === studio.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex-1">
                        <div>{studio.name}</div>
                        {studio.name_native && (
                          <div className="text-xs text-muted-foreground">{studio.name_native}</div>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {selectedStudio && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onSelect(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setShowNewStudioDialog(true)}
          title="Crear nuevo estudio"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={showNewStudioDialog} onOpenChange={setShowNewStudioDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nuevo Estudio</DialogTitle>
            <DialogDescription>
              Agrega un nuevo estudio que no está en la base de datos
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-studio-name">Nombre *</Label>
              <Input
                id="new-studio-name"
                value={newStudioName}
                onChange={(e) => setNewStudioName(e.target.value)}
                placeholder="Nombre del estudio"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-studio-name-native">Nombre Nativo</Label>
              <Input
                id="new-studio-name-native"
                value={newStudioNameNative}
                onChange={(e) => setNewStudioNameNative(e.target.value)}
                placeholder="Nombre en idioma original"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewStudioDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateNewStudio} disabled={!newStudioName.trim()}>
              Crear Estudio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
