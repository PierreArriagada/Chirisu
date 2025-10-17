/**
 * @fileoverview AddToListDialog - Diálogo para añadir un título a una lista.
 * 
 * Este componente muestra un diálogo modal donde el usuario puede:
 * - Ver sus listas por defecto (Viendo, Plan to Watch, Completado, etc.)
 * - Ver sus listas personalizadas
 * - Seleccionar múltiples listas para añadir el título
 * - Crear una nueva lista personalizada sin cerrar el diálogo
 * 
 * En móvil se muestra como bottom sheet, en desktop como dialog centrado
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { TitleInfo, CustomList } from '@/lib/types';
import { useIsMobile } from '@/hooks/use-mobile';

interface AddToListDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  titleInfo: TitleInfo;
  onAddToList: (listName: string, isCustom: boolean) => void;
  onCreateList: (name: string) => void;
  customLists: CustomList[];
  userLists: {
    pending: TitleInfo[];
    following: TitleInfo[];
    watched: TitleInfo[];
    favorites: TitleInfo[];
  };
}

const DEFAULT_LISTS = [
  { id: 'pending', name: 'Pendiente', key: 'pending' as const },
  { id: 'following', name: 'Viendo', key: 'following' as const },
  { id: 'watched', name: 'Completado', key: 'watched' as const },
] as const;

export default function AddToListDialog({
  isOpen,
  onOpenChange,
  titleInfo,
  onAddToList,
  onCreateList,
  customLists,
  userLists,
}: AddToListDialogProps) {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [selectedLists, setSelectedLists] = useState<Set<string>>(new Set());
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newListName, setNewListName] = useState('');

  // Detectar qué listas ya contienen este título
  useEffect(() => {
    if (isOpen) {
      const initial = new Set<string>();
      
      // Verificar listas por defecto
      DEFAULT_LISTS.forEach(list => {
        if (userLists[list.key].some(item => item.id === titleInfo.id)) {
          initial.add(list.id);
        }
      });
      
      // Verificar listas personalizadas
      customLists.forEach(list => {
        if (list.items.some(item => item.id === titleInfo.id)) {
          initial.add(`custom-${list.id}`);
        }
      });
      
      setSelectedLists(initial);
      setIsCreatingNew(false);
      setNewListName('');
    }
  }, [isOpen, titleInfo.id, userLists, customLists]);

  const toggleList = (listId: string, isCustom: boolean) => {
    const newSelected = new Set(selectedLists);
    const fullId = isCustom ? `custom-${listId}` : listId;
    
    if (newSelected.has(fullId)) {
      newSelected.delete(fullId);
    } else {
      newSelected.add(fullId);
    }
    
    setSelectedLists(newSelected);
    
    // Inmediatamente añadir o quitar de la lista
    onAddToList(listId, isCustom);
  };

  const handleCreateNewList = () => {
    if (newListName.trim() === '') {
      toast({
        variant: 'destructive',
        title: 'El nombre no puede estar vacío',
      });
      return;
    }
    
    onCreateList(newListName);
    setNewListName('');
    setIsCreatingNew(false);
    
    toast({
      title: 'Lista creada',
      description: `"${newListName}" ha sido creada exitosamente`,
    });
  };

  const content = (
    <div className="space-y-4">
      {/* Sección de listas por defecto */}
      <div>
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Listas por defecto</h3>
        <div className="space-y-2">
          {DEFAULT_LISTS.map(list => {
            const isInList = selectedLists.has(list.id);
            const count = userLists[list.key].length;
            
            return (
              <div
                key={list.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                onClick={() => toggleList(list.id, false)}
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={isInList}
                    onCheckedChange={() => toggleList(list.id, false)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div>
                    <p className="font-medium">{list.name}</p>
                    <p className="text-xs text-muted-foreground">{count} títulos</p>
                  </div>
                </div>
                {isInList && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sección de listas personalizadas */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Mis listas</h3>
          {!isCreatingNew && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCreatingNew(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Nueva lista
            </Button>
          )}
        </div>

        {/* Formulario para crear nueva lista */}
        {isCreatingNew && (
          <div className="mb-3 p-3 border rounded-lg bg-accent/50">
            <Label htmlFor="new-list-name" className="text-sm">Nombre de la lista</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="new-list-name"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="Ej: Animes para llorar"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateNewList();
                  }
                }}
                autoFocus
              />
              <Button onClick={handleCreateNewList} size="sm">
                Crear
              </Button>
              <Button 
                onClick={() => {
                  setIsCreatingNew(false);
                  setNewListName('');
                }} 
                variant="ghost" 
                size="sm"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Lista de listas personalizadas */}
        {customLists.length > 0 ? (
          <ScrollArea className="max-h-[200px]">
            <div className="space-y-2">
              {customLists.map(list => {
                const isInList = selectedLists.has(`custom-${list.id}`);
                
                return (
                  <div
                    key={list.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => toggleList(list.id, true)}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={isInList}
                        onCheckedChange={() => toggleList(list.id, true)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div>
                        <p className="font-medium">{list.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {list.items.length} títulos • {list.isPublic ? 'Pública' : 'Privada'}
                        </p>
                      </div>
                    </div>
                    {isInList && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        ) : !isCreatingNew ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No tienes listas personalizadas aún
          </p>
        ) : null}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>Añadir a lista</DrawerTitle>
            <DrawerDescription>
              {titleInfo.title}
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-8">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Añadir a lista</DialogTitle>
          <DialogDescription>
            {titleInfo.title}
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
