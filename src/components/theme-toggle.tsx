/**
 * @fileoverview ThemeToggle - Botón para cambiar el tema de la aplicación.
 * 
 * Renderiza un menú desplegable que permite al usuario seleccionar su tema
 * preferido: Claro, Oscuro, Dinámico o Sistema.
 * - Utiliza el hook `useTheme` de `next-themes` para obtener y cambiar el tema.
 * - Muestra un icono de sol o luna según el tema activo.
 * - La opción "Dinámico" activa el tema basado en la paleta de colores de la
 *   imagen principal (gestionado por `DynamicTheme.tsx`).
 */

"use client"

import * as React from "react"
import { Moon, Sun, Sparkles } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Claro
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Oscuro
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dynamic")}>
          Dinámico
        </DropdownMenuItem>
         <DropdownMenuItem onClick={() => setTheme("system")}>
          Sistema
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
