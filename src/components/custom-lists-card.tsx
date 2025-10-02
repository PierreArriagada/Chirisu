/**
 * @fileoverview CustomListsCard - Tarjeta para gestionar las listas personalizadas.
 * 
 * Es el componente contenedor que se muestra en la página de perfil del usuario.
 * - Muestra el título "Mis listas creadas".
 * - Incluye un botón para abrir un diálogo (`ListFormDialog`) y crear una nueva lista.
 * - Renderiza `CustomListAccordion` para mostrar las listas existentes.
 * - Muestra un mensaje de bienvenida si el usuario aún no ha creado ninguna lista.
 * Centraliza la lógica de alto nivel para la creación de listas.
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import type { CustomList as CustomListType } from '@/lib/types';
import ListFormDialog from './list-form-dialog';
import CustomListAccordion from './custom-list-accordion';

interface CustomListsCardProps {
    lists: CustomListType[];
    onCreate: (name: string) => void;
    onEdit: (id: string, newName: string) => void;
    onDelete: (id: string) => void;
    onRemoveItem: (listId: string, itemId: string) => void;
    onPrivacyChange: (listId: string, isPublic: boolean) => void;
}

export default function CustomListsCard({ lists, onCreate, onEdit, onDelete, onRemoveItem, onPrivacyChange }: CustomListsCardProps) {
    const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);

    return (
        <>
            <Card className="max-w-4xl mx-auto">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Mis listas creadas</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => setCreateDialogOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Crear nueva lista
                    </Button>
                </CardHeader>
                <CardContent>
                    {lists.length > 0 ? (
                        <CustomListAccordion 
                            lists={lists} 
                            onEdit={onEdit} 
                            onDelete={onDelete}
                            onRemoveItem={onRemoveItem} 
                            onPrivacyChange={onPrivacyChange}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-10">
                            <p>No has creado ninguna lista personalizada todavía.</p>
                            <p className="text-sm">¡Crea tu primera lista para organizar tus títulos!</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <ListFormDialog
                isOpen={isCreateDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onSave={onCreate}
                title="Crear nueva lista"
                description="Dale un nombre a tu nueva lista personalizada."
                buttonText="Crear lista"
            />
        </>
    );
}
