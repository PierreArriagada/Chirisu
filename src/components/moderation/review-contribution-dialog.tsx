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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { Contribution } from '@/lib/types';
import { ArrowRight, Check, X } from 'lucide-react';
import { useState } from 'react';
import DisapprovalDialog from './disapproval-dialog';

interface ReviewContributionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  contribution: Contribution;
  onApprove: (id: string) => void;
  onDisapprove: (id: string, reason: string) => void;
}

function DataField({ label, oldValue, newValue }: { label: string, oldValue: any, newValue: any }) {
    const hasChanged = JSON.stringify(oldValue) !== JSON.stringify(newValue);
    if (!hasChanged && !newValue) return null;

    const displayValue = (value: any) => {
        if (value === undefined || value === null) return <span className="text-muted-foreground/70">N/A</span>;
        if (Array.isArray(value)) return value.join(', ');
        if (typeof value === 'object') return <pre className="text-xs">{JSON.stringify(value, null, 2)}</pre>
        return String(value);
    }

    return (
        <div className="grid grid-cols-12 gap-2 text-sm even:bg-muted/50 p-2 rounded-md">
            <strong className="col-span-3">{label}</strong>
            {oldValue !== undefined && (
                 <div className={`col-span-4 ${hasChanged ? 'text-destructive line-through' : ''}`}>
                    {displayValue(oldValue)}
                </div>
            )}
            {oldValue !== undefined && <div className="col-span-1 flex items-center justify-center"><ArrowRight size={14} className="text-muted-foreground" /></div>}
            <div className={`col-span-${oldValue !== undefined ? '4' : '9'} ${hasChanged ? 'text-green-600 font-semibold' : ''}`}>
                {displayValue(newValue)}
            </div>
        </div>
    )
}

export default function ReviewContributionDialog({
  isOpen,
  onOpenChange,
  contribution,
  onApprove,
  onDisapprove,
}: ReviewContributionDialogProps) {
  
  const [isDisapprovalOpen, setDisapprovalOpen] = useState(false);

  const allKeys = new Set([...Object.keys(contribution.oldData || {}), ...Object.keys(contribution.newData)]);

  const handleConfirmDisapprove = (reason: string) => {
    onDisapprove(contribution.id, reason);
    setDisapprovalOpen(false);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Revisar Contribución: {contribution.mediaTitle}</DialogTitle>
            <DialogDescription>
              Enviado por <Badge variant="secondary">{contribution.user.name}</Badge> el {contribution.date}.
              Tipo de cambio: <Badge variant="outline">{contribution.changeType}</Badge>
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[60vh] border rounded-lg p-4">
            <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 text-sm font-bold px-2">
                    <div className="col-span-3">Campo</div>
                    <div className="col-span-4">Valor Anterior</div>
                    <div className="col-span-1"></div>
                    <div className="col-span-4">Valor Nuevo</div>
                </div>
                {Array.from(allKeys).map(key => (
                    <DataField key={key} label={key} oldValue={contribution.oldData?.[key]} newValue={contribution.newData[key]} />
                ))}
            </div>
          </ScrollArea>
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
            <Button variant="destructive" onClick={() => setDisapprovalOpen(true)}>
                <X className="mr-2 h-4 w-4" />
                Rechazar
            </Button>
            <Button className='bg-green-600 hover:bg-green-700' onClick={() => onApprove(contribution.id)}>
                <Check className="mr-2 h-4 w-4" />
                Aprobar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>>

      <DisapprovalDialog 
        isOpen={isDisapprovalOpen}
        onOpenChange={setDisapprovalOpen}
        onConfirm={handleConfirmDisapprove}
      />
    </>
  );
}
