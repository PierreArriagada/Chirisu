/**
 * ScanlationGroupSearch - Componente de búsqueda/autocompletado para grupos de scanlation
 * Busca grupos existentes y permite crear nuevos
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, Plus, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScanlationGroup {
  id: number;
  name: string;
  slug: string;
  websiteUrl?: string;
  isVerified: boolean;
  projectsCount: number;
}

interface ScanlationGroupSearchProps {
  value: string;
  onChange: (value: string, groupId?: number) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function ScanlationGroupSearch({
  value,
  onChange,
  placeholder = 'Buscar o agregar grupo de scanlation...',
  disabled = false,
  className,
}: ScanlationGroupSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const [groups, setGroups] = useState<ScanlationGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<ScanlationGroup | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>(undefined);

  // Buscar grupos cuando cambia el término
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (searchTerm.length < 2) {
      setGroups([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/scan/groups?search=${encodeURIComponent(searchTerm)}&limit=5`);
        if (response.ok) {
          const data = await response.json();
          setGroups(data.groups || []);
        }
      } catch (error) {
        console.error('Error buscando grupos:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchTerm]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setSelectedGroup(null);
    onChange(newValue, undefined);
    setIsOpen(true);
  };

  const handleSelectGroup = (group: ScanlationGroup) => {
    setSelectedGroup(group);
    setSearchTerm(group.name);
    onChange(group.name, group.id);
    setIsOpen(false);
  };

  const handleUseNewName = () => {
    // Usar el nombre tal cual (se creará el grupo automáticamente)
    onChange(searchTerm, undefined);
    setIsOpen(false);
  };

  const showDropdown = isOpen && searchTerm.length >= 2;
  const exactMatch = groups.find(g => g.name.toLowerCase() === searchTerm.toLowerCase());

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => searchTerm.length >= 2 && setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-9 pr-10"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
        {selectedGroup && !loading && (
          <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
        )}
      </div>

      {/* Dropdown de resultados */}
      {showDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
          {groups.length > 0 ? (
            <>
              {groups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => handleSelectGroup(group)}
                  className="w-full px-3 py-2 text-left hover:bg-accent flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="truncate font-medium">{group.name}</span>
                    {group.isVerified && (
                      <Badge variant="secondary" className="shrink-0 text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verificado
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {group.projectsCount} proyectos
                  </span>
                </button>
              ))}

              {/* Opción para usar nombre nuevo si no hay coincidencia exacta */}
              {!exactMatch && (
                <button
                  type="button"
                  onClick={handleUseNewName}
                  className="w-full px-3 py-2 text-left hover:bg-accent border-t flex items-center gap-2 text-muted-foreground"
                >
                  <Plus className="h-4 w-4" />
                  <span>Agregar "{searchTerm}" como nuevo grupo</span>
                </button>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={handleUseNewName}
              className="w-full px-3 py-2 text-left hover:bg-accent flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>Agregar "{searchTerm}" como nuevo grupo</span>
            </button>
          )}
        </div>
      )}

      {/* Info del grupo seleccionado */}
      {selectedGroup && (
        <p className="text-xs text-muted-foreground mt-1">
          ✓ Grupo existente con {selectedGroup.projectsCount} proyectos registrados
        </p>
      )}
    </div>
  );
}

export default ScanlationGroupSearch;
