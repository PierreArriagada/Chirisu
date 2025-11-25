/**
 * @fileoverview ThemeToggle - Botón para cambiar el tema de la aplicación.
 * 
 * Renderiza un menú desplegable que permite al usuario seleccionar su tema
 * preferido: Claro, Oscuro, Dinámico o Sistema.
 * - Utiliza el hook `useTheme` de `next-themes` para obtener y cambiar el tema.
 * - Muestra un icono de sol o luna según el tema activo.
 * - La opción "Dinámico" activa el tema basado en la paleta de colores de la
 *   imagen principal (gestionado por `DynamicTheme.tsx`).
 * - Cuando se activa "Dinámico", guarda la preferencia de claro/oscuro en localStorage
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

function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme()

  const handleThemeChange = (newTheme: string) => {
    // Si el tema actual NO es dinámico pero el nuevo sí lo es,
    // guardar la preferencia actual (light/dark) para que el tema dinámico la use
    if (theme !== 'dynamic' && newTheme === 'dynamic') {
      const currentTheme = theme === 'system' ? systemTheme : theme;
      if (typeof window !== 'undefined') {
        localStorage.setItem('dynamic-theme-variant', currentTheme || 'dark');
      }
    }
    setTheme(newTheme);
  };

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
        <DropdownMenuItem onClick={() => handleThemeChange("light")}>
          <Sun className="mr-2 h-4 w-4" />
          Claro
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          Oscuro
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange("dynamic")}>
          <Sparkles className="mr-2 h-4 w-4" />
          Dinámico
        </DropdownMenuItem>
         <DropdownMenuItem onClick={() => handleThemeChange("system")}>
          Sistema
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { ThemeToggle };
