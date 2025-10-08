'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface DisapprovalDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
}

export default function DisapprovalDialog({ isOpen, onOpenChange, onConfirm }: DisapprovalDialogProps) {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (reason.trim()) {
      onConfirm(reason);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Motivo del Rechazo</DialogTitle>
          <DialogDescription>
            Por favor, proporciona un comentario para que el usuario pueda corregir su contribución. Esta notificación le será enviada.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="reason">Comentario de Rechazo</Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ej: La sinopsis es demasiado corta o el enlace del tráiler no es válido."
            className="mt-2"
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={!reason.trim()}>
            Confirmar Rechazo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
