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
import { Button } from '@/components/ui/button';

interface DeleteItemButtonProps {
    onRemove: () => void;
}

export default function DeleteItemButton({ onRemove }: DeleteItemButtonProps) {
    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onRemove();
    };

    return (
        <Button
            variant="destructive"
            size="icon"
            className="h-6 w-6 rounded-full opacity-100 transition-opacity hover:scale-110"
            onClick={handleClick}
            aria-label="Eliminar de la lista"
        >
            <X className="h-3 w-3" />
        </Button>
    );
}
