/**
 * @fileoverview CustomListAccordion - Acordeón para listas personalizadas del usuario.
 * 
 * Este componente renderiza una lista de acordeones, donde cada uno representa una
 * lista personalizada creada por el usuario.
 * - El disparador del acordeón (trigger) muestra el nombre de la lista.
 * - Un menú desplegable permite editar el nombre o eliminar la lista.
 * - El contenido del acordeón muestra los títulos (animes, mangas, etc.) dentro
 *   de esa lista, un interruptor para gestionar su privacidad (pública/privada), y
 *   permite eliminar elementos individualmente.
 * Utiliza `ListFormDialog` para la edición y creación.
 */

'use client';

import { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { CustomList as CustomListType } from '@/lib/types';
import { ListFormDialog, ListPrivacyToggle } from '@/components/lists';
import UserMediaList from './user-media-list';

interface CustomListAccordionProps {
    lists: CustomListType[];
    onEdit: (id: string, newName: string) => void;
    onDelete: (id: string) => void;
    onRemoveItem: (listId: string, itemId: string) => void;
    onPrivacyChange: (listId: string, isPublic: boolean) => void;
}

export default function CustomListAccordion({ lists, onEdit, onDelete, onRemoveItem, onPrivacyChange }: CustomListAccordionProps) {
    const [editingList, setEditingList] = useState<CustomListType | null>(null);

    const handleEditClick = (e: React.MouseEvent, list: CustomListType) => {
        e.stopPropagation(); // Prevent accordion from toggling
        setEditingList(list);
    };

    const handleDeleteClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        // PSQL: Esto mostraría un diálogo de confirmación antes de llamar a onDelete.
        // Por simplicidad, eliminamos directamente.
        onDelete(id);
    };

    return (
        <>
            <Accordion type="multiple" className="w-full space-y-4">
                {lists.map(list => (
                    <AccordionItem key={list.id} value={list.id} className="border rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/50 transition-colors">
                             <AccordionTrigger className="p-0 hover:no-underline flex-1 text-left">
                                <span className="font-semibold text-lg">{list.name}</span>
                            </AccordionTrigger>
                            <div onClick={(e) => e.stopPropagation()}>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={(e) => handleEditClick(e, list)}>
                                            <Pencil className="mr-2 h-4 w-4" />
                                            <span>Editar nombre</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={(e) => handleDeleteClick(e, list.id)} className="text-destructive">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            <span>Eliminar lista</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                        <AccordionContent className="p-4 pt-4 space-y-4">
                             <ListPrivacyToggle
                                isPublic={list.isPublic}
                                onCheckedChange={(isPublic) => onPrivacyChange(list.id, isPublic)}
                             />
                            <UserMediaList 
                                items={list.items}
                                onRemoveItem={(itemId) => onRemoveItem(list.id, itemId)}
                            />
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>

            {editingList && (
                <ListFormDialog
                    isOpen={!!editingList}
                    onOpenChange={() => setEditingList(null)}
                    onSave={(newName) => onEdit(editingList.id, newName)}
                    initialValue={editingList.name}
                    title="Editar nombre de la lista"
                    description="Elige un nuevo nombre para tu lista."
                    buttonText="Guardar cambios"
                />
            )}
        </>
    );
}
