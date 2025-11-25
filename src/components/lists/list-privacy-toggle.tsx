/**
 * @fileoverview ListPrivacyToggle - Interruptor para cambiar la privacidad de una lista.
 * 
 * Componente visual que permite al usuario cambiar el estado de una lista entre
 * "Pública" y "Privada". Muestra un icono de globo terráqueo o candado según
 * el estado actual y un interruptor (switch) para modificarlo.
 * Es reutilizable y se emplea tanto para las listas predeterminadas como para
 * las listas personalizadas en la página de perfil.
 */

'use client';

import { Globe, Lock } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ListPrivacyToggleProps {
  isPublic: boolean;
  onCheckedChange: (isPublic: boolean) => void;
}

export default function ListPrivacyToggle({ isPublic, onCheckedChange }: ListPrivacyToggleProps) {
  const Icon = isPublic ? Globe : Lock;
  const text = isPublic ? "Lista Pública" : "Lista Privada";
  const id = `privacy-toggle-${Math.random()}`;

  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
        <div className="flex items-center gap-3">
            <Icon className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium text-sm">{text}</span>
        </div>
        <div className="flex items-center space-x-2">
            <Switch 
                id={id} 
                checked={isPublic}
                onCheckedChange={onCheckedChange}
            />
            <Label htmlFor={id} className="sr-only">{text}</Label>
        </div>
    </div>
  );
}
