/**
 * @fileoverview ReportProblemDialog - Diálogo para reportar problemas de contenido.
 * 
 * Este componente permite a los usuarios reportar información incorrecta o faltante.
 * Los reportes son enviados a moderadores y administradores para su revisión.
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { FileWarning, PlusSquare, Loader2 } from 'lucide-react';
import type { TitleInfo } from '@/lib/types';
import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { ContributionDialog } from '@/components/contributions';

interface ReportProblemDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  titleInfo: TitleInfo;
}

export default function ReportProblemDialog({ isOpen, onOpenChange, titleInfo }: ReportProblemDialogProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showReportForm, setShowReportForm] = useState(false);
  const [showContributionDialog, setShowContributionDialog] = useState(false);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNavigate = (path: string) => {
    onOpenChange(false);
    router.push(path);
  };

  const handleShowReportForm = () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Debes iniciar sesión para reportar problemas',
      });
      onOpenChange(false);
      router.push('/login');
      return;
    }
    setShowReportForm(true);
  };

  const handleSubmitReport = async () => {
    if (!user) return;

    if (!description.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Por favor describe el problema',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Mapear tipo a formato de DB
      const typeMap: Record<string, string> = {
        'Anime': 'anime',
        'Manga': 'manga',
        'Novela': 'novel',
        'Donghua': 'donghua',
        'Manhua': 'manhua',
        'Manhwa': 'manhwa',
        'Fan Comic': 'fan_comic',
      };

      const response = await fetch('/api/content-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: user.id,
          reportableType: typeMap[titleInfo.type] || 'anime',
          reportableId: titleInfo.id,
          issueType: 'missing_info',
          title: `Información faltante en ${titleInfo.title}`,
          description: description.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: '¡Reporte enviado!',
          description: 'Los moderadores revisarán tu reporte pronto. ¡Gracias por contribuir!',
        });
        setDescription('');
        setShowReportForm(false);
        onOpenChange(false);
      } else {
        throw new Error(data.error || 'Error al enviar reporte');
      }
    } catch (error: any) {
      console.error('Error al enviar reporte:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo enviar el reporte',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    setShowReportForm(false);
    setDescription('');
  };

  const handleOpenContribution = () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Debes iniciar sesión para contribuir',
      });
      return;
    }
    onOpenChange(false); // Cerrar el diálogo principal
    setShowContributionDialog(true); // Abrir el diálogo de contribución
  };

  if (showReportForm) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Reportar información faltante o incorrecta</DialogTitle>
            <DialogDescription>
              {titleInfo.title}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="description">¿Qué información falta o es incorrecta?</Label>
              <Textarea
                id="description"
                placeholder="Ejemplo: La fecha de emisión está incorrecta, debería ser 2024 en lugar de 2023. También faltan los géneros Drama y Thriller."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Los moderadores recibirán una notificación y podrán actualizar la información.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
              Atrás
            </Button>
            <Button onClick={handleSubmitReport} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar reporte
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reportar un problema</DialogTitle>
            <DialogDescription>
              ¿Qué tipo de problema encontraste o qué te gustaría hacer?
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Button variant="outline" className="justify-start h-auto py-3" onClick={handleShowReportForm}>
              <FileWarning className="mr-3 h-5 w-5 text-destructive" />
              <div className='text-left'>
                <p className="font-semibold">Falta información o es incorrecta</p>
                <p className="text-xs text-muted-foreground">La sinopsis, géneros, fechas, etc., no son correctos.</p>
              </div>
            </Button>
            <Button variant="outline" className="justify-start h-auto py-3" onClick={handleOpenContribution}>
              <PlusSquare className="mr-3 h-5 w-5 text-primary" />
              <div className='text-left'>
                <p className="font-semibold">Agregar Información</p>
                <p className="text-xs text-muted-foreground">Editar o completar la información de este contenido.</p>
              </div>
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Contribución */}
      <ContributionDialog
        open={showContributionDialog}
        onOpenChange={setShowContributionDialog}
        mediaType={titleInfo.type.toLowerCase()}
        mediaId={titleInfo.id}
      />
    </>
  );
}
