'use client';

/**
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ COMPONENTE: ReportCommentDialog                                     │
 * │ Dialog para reportar comentarios inapropiados                       │
 * └─────────────────────────────────────────────────────────────────────┘
 * 
 * PROPÓSITO:
 * Interfaz de usuario que permite a los miembros de la comunidad reportar
 * comentarios que violen las normas (spam, acoso, spoilers, contenido ofensivo)
 * 
 * FLUJO DE USUARIO:
 * 1. Usuario hace clic en "Reportar" en el menú del comentario (comment-item.tsx)
 * 2. Se abre este dialog con un textarea para explicar la razón
 * 3. Usuario escribe mínimo 10 caracteres explicando el problema
 * 4. Al hacer submit → POST /api/comments/[id]/report
 * 5. API crea registro en app.comment_reports
 * 6. TRIGGER automático notifica a todos los admins/moderadores
 * 7. Toast de éxito: "Reporte enviado"
 * 8. Dialog se cierra y limpia el formulario
 * 
 * INTEGRACIÓN CON SISTEMA DE REPORTES:
 * 
 * API Endpoint: POST /api/comments/[id]/report
 * Body: { reason: string } (min 10 chars, max 500 chars)
 * 
 * Base de Datos:
 * → Inserta en app.comment_reports:
 *   - comment_id: ID del comentario reportado
 *   - reporter_user_id: ID del usuario que reporta (del JWT)
 *   - reported_user_id: ID del autor del comentario
 *   - reason: 'inappropriate_content' (categoría fija)
 *   - comments: Texto libre del usuario (este textarea)
 *   - status: 'pending'
 * 
 * Trigger Automático (trg_notify_new_comment_report):
 * → Busca todos usuarios con rol 'admin' o 'moderator' activos
 * → Crea notificación para cada uno:
 *   - action_type: 'comment_reported'
 *   - notifiable_type: 'comment_report'
 *   - notifiable_id: ID del reporte creado
 *   - actor_user_id: ID del usuario que reporta
 * 
 * Notificaciones (notifications-button.tsx):
 * → Moderador ve notificación "X reportó un comentario"
 * → Clic → Redirige a /dashboard/moderator/reported-comments
 * → Lista de reportes pendientes con visibilidad según rol
 * 
 * VALIDACIONES:
 * ✅ Mínimo 10 caracteres (frontend y backend)
 * ✅ Máximo 500 caracteres (frontend)
 * ✅ No puede reportar su propio comentario (backend)
 * ✅ No puede reportar el mismo comentario dos veces (UNIQUE constraint BD)
 * ✅ Usuario debe estar autenticado (backend)
 * ✅ Comentario debe existir y no estar eliminado (backend)
 * 
 * ESTADOS:
 * - isOpen: Dialog visible/oculto
 * - reason: Texto del reporte (10-500 caracteres)
 * - isSubmitting: Loading durante envío del reporte
 * 
 * MANEJO DE ERRORES:
 * - "Ya has reportado este comentario" → Toast destructive
 * - "No puedes reportar tu propio comentario" → Toast destructive
 * - "La razón debe tener al menos 10 caracteres" → Toast destructive
 * - Error de red/servidor → Toast con mensaje de error
 * 
 * ACCESIBILIDAD:
 * - Dialog con título y descripción semántica
 * - Botones deshabilitados durante envío
 * - Contador de caracteres visible
 * - Placeholder con ejemplo claro
 * 
 * USADO EN:
 * - comment-item.tsx (menú desplegable del comentario)
 * - comments-section.tsx (estado de reportingComment)
 * 
 * RELACIONADO CON:
 * - /api/comments/[id]/report (endpoint de envío)
 * - /dashboard/moderator/reported-comments (panel de moderación)
 * - notifications-button.tsx (notificaciones a moderadores)
 * - reported-comments-content.tsx (lista de reportes)
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
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

/**
 * Props del componente ReportCommentDialog
 * 
 * @property commentId - ID del comentario a reportar (string numérico)
 * @property isOpen - Estado de visibilidad del dialog
 * @property onClose - Callback para cerrar el dialog (limpia estado padre)
 */
