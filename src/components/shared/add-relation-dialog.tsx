"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2 } from "lucide-react";

interface AddRelationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceType: string;
  sourceId: number;
  onRelationAdded: () => void;
}

export function AddRelationDialog({
  open,
  onOpenChange,
  sourceType,
  sourceId,
  onRelationAdded,
}: AddRelationDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [relationType, setRelationType] = useState<string>("sequel");
  const [adding, setAdding] = useState(false);

  const searchMedia = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(
        `/api/admin/search-media?q=${encodeURIComponent(query)}&type=all`
      );
      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (error) {
      console.error("Error searching:", error);
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = () => {
    searchMedia(searchQuery);
  };

  const handleAddRelation = async () => {
    if (!selectedMedia) return;

    setAdding(true);
    try {
      const response = await fetch(
        `/api/admin/media/${sourceType}/${sourceId}/relations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            target_type: selectedMedia.type,
            target_id: selectedMedia.id,
            relation_type: relationType,
          }),
        }
      );

      if (response.ok) {
        onRelationAdded();
        onOpenChange(false);
        setSearchQuery("");
        setSearchResults([]);
        setSelectedMedia(null);
      } else {
        const error = await response.json();
        alert(error.error || "Error al agregar relación");
      }
    } catch (error) {
      console.error("Error adding relation:", error);
      alert("Error al agregar relación");
    } finally {
      setAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar Relación</DialogTitle>
          <DialogDescription>
            Busca y selecciona un contenido para relacionar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tipo de relación */}
          <div className="space-y-2">
            <Label htmlFor="relation-type">Tipo de Relación</Label>
            <select
              id="relation-type"
              value={relationType}
              onChange={(e) => setRelationType(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <optgroup label="📺 Continuidad">
                <option value="sequel">Secuela (continuación directa)</option>
                <option value="prequel">Precuela (eventos anteriores)</option>
              </optgroup>
              
              <optgroup label="📖 Adaptaciones">
                <option value="adaptation">Adaptación (basado en...)</option>
                <option value="source">Material Fuente (original)</option>
              </optgroup>
              
              <optgroup label="🔄 Derivados">
                <option value="side_story">Historia Paralela</option>
                <option value="spin_off">Spin-off</option>
                <option value="alternative">Versión Alternativa (remake)</option>
              </optgroup>
              
              <optgroup label="🎬 Contenido Especial">
                <option value="special">Episodio Especial</option>
                <option value="ova">OVA (Original Video Animation)</option>
                <option value="ona">ONA (Original Net Animation)</option>
                <option value="movie">Película</option>
              </optgroup>
              
              <optgroup label="📚 Expansiones">
                <option value="summary">Resumen/Compilación</option>
                <option value="full_story">Historia Completa</option>
              </optgroup>
              
              <optgroup label="🔗 Otras">
                <option value="parent_story">Historia Principal</option>
                <option value="character">Comparten Personajes</option>
                <option value="other">Otra Relación</option>
              </optgroup>
            </select>
          </div>

          {/* Búsqueda */}
          <div className="space-y-2">
            <Label htmlFor="search">Buscar Contenido</Label>
            <div className="flex gap-2">
              <Input
                id="search"
                placeholder="Buscar por título..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
              />
              <Button
                onClick={handleSearch}
                disabled={searching || searchQuery.length < 2}
              >
                {searching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Resultados de búsqueda */}
          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-[300px] overflow-y-auto border rounded-lg p-2">
              <Label className="text-sm">Resultados ({searchResults.length})</Label>
              {searchResults.map((result) => (
                <div
                  key={`${result.type}-${result.id}`}
                  className={`p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors ${
                    selectedMedia?.id === result.id && selectedMedia?.type === result.type
                      ? "bg-accent border-primary"
                      : ""
                  }`}
                  onClick={() => setSelectedMedia(result)}
                >
                  <div className="flex items-start gap-3">
                    {result.cover_image_url && (
                      <img
                        src={result.cover_image_url}
                        alt={result.title_romaji || result.title_spanish}
                        className="w-12 h-16 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">
                          {result.type === 'anime' && '🎬 Anime'}
                          {result.type === 'manga' && '📚 Manga'}
                          {result.type === 'novels' && '📖 Novela'}
                          {result.type === 'donghua' && '🎨 Donghua'}
                          {result.type === 'manhua' && '🖼️ Manhua'}
                          {result.type === 'manhwa' && '📱 Manhwa'}
                          {result.type === 'fan_comic' && '✏️ Fan Comic'}
                        </Badge>
                        {result.year && (
                          <span className="text-xs text-muted-foreground">
                            {result.year}
                          </span>
                        )}
                      </div>
                      <h4 className="font-semibold">
                        {result.title_romaji || result.title_spanish || result.title_english}
                      </h4>
                      {result.title_native && (
                        <p className="text-sm text-muted-foreground">
                          {result.title_native}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Contenido seleccionado */}
          {selectedMedia && (
            <div className="p-4 border rounded-lg bg-accent">
              <Label className="text-sm mb-2 block">Seleccionado:</Label>
              <div className="flex items-center gap-2">
                <Badge>
                  {selectedMedia.type === 'anime' && '🎬 Anime'}
                  {selectedMedia.type === 'manga' && '📚 Manga'}
                  {selectedMedia.type === 'novels' && '📖 Novela'}
                  {selectedMedia.type === 'donghua' && '🎨 Donghua'}
                  {selectedMedia.type === 'manhua' && '🖼️ Manhua'}
                  {selectedMedia.type === 'manhwa' && '📱 Manhwa'}
                  {selectedMedia.type === 'fan_comic' && '✏️ Fan Comic'}
                </Badge>
                <span className="font-semibold">
                  {selectedMedia.title_romaji || selectedMedia.title_spanish}
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={adding}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleAddRelation}
            disabled={!selectedMedia || adding}
          >
            {adding ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Agregando...
              </>
            ) : (
              "Agregar Relación"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
