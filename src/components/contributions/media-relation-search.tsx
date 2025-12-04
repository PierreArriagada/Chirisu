"use client";

import * as React from "react";
import { useState, useCallback, useEffect, useRef } from "react";
import { Check, ChevronsUpDown, Search, Plus, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { useDebounce } from "@/hooks/use-debounce";

// Tipos de media disponibles
const MEDIA_TYPES = [
    { value: "anime", label: "Anime" },
    { value: "donghua", label: "Donghua" },
    { value: "manga", label: "Manga" },
    { value: "manhwa", label: "Manhwa" },
    { value: "manhua", label: "Manhua" },
    { value: "novel", label: "Novela" },
    { value: "fan_comic", label: "Fan Comic" },
] as const;

type MediaType = (typeof MEDIA_TYPES)[number]["value"];

interface SearchResult {
    id: string;
    slug: string;
    title: string;
    titleEnglish?: string;
    imageUrl?: string;
    type: MediaType;
    rating?: number;
}

export interface SelectedMedia {
    // Si es media existente
    existingMediaId?: number;
    existingMediaType?: MediaType;
    existingMediaTitle?: string;
    existingMediaSlug?: string;
    existingMediaImage?: string;
    // Si es propuesta nueva
    isNewProposal?: boolean;
    newProposalTitle?: string;
    newProposalMediaType?: MediaType;
}

interface MediaRelationSearchProps {
    value: SelectedMedia | null;
    onChange: (value: SelectedMedia | null) => void;
    placeholder?: string;
    disabled?: boolean;
}

export function MediaRelationSearch({
    value,
    onChange,
    placeholder = "Buscar obra relacionada...",
    disabled = false,
}: MediaRelationSearchProps) {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showNewProposalForm, setShowNewProposalForm] = useState(false);
    const [newProposalType, setNewProposalType] = useState<MediaType>("anime");

    const debouncedSearch = useDebounce(searchQuery, 300);

    // Buscar media cuando cambia el query
    useEffect(() => {
        const fetchResults = async () => {
            if (debouncedSearch.length < 2) {
                setResults([]);
                return;
            }

            setIsLoading(true);
            try {
                const response = await fetch(
                    `/api/search?q=${encodeURIComponent(debouncedSearch)}&type=all&limit=10`
                );
                const data = await response.json();

                if (data.success) {
                    setResults(data.results);
                }
            } catch (error) {
                console.error("Error buscando media:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchResults();
    }, [debouncedSearch]);

    // Seleccionar una media existente
    const handleSelectExisting = (result: SearchResult) => {
        onChange({
            existingMediaId: parseInt(result.id),
            existingMediaType: result.type,
            existingMediaTitle: result.title,
            existingMediaSlug: result.slug,
            existingMediaImage: result.imageUrl,
            isNewProposal: false,
        });
        setOpen(false);
        setSearchQuery("");
        setShowNewProposalForm(false);
    };

    // Confirmar propuesta de nueva media
    const handleConfirmNewProposal = () => {
        if (searchQuery.trim().length < 2) return;

        onChange({
            isNewProposal: true,
            newProposalTitle: searchQuery.trim(),
            newProposalMediaType: newProposalType,
        });
        setOpen(false);
        setSearchQuery("");
        setShowNewProposalForm(false);
    };

    // Limpiar selección
    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(null);
        setSearchQuery("");
    };

    // Obtener label del tipo de media
    const getMediaTypeLabel = (type: MediaType) => {
        return MEDIA_TYPES.find((t) => t.value === type)?.label || type;
    };

    // Render del valor seleccionado
    const renderSelectedValue = () => {
        if (!value) {
            return <span className="text-muted-foreground">{placeholder}</span>;
        }

        if (value.isNewProposal) {
            return (
                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-amber-500/20 text-amber-600">
                        <Plus className="h-3 w-3 mr-1" />
                        Nueva
                    </Badge>
                    <span className="truncate">{value.newProposalTitle}</span>
                    <Badge variant="outline" className="text-xs">
                        {getMediaTypeLabel(value.newProposalMediaType!)}
                    </Badge>
                </div>
            );
        }

        return (
            <div className="flex items-center gap-2">
                {value.existingMediaImage && (
                    <Image
                        src={value.existingMediaImage}
                        alt=""
                        width={24}
                        height={32}
                        className="rounded object-cover"
                    />
                )}
                <span className="truncate">{value.existingMediaTitle}</span>
                <Badge variant="outline" className="text-xs">
                    {getMediaTypeLabel(value.existingMediaType!)}
                </Badge>
            </div>
        );
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between h-auto min-h-10 py-2"
                    disabled={disabled}
                >
                    <div className="flex-1 text-left">{renderSelectedValue()}</div>
                    <div className="flex items-center gap-1 ml-2">
                        {value && (
                            <X
                                className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer"
                                onClick={handleClear}
                            />
                        )}
                        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                    </div>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
                <Command shouldFilter={false}>
                    <div className="flex items-center border-b px-3">
                        <Search className="h-4 w-4 shrink-0 opacity-50" />
                        <input
                            type="text"
                            placeholder="Buscar por título..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex h-11 w-full bg-transparent py-3 px-2 text-sm outline-none placeholder:text-muted-foreground"
                        />
                        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    </div>
                    <CommandList>
                        {/* Resultados de búsqueda */}
                        {results.length > 0 && (
                            <CommandGroup heading="Obras existentes">
                                {results.map((result) => (
                                    <CommandItem
                                        key={`${result.type}-${result.id}`}
                                        onSelect={() => handleSelectExisting(result)}
                                        className="flex items-center gap-3 py-2 cursor-pointer"
                                    >
                                        {result.imageUrl ? (
                                            <Image
                                                src={result.imageUrl}
                                                alt=""
                                                width={32}
                                                height={45}
                                                className="rounded object-cover"
                                            />
                                        ) : (
                                            <div className="w-8 h-[45px] bg-muted rounded flex items-center justify-center">
                                                <Search className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {result.title}
                                            </p>
                                            {result.titleEnglish &&
                                                result.titleEnglish !== result.title && (
                                                    <p className="text-xs text-muted-foreground truncate">
                                                        {result.titleEnglish}
                                                    </p>
                                                )}
                                        </div>
                                        <Badge variant="secondary" className="text-xs shrink-0">
                                            {getMediaTypeLabel(result.type)}
                                        </Badge>
                                        {result.rating && result.rating > 0 && (
                                            <span className="text-xs text-muted-foreground">
                                                ⭐ {result.rating.toFixed(1)}
                                            </span>
                                        )}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}

                        {/* Mensaje cuando no hay resultados */}
                        {searchQuery.length >= 2 && !isLoading && results.length === 0 && (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                No se encontraron obras con &quot;{searchQuery}&quot;
                            </div>
                        )}

                        {/* Mensaje cuando el query es muy corto */}
                        {searchQuery.length > 0 && searchQuery.length < 2 && (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                Escribe al menos 2 caracteres para buscar
                            </div>
                        )}

                        {/* Opción para proponer nueva obra */}
                        {searchQuery.length >= 2 && (
                            <>
                                <CommandSeparator />
                                <CommandGroup heading="¿No encuentras la obra?">
                                    {!showNewProposalForm ? (
                                        <CommandItem
                                            onSelect={() => setShowNewProposalForm(true)}
                                            className="flex items-center gap-2 py-2 cursor-pointer"
                                        >
                                            <Plus className="h-4 w-4 text-amber-500" />
                                            <span>
                                                Proponer agregar &quot;{searchQuery}&quot;
                                            </span>
                                        </CommandItem>
                                    ) : (
                                        <div className="p-3 space-y-3">
                                            <p className="text-sm text-muted-foreground">
                                                Se creará una contribución pendiente para agregar
                                                esta obra. La relación se establecerá cuando sea
                                                aprobada.
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {MEDIA_TYPES.map((type) => (
                                                    <Button
                                                        key={type.value}
                                                        type="button"
                                                        size="sm"
                                                        variant={
                                                            newProposalType === type.value
                                                                ? "default"
                                                                : "outline"
                                                        }
                                                        onClick={() =>
                                                            setNewProposalType(type.value)
                                                        }
                                                    >
                                                        {type.label}
                                                    </Button>
                                                ))}
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    className="flex-1"
                                                    onClick={handleConfirmNewProposal}
                                                >
                                                    <Plus className="h-4 w-4 mr-1" />
                                                    Proponer &quot;{searchQuery}&quot; como{" "}
                                                    {getMediaTypeLabel(newProposalType)}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setShowNewProposalForm(false)}
                                                >
                                                    Cancelar
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </CommandGroup>
                            </>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
