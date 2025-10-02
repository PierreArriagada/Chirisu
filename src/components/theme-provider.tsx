/**
 * @fileoverview ThemeProvider - Proveedor de contexto para la gestión de temas.
 * 
 * Este componente es un contenedor (wrapper) sobre `next-themes`, una librería popular
 * para gestionar temas en aplicaciones Next.js.
 * Permite que cualquier componente hijo pueda acceder al estado del tema actual
 * (claro, oscuro, de sistema, o dinámico) y cambiarlo. Se configura en el
 * `layout.tsx` principal para dar cobertura a toda la aplicación.
 */

"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
