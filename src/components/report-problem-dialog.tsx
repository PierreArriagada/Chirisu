/**
 * @fileoverview ReportProblemDialog - Diálogo para reportar problemas de contenido.
 * 
 * Este componente es un diálogo modal que se activa desde la tarjeta de redes
 * sociales. Ofrece al usuario dos opciones principales:
 * 1. Reportar que la información de la página actual es incorrecta o está incompleta.
 *    (Actualmente, esta acción solo cierra el diálogo).
 * 2. Navegar al "Centro de Aportes" para agregar un nuevo título (anime, manga, etc.)
 *    a la base de datos.
 * Sirve como un punto de entrada para que los usuarios ayuden a mantener y expandir
 * el contenido del sitio.
 */
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { FileWarning, PlusSquare } from 'lucide-react';

interface ReportProblemDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ReportProblemDialog({ isOpen, onOpenChange }: ReportProblemDialogProps) {
  const router = useRouter();

  const handleNavigate = (path: string) => {
    onOpenChange(false);
    router.push(path);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reportar un problema</DialogTitle>
          <DialogDescription>
            ¿Qué tipo de problema encontraste o qué te gustaría hacer?
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button variant="outline" className="justify-start h-auto py-3" onClick={() => onOpenChange(false)}>
            <FileWarning className="mr-3 h-5 w-5 text-destructive" />
            <div className='text-left'>
              <p className="font-semibold">Falta información o es incorrecta</p>
              <p className="text-xs text-muted-foreground">La sinopsis, géneros, fechas, etc., no son correctos.</p>
            </div>
          </Button>
          <Button variant="outline" className="justify-start h-auto py-3" onClick={() => handleNavigate('/contribution-center')}>
            <PlusSquare className="mr-3 h-5 w-5 text-primary" />
            <div className='text-left'>
              <p className="font-semibold">Agregar Información</p>
              <p className="text-xs text-muted-foreground">Añadir un nuevo anime, manga, personaje, etc.</p>
            </div>
          </Button>
        </div>
        <DialogFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
