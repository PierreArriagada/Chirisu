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
  refreshUserLists?: () => Promise<void>;
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
  refreshUserLists,
}: AddToListDialogProps) {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [selectedLists, setSelectedLists] = useState<Set<string>>(new Set());
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [isLoadingLists, setIsLoadingLists] = useState(false);

  // Detectar qué listas ya contienen este título
  useEffect(() => {
    if (!isOpen) return;

    const loadAndDetect = async () => {
      setIsLoadingLists(true);
      
      // Primero refrescar las listas si la función está disponible
      if (refreshUserLists) {
        console.log('� Llamando a refreshUserLists...');
        await refreshUserLists();
        console.log('✅ refreshUserLists completado');
        // Esperar un tick para que React actualice el estado
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log('�🔍 AddToListDialog opened');
      console.log('   titleInfo.id:', titleInfo.id, 'type:', typeof titleInfo.id);
      console.log('   userLists:', userLists);

      const initial = new Set<string>();

      // Verificar listas por defecto
      DEFAULT_LISTS.forEach(list => {
        if (!userLists[list.key] || !Array.isArray(userLists[list.key])) {
          console.log(`   ⚠️ List ${list.key} is undefined or not an array`);
          return;
        }

        console.log(`   📋 Checking ${list.name} (${list.key}): ${userLists[list.key].length} items`);
        console.log(`      Items:`, userLists[list.key]);

        const hasItem = userLists[list.key].some((item: any) => {
          const itemMediaId = item.mediaId || item.id;
          console.log(`      Comparing: itemMediaId=${itemMediaId} (${typeof itemMediaId}) vs titleInfo.id=${titleInfo.id} (${typeof titleInfo.id})`);
          
          const matches = itemMediaId === titleInfo.id.toString() || 
                         itemMediaId.toString() === titleInfo.id.toString();

          if (matches) {
            console.log(`      ✅ MATCH FOUND!`);
          }
          return matches;
        });

        if (hasItem) {
          console.log(`   ✓ Adding ${list.id} to selection`);
          initial.add(list.id);
        }
      });

      // Verificar listas personalizadas
      customLists.forEach(list => {
        console.log(`   📋 Checking custom list: ${list.name}, items:`, list.items);
        
        const hasItem = list.items?.some((item: any) => {
          const itemMediaId = item.mediaId || item.id;
          return itemMediaId === titleInfo.id.toString() || 
                 itemMediaId.toString() === titleInfo.id.toString();
        });

        if (hasItem) {
          console.log(`   ✓ Found in custom list: ${list.name}`);
          initial.add(`custom-${list.id}`);
        }
      });

      console.log(`   🎯 Final selection:`, Array.from(initial));
      setSelectedLists(initial);
      setIsLoadingLists(false);
    };

    loadAndDetect();
  }, [isOpen]);

  const toggleList = (listId: string, isCustom: boolean) => {
    const newSelected = new Set(selectedLists);
    const fullId = isCustom ? `custom-${listId}` : listId;
    
    // Si es una lista por defecto (no custom), manejar exclusividad
    if (!isCustom) {
      const defaultListIds = DEFAULT_LISTS.map(l => l.id);
      
      if (newSelected.has(fullId)) {
        // Si ya está seleccionada, quitarla
        newSelected.delete(fullId);
        onAddToList(listId, isCustom);
      } else {
        // Si va a seleccionarse, primero quitar de otras listas por defecto
        defaultListIds.forEach(id => {
          if (id !== listId && newSelected.has(id)) {
            newSelected.delete(id);
            // Llamar a onAddToList para quitar de esa lista en el backend
            onAddToList(id, false);
          }
        });
        
        // Luego agregar a la nueva lista
        newSelected.add(fullId);
        onAddToList(listId, isCustom);
      }
    } else {
      // Para listas personalizadas, comportamiento normal de toggle
      if (newSelected.has(fullId)) {
        newSelected.delete(fullId);
      } else {
        newSelected.add(fullId);
      }
      
      onAddToList(listId, isCustom);
    }
    
    setSelectedLists(newSelected);
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
        <DrawerContent className="max-h-[90vh] flex flex-col">
          <DrawerHeader className="text-left">
            <DrawerTitle>Añadir a lista</DrawerTitle>
            <DrawerDescription>
              {titleInfo.title}
            </DrawerDescription>
          </DrawerHeader>
          <ScrollArea className="flex-1 px-4 pb-8">
            <div className="pr-4">
              {content}
            </div>
          </ScrollArea>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Añadir a lista</DialogTitle>
          <DialogDescription>
            {titleInfo.title}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-4 -mr-4">
          <div className="pr-4">
            {content}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
