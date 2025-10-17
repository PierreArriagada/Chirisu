/**
 * Componente: PrivacyToggle
 * 
 * Descripción:
 * Toggle reutilizable para controlar la privacidad de listas y favoritos.
 * Muestra visualmente si algo es público (globo 🌍) o privado (candado 🔒)
 * 
 * Props:
 * - isPublic: boolean - Estado actual (true = público, false = privado)
 * - onToggle: (isPublic: boolean) => Promise<void> - Callback al cambiar
 * - disabled?: boolean - Deshabilitar el toggle
 * - label?: string - Texto personalizado (opcional)
 * 
 * Uso:
 * <PrivacyToggle
 *   isPublic={list.isPublic}
 *   onToggle={async (newValue) => {
 *     await fetch('/api/lists/123/privacy', {
 *       method: 'PATCH',
 *       body: JSON.stringify({ isPublic: newValue })
 *     });
 *   }}
 * />
 */

'use client';

import { useState } from 'react';
import { Globe, Lock } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface PrivacyToggleProps {
  isPublic: boolean;
  onToggle: (isPublic: boolean) => Promise<void>;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export function PrivacyToggle({
  isPublic,
  onToggle,
  disabled = false,
  label,
  className
}: PrivacyToggleProps) {
  const [loading, setLoading] = useState(false);

  const handleToggle = async (checked: boolean) => {
    setLoading(true);
    try {
      await onToggle(checked);
    } catch (error) {
      console.error('Error al cambiar privacidad:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <div className={cn("flex items-center gap-3", className)}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2">
              {isPublic ? (
                <Globe className="w-4 h-4 text-green-600" />
              ) : (
                <Lock className="w-4 h-4 text-muted-foreground" />
              )}
              <span className={cn(
                "text-sm font-medium",
                isPublic ? "text-green-600" : "text-muted-foreground"
              )}>
                {label || (isPublic ? 'Público' : 'Privado')}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">
              {isPublic 
                ? '🌍 Visible para todos los usuarios' 
                : '🔒 Solo visible para ti'}
            </p>
          </TooltipContent>
        </Tooltip>

        <Switch
          checked={isPublic}
          onCheckedChange={handleToggle}
          disabled={disabled || loading}
          aria-label={isPublic ? 'Cambiar a privado' : 'Cambiar a público'}
        />
      </div>
    </TooltipProvider>
  );
}
