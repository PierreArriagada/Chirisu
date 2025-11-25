/**
 * @fileoverview ListFormDialog - Diálogo para crear o editar una lista.
 * 
 * Este es un componente de diálogo modal reutilizable que contiene un formulario
 * con un único campo de texto para el nombre de una lista.
 * Se utiliza tanto para crear una nueva lista personalizada (con un valor inicial vacío)
 * como para editar el nombre de una existente (recibiendo el nombre actual como
 * valor inicial). Al guardar, invoca la función `onSave` con el nuevo nombre.
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface ListFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string) => void;
  initialValue?: string;
  title: string;
  description: string;
  buttonText: string;
}

export default function ListFormDialog({
  isOpen,
  onOpenChange,
  onSave,
  initialValue = '',
  title,
  description,
  buttonText,
}: ListFormDialogProps) {
  const [name, setName] = useState(initialValue);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setName(initialValue);
    }
  }, [isOpen, initialValue]);

  const handleSave = () => {
    if (name.trim() === '') {
      toast({
        variant: 'destructive',
        title: 'El nombre no puede estar vacío',
      });
      return;
    }
    onSave(name);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nombre
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="Ej: Animes para llorar"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>{buttonText}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
