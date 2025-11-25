'use client';

/**
 * @fileoverview CommentForm - Formulario para crear/editar comentarios
 * 
 * Soporta:
 * - Texto con contador de caracteres
 * - Checkbox para spoilers
 * - Subida de hasta 4 imágenes
 * - Preview de imágenes
 * - Edición de comentarios existentes
 */

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Comment } from '@/lib/types';

interface CommentFormProps {
  mediaType: string;
  mediaId: string;
  parentId?: string;
  editingComment?: Comment | null;
  onSubmit: (data: {
    content: string;
    is_spoiler: boolean;
    images: string[];
    parent_id?: string;
  }) => Promise<void>;
  onCancel?: () => void;
  placeholder?: string;
}

export function CommentForm({
  mediaType,
  mediaId,
  parentId,
  editingComment,
  onSubmit,
  onCancel,
  placeholder = '¿Qué opinas?',
}: CommentFormProps) {
  const { toast } = useToast();
  const [content, setContent] = useState(editingComment?.content || '');
  const [isSpoiler, setIsSpoiler] = useState(editingComment?.isSpoiler || false);
  const [images, setImages] = useState<string[]>(editingComment?.images || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxLength = 5000;
  const maxImages = 4;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (images.length + files.length > maxImages) {
      toast({
        title: 'Límite excedido',
        description: `Puedes subir máximo ${maxImages} imágenes`,
        variant: 'destructive',
      });
      return;
    }

    // En producción, aquí subirías las imágenes a un servicio como Cloudinary
    // Por ahora, usamos placeholders
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setImages(prev => [...prev, dataUrl]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (content.trim().length === 0) {
      toast({
        title: 'Error',
        description: 'El comentario no puede estar vacío',
        variant: 'destructive',
      });
      return;
    }

    if (content.length > maxLength) {
      toast({
        title: 'Error',
        description: `El comentario no puede exceder ${maxLength} caracteres`,
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        content: content.trim(),
        is_spoiler: isSpoiler,
        images,
        parent_id: parentId,
      });

      // Limpiar formulario si no estamos editando
      if (!editingComment) {
        setContent('');
        setIsSpoiler(false);
        setImages([]);
      }
    } catch (error) {
      console.error('Error al enviar comentario:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Textarea */}
      <div className="space-y-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          className="min-h-[100px] resize-none"
          disabled={isSubmitting}
          maxLength={maxLength}
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{content.length} / {maxLength} caracteres</span>
          {editingComment && (
            <span className="text-primary">Editando comentario</span>
          )}
        </div>
      </div>

      {/* Preview de imágenes */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {images.map((img, index) => (
            <div key={index} className="relative aspect-square rounded-md overflow-hidden bg-muted group">
              <img
                src={img}
                alt={`Imagen ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Opciones y botones */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Checkbox de spoiler */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="spoiler"
              checked={isSpoiler}
              onCheckedChange={(checked) => setIsSpoiler(checked as boolean)}
              disabled={isSubmitting}
            />
            <Label htmlFor="spoiler" className="text-sm cursor-pointer">
              Contiene spoilers
            </Label>
          </div>

          {/* Botón para agregar imágenes */}
          {images.length < maxImages && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSubmitting}
              className="gap-2"
            >
              <ImagePlus className="h-4 w-4" />
              <span className="hidden sm:inline">
                Imágenes ({images.length}/{maxImages})
              </span>
            </Button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        {/* Botones de acción */}
        <div className="flex items-center gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting || content.trim().length === 0}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {editingComment ? 'Guardar cambios' : parentId ? 'Responder' : 'Comentar'}
          </Button>
        </div>
      </div>
    </form>
  );
}