interface ReportCommentDialogProps {
  commentId: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Componente de dialog para reportar comentarios
 * 
 * FUNCIONAMIENTO INTERNO:
 * 1. reason state: Almacena el texto del usuario (10-500 chars)
 * 2. isSubmitting: Previene doble submit y muestra estado de carga
 * 3. handleSubmit:
 *    a) Valida longitud mínima (10 caracteres)
 *    b) Hace POST a /api/comments/[commentId]/report
 *    c) API valida y crea reporte en app.comment_reports
 *    d) Trigger automático notifica a admins/moderadores
 *    e) Muestra toast de éxito o error
 *    f) Limpia formulario y cierra dialog
 * 
 * IMPORTANTE - CADENA DE NOTIFICACIONES:
 * Este componente dispara la siguiente cadena:
 * 1. POST → /api/comments/[id]/report
 * 2. INSERT → app.comment_reports (status='pending')
 * 3. TRIGGER → fn_notify_new_comment_report()
 * 4. INSERT → app.notifications (para cada admin/moderador)
 *    - action_type: 'comment_reported'
 *    - notifiable_type: 'comment_report'
 * 5. Frontend → notifications-button.tsx detecta nueva notificación
 * 6. Moderador → Clic en notificación → /dashboard/moderator/reported-comments
 * 7. API → GET /api/admin/reported-comments (con lógica de visibilidad)
 * 8. Moderador → Asignar, resolver o rechazar reporte
 */
export function ReportCommentDialog({
  commentId,
  isOpen,
  onClose,
}: ReportCommentDialogProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  /**
   * Maneja el envío del reporte
   * 
   * VALIDACIONES:
   * - Mínimo 10 caracteres en reason
   * - Trim de espacios en blanco
   * 
   * PROCESO:
   * 1. Valida longitud mínima
   * 2. Deshabilita botón (isSubmitting=true)
   * 3. POST a /api/comments/[commentId]/report
   * 4. Backend valida:
   *    - Usuario autenticado
   *    - Comentario existe
   *    - No es su propio comentario
   *    - No ha reportado antes (UNIQUE constraint)
   * 5. Backend crea reporte en comment_reports
   * 6. Trigger crea notificaciones automáticamente
   * 7. Respuesta → Toast de éxito
   * 8. Limpia formulario y cierra dialog
   * 
   * ERRORES COMUNES:
   * - "Ya has reportado este comentario" (UNIQUE violation)
   * - "No puedes reportar tu propio comentario" (misma user_id)
   * - "Comentario no encontrado" (deleted o no existe)
   * - "Token inválido" (sesión expirada)
   */
  const handleSubmit = async () => {
    // Validación frontend: mínimo 10 caracteres
    if (reason.trim().length < 10) {
      toast({
        title: 'Error',
        description: 'La razón debe tener al menos 10 caracteres',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Enviar reporte al backend
      const response = await fetch(`/api/comments/${commentId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: reason.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar reporte');
      }

      // Éxito: Mostrar confirmación y limpiar
      toast({
        title: 'Reporte enviado',
        description: 'Gracias por ayudar a mantener la comunidad segura',
      });

      setReason('');
      onClose();
    } catch (error: any) {
      // Error: Mostrar mensaje descriptivo
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reportar comentario</DialogTitle>
          <DialogDescription>
            Por favor, explica por qué consideras que este comentario viola nuestras normas.
          </DialogDescription>
        </DialogHeader>

        {/* Textarea para la razón del reporte */}
        <div className="space-y-4 py-4">
          <Textarea
            placeholder="Ejemplo: Este comentario contiene spoilers no marcados del capítulo final..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={5}
            maxLength={500} // Límite de caracteres
            disabled={isSubmitting}
          />
          {/* Contador de caracteres con indicador de mínimo */}
          <p className="text-sm text-muted-foreground">
            {reason.length}/500 caracteres (mínimo 10)
          </p>
        </div>

        {/* Botones de acción */}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || reason.trim().length < 10} // Deshabilitar si no cumple mínimo
          >
            {isSubmitting ? 'Enviando...' : 'Enviar reporte'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
