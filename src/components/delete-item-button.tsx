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
