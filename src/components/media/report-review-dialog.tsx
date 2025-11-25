'use client';

/**
 * Componente: ReportReviewDialog
 * Permite a los usuarios reportar reseñas inapropiadas
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface ReportReviewDialogProps {
  reviewId: string;
  reviewAuthor: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam o publicidad' },
  { value: 'offensive_language', label: 'Lenguaje ofensivo' },
  { value: 'harassment', label: 'Acoso o intimidación' },
  { value: 'spoilers', label: 'Spoilers sin advertencia' },
  { value: 'irrelevant_content', label: 'Contenido irrelevante' },
  { value: 'misinformation', label: 'Información falsa' },
  { value: 'other', label: 'Otro motivo' },
];

export function ReportReviewDialog({
  reviewId,
  reviewAuthor,
  open,
  onClose,
  onSuccess,
}: ReportReviewDialogProps) {
  const [reason, setReason] = useState('');
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!reason) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Por favor selecciona una razón para el reporte',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/reviews/${reviewId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          reason,
          comments: comments.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar el reporte');
      }

      toast({
        title: '✅ Reporte enviado',
        description: 'Tu reporte ha sido recibido y será revisado por el equipo de moderación',
      });

      setReason('');
      setComments('');
      onSuccess();
      onClose();

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setReason('');
      setComments('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Reportar Reseña</DialogTitle>
          <DialogDescription>
            Estás reportando la reseña de <strong>@{reviewAuthor}</strong>.
            Por favor, indica la razón del reporte.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Razón del reporte *</Label>
            <Select value={reason} onValueChange={setReason} disabled={isSubmitting}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Selecciona una razón" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_REASONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comments">
              Comentarios adicionales
              {reason === 'other' && ' *'}
            </Label>
            <Textarea
              id="comments"
              placeholder="Describe brevemente por qué estás reportando esta reseña..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              disabled={isSubmitting}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {comments.length}/500 caracteres
            </p>
          </div>

          <div className="rounded-md bg-muted p-3">
            <p className="text-xs text-muted-foreground">
              <strong>Nota:</strong> Los reportes falsos o abusivos pueden resultar en
              acciones contra tu cuenta. Por favor, reporta solo contenido que realmente
              viole nuestras políticas de comunidad.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !reason || (reason === 'other' && !comments.trim())}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              'Enviar Reporte'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
