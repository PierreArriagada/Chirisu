/**
 * ========================================
 * COMPONENTE: SELECTOR DE STAFF
 * ========================================
 * Permite buscar staff existente o crear nuevo
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface StaffMember {
  id: number;
  nameRomaji: string;
  nameNative?: string;
  imageUrl?: string;
  role: string;
}

interface StaffSelectorProps {
  selectedStaff: StaffMember[];
  onChange: (staff: StaffMember[]) => void;
}

const STAFF_ROLES = [
  'Director',
  'Original Creator',
  'Script',
  'Character Design',
  'Music',
  'Animation Director',
  'Art Director',
  'Sound Director',
  'Producer',
  'Episode Director',
];

export function StaffSelector({ selectedStaff, onChange }: StaffSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffNameNative, setNewStaffNameNative] = useState('');
  const [selectedRole, setSelectedRole] = useState('Director');
  const { toast } = useToast();

  // Buscar staff
  useEffect(() => {
    const searchStaff = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(`/api/staff?search=${encodeURIComponent(searchQuery)}`);
        const data = await response.json();
        
        if (data.success) {
          setSearchResults(data.staff || []);
        }
      } catch (error) {
        console.error('Error al buscar staff:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchStaff, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const addStaff = (staff: any, role: string) => {
    // Verificar si ya está agregado con el mismo rol
    if (selectedStaff.find(s => s.id === staff.id && s.role === role)) {
      toast({
        title: 'Ya agregado',
        description: 'Este miembro del staff ya está con este rol',
        variant: 'destructive',
      });
      return;
    }

    onChange([...selectedStaff, { ...staff, role }]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const createNewStaff = async () => {
    if (!newStaffName.trim()) {
      toast({
        title: 'Error',
        description: 'El nombre del staff es requerido',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nameRomaji: newStaffName.trim(),
          nameNative: newStaffNameNative.trim() || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        addStaff(data.staff, selectedRole);
        setNewStaffName('');
        setNewStaffNameNative('');
        toast({
          title: 'Staff agregado',
          description: data.message,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo crear el staff',
        variant: 'destructive',
      });
    }
  };

  const removeStaff = (id: number, role: string) => {
    onChange(selectedStaff.filter(s => !(s.id === id && s.role === role)));
  };

  return (
    <div className="space-y-4">
      {/* Búsqueda */}
      <div className="relative">
        <Label>Buscar Staff</Label>
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
            {searchResults.map((staff) => (
              <div key={staff.id} className="p-3 hover:bg-accent">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{staff.nameRomaji}</p>
                    {staff.nameNative && (
                      <p className="text-sm text-muted-foreground">{staff.nameNative}</p>
                    )}
                  </div>
                </div>
                <div className="mt-2 flex gap-2">
                  <Select onValueChange={(role) => addStaff(staff, role)} defaultValue="Director">
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STAFF_ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    onClick={() => addStaff(staff, 'Director')}
                  >
                    Agregar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Crear nuevo staff */}
      <div className="space-y-2">
        <Label>O Crear Nuevo Miembro del Staff</Label>
        <Input
          placeholder="Nombre (Romaji)"
          value={newStaffName}
          onChange={(e) => setNewStaffName(e.target.value)}
        />
        <Input
          placeholder="Nombre Nativo (Opcional)"
          value={newStaffNameNative}
          onChange={(e) => setNewStaffNameNative(e.target.value)}
        />
        <div className="flex gap-2">
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STAFF_ROLES.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={createNewStaff} type="button">
            <Plus className="h-4 w-4 mr-2" />
            Crear
          </Button>
        </div>
      </div>

      {/* Staff seleccionado */}
      {selectedStaff.length > 0 && (
        <div>
          <Label>Staff Seleccionado</Label>
          <div className="mt-2 space-y-2">
            {selectedStaff.map((staff, index) => (
              <div key={`${staff.id}-${staff.role}-${index}`} className="flex items-center gap-2 p-2 border rounded-md">
                <div className="flex-1">
                  <p className="font-medium text-sm">{staff.nameRomaji}</p>
                  <p className="text-xs text-muted-foreground">{staff.role}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeStaff(staff.id, staff.role)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
