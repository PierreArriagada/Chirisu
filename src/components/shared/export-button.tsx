'use client';

/**
 * @fileoverview ExportButton - Botón para exportar listas del usuario
 * 
 * Permite descargar todas las listas en formato CSV
 * Incluye: favoritos, listas por defecto, y listas personalizadas
 */

import { useState } from 'react';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

export function ExportButton() {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async (format: 'csv' | 'json') => {
    setIsExporting(true);

    try {
      const response = await fetch(`/api/user/export?format=${format}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Error al exportar datos');
      }

      if (format === 'csv') {
        // Descargar CSV
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chirisu-mis-listas-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: 'Exportación exitosa',
          description: 'Tus listas se han descargado en formato CSV',
        });
      } else {
        // Descargar JSON (para Excel/importar)
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chirisu-mis-listas-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: 'Exportación exitosa',
          description: `Se exportaron ${data.totalItems} items en formato JSON`,
        });
      }
    } catch (error) {
      console.error('Error al exportar:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron exportar tus listas. Intenta de nuevo.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isExporting}
          className="gap-2"
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Exportando...</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Exportar Listas</span>
              <span className="sm:hidden">Exportar</span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Formato de exportación</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          <div className="flex flex-col">
            <span>CSV (Excel)</span>
            <span className="text-xs text-muted-foreground">
              Compatible con Excel, Google Sheets
            </span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('json')}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          <div className="flex flex-col">
            <span>JSON</span>
            <span className="text-xs text-muted-foreground">
              Datos estructurados para importar
            </span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
