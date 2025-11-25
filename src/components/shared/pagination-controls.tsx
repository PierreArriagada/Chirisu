/**
 * @fileoverview PaginationControls - Componente de paginación con botones numéricos
 * 
 * Muestra botones de navegación: Anterior, 1, 2, 3, 4..., Siguiente
 * Con lógica inteligente para mostrar solo páginas relevantes (no mostrar 1-100)
 */

'use client';

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function PaginationControls({
  currentPage,
  totalPages,
  onPageChange
}: PaginationControlsProps) {
  
  // No mostrar paginación si solo hay 1 página
  if (totalPages <= 1) return null;

  // Calcular rango de páginas a mostrar
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7; // Máximo de botones numéricos visibles

    if (totalPages <= maxVisible) {
      // Mostrar todas las páginas si son pocas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Lógica inteligente para páginas grandes
      // Siempre mostrar: 1, ..., páginas cercanas, ..., última

      pages.push(1); // Primera página siempre visible

      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      // Ajustar si estamos cerca del inicio
      if (currentPage <= 3) {
        start = 2;
        end = 5;
      }

      // Ajustar si estamos cerca del final
      if (currentPage >= totalPages - 2) {
        start = totalPages - 4;
        end = totalPages - 1;
      }

      // Agregar "..." si hay gap
      if (start > 2) {
        pages.push('...');
      }

      // Páginas intermedias
      for (let i = start; i <= end; i++) {
        if (i > 1 && i < totalPages) {
          pages.push(i);
        }
      }

      // Agregar "..." si hay gap al final
      if (end < totalPages - 1) {
        pages.push('...');
      }

      pages.push(totalPages); // Última página siempre visible
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center justify-center gap-1 my-8">
      {/* Botón Anterior */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="h-9 w-9"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Botones numéricos */}
      {pageNumbers.map((page, index) => (
        typeof page === 'number' ? (
          <Button
            key={index}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(page)}
            className="h-9 min-w-[36px]"
          >
            {page}
          </Button>
        ) : (
          <span key={index} className="px-2 text-muted-foreground">
            {page}
          </span>
        )
      ))}

      {/* Botón Siguiente */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="h-9 w-9"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
