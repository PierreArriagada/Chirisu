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

export type SelectedStaff = {
  id: number;
  name: string;
  name_native?: string;
  image_url?: string;
};

type StaffSearchProps = {
  onSelect: (staff: SelectedStaff | null) => void;
  selectedStaff: SelectedStaff | null;
  placeholder?: string;
};

export function StaffSearch({ onSelect, selectedStaff, placeholder = "Buscar staff..." }: StaffSearchProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<SelectedStaff[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewStaffDialog, setShowNewStaffDialog] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffNameNative, setNewStaffNameNative] = useState('');

  const searchStaff = useCallback(async (query: string) => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/search/staff?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      }
    } catch (error) {
      console.error('Error searching staff:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search) {
        searchStaff(search);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search, searchStaff]);

  const handleCreateNewStaff = () => {
    if (newStaffName.trim()) {
      // Creamos un staff temporal con ID negativo (se procesará en el backend)
      const newStaff: SelectedStaff = {
        id: -Date.now(), // ID temporal negativo
        name: newStaffName.trim(),
        name_native: newStaffNameNative.trim() || undefined,
      };
      onSelect(newStaff);
      setShowNewStaffDialog(false);
      setNewStaffName('');
      setNewStaffNameNative('');
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
              {selectedStaff ? (
                <span className="truncate">
                  {selectedStaff.name}
                  {selectedStaff.name_native && (
                    <span className="text-muted-foreground ml-2">({selectedStaff.name_native})</span>
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
                      <p className="text-sm text-muted-foreground mb-3">No se encontró staff</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setNewStaffName(search);
                          setShowNewStaffDialog(true);
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
                  {results.map((staff) => (
                    <CommandItem
                      key={staff.id}
                      value={staff.id.toString()}
                      onSelect={() => {
                        onSelect(staff);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedStaff?.id === staff.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex-1">
                        <div>{staff.name}</div>
                        {staff.name_native && (
                          <div className="text-xs text-muted-foreground">{staff.name_native}</div>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {selectedStaff && (
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
          onClick={() => setShowNewStaffDialog(true)}
          title="Crear nuevo staff"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={showNewStaffDialog} onOpenChange={setShowNewStaffDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nuevo Staff</DialogTitle>
            <DialogDescription>
              Agrega un nuevo miembro del staff que no está en la base de datos
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-staff-name">Nombre *</Label>
              <Input
                id="new-staff-name"
                value={newStaffName}
                onChange={(e) => setNewStaffName(e.target.value)}
                placeholder="Nombre del staff"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-staff-name-native">Nombre Nativo</Label>
              <Input
                id="new-staff-name-native"
                value={newStaffNameNative}
                onChange={(e) => setNewStaffNameNative(e.target.value)}
                placeholder="Nombre en idioma original"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewStaffDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateNewStaff} disabled={!newStaffName.trim()}>
              Crear Staff
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
