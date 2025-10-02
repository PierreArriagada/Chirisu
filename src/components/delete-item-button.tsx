/**
 * @fileoverview DeleteItemButton - Botón para eliminar un elemento de una lista.
 * 
 * Este es un pequeño componente reutilizable que muestra un icono de 'X'.
 * Está diseñado para ser usado dentro de las tarjetas de `UserMediaList` cuando se
 * muestran en un contexto editable (como en las listas personalizadas del perfil).
 * Al hacer clic, invoca la función `onRemove` pasada como prop para ejecutar la
 * lógica de eliminación.
 */

'use client';

import { X } from 'lucide-react';
import { Button } from './ui/button';

interface DeleteItemButtonProps {
    onRemove: () => void;
}

export default function DeleteItemButton({ onRemove }: DeleteItemButtonProps) {
    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // PSQL: En una implementación real, esto podría mostrar un diálogo de confirmación.
        onRemove();
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-full text-muted-foreground opacity-0 group-hover/item:opacity-100 transition-opacity hover:bg-destructive/20 hover:text-destructive"
            onClick={handleClick}
            aria-label="Remove item from list"
        >
            <X className="h-4 w-4" />
        </Button>
    );
}
