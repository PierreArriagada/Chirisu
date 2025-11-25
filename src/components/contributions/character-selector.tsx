/**
 * ========================================
 * COMPONENTE: SELECTOR DE PERSONAJES
 * ========================================
 * Permite buscar personajes existentes o crear nuevos
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Plus, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Character {
  id: number;
  name: string;
  nameRomaji?: string;
  nameNative?: string;
  imageUrl?: string;
  role: 'main' | 'supporting';
  voiceActors?: {
    japanese?: { id: number; name: string; };
    spanish?: { id: number; name: string; };
  };
}

interface CharacterSelectorProps {
  selectedCharacters: Character[];
  onChange: (characters: Character[]) => void;
}

export function CharacterSelector({ selectedCharacters, onChange }: CharacterSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [newCharacterName, setNewCharacterName] = useState('');
  const [newCharacterNameRomaji, setNewCharacterNameRomaji] = useState('');
  const [newCharacterNameNative, setNewCharacterNameNative] = useState('');
  const [selectedRole, setSelectedRole] = useState<'main' | 'supporting'>('supporting');
  
  // Estados para voice actors
  const [voiceActorSearchJP, setVoiceActorSearchJP] = useState('');
  const [voiceActorSearchES, setVoiceActorSearchES] = useState('');
  const [voiceActorResultsJP, setVoiceActorResultsJP] = useState<any[]>([]);
  const [voiceActorResultsES, setVoiceActorResultsES] = useState<any[]>([]);
  const [editingCharacterId, setEditingCharacterId] = useState<number | null>(null);
  
  const { toast } = useToast();

  // Buscar personajes
  useEffect(() => {
    const searchCharacters = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(`/api/characters?search=${encodeURIComponent(searchQuery)}&limit=20`);
        const data = await response.json();
        
        if (data.characters) {
          setSearchResults(data.characters || []);
        }
      } catch (error) {
        console.error('Error al buscar personajes:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchCharacters, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  // Buscar voice actors (japonés)
  useEffect(() => {
    const searchVoiceActors = async () => {
      if (voiceActorSearchJP.length < 2) {
        setVoiceActorResultsJP([]);
        return;
      }

      try {
        const response = await fetch(`/api/voice-actors?search=${encodeURIComponent(voiceActorSearchJP)}&language=japanese&limit=10`);
        const data = await response.json();
        setVoiceActorResultsJP(data.voiceActors || []);
      } catch (error) {
        console.error('Error al buscar voice actors:', error);
      }
    };

    const debounce = setTimeout(searchVoiceActors, 300);
    return () => clearTimeout(debounce);
  }, [voiceActorSearchJP]);

  // Buscar voice actors (español)
  useEffect(() => {
    const searchVoiceActors = async () => {
      if (voiceActorSearchES.length < 2) {
        setVoiceActorResultsES([]);
        return;
      }

      try {
        const response = await fetch(`/api/voice-actors?search=${encodeURIComponent(voiceActorSearchES)}&language=spanish&limit=10`);
        const data = await response.json();
        setVoiceActorResultsES(data.voiceActors || []);
      } catch (error) {
        console.error('Error al buscar voice actors:', error);
      }
    };

    const debounce = setTimeout(searchVoiceActors, 300);
    return () => clearTimeout(debounce);
  }, [voiceActorSearchES]);

  const addCharacter = (character: any, role: 'main' | 'supporting') => {
    // Verificar si ya está agregado
    if (selectedCharacters.find(c => c.id === character.id)) {
      toast({
        title: 'Ya agregado',
        description: 'Este personaje ya está en la lista',
        variant: 'destructive',
      });
      return;
    }

    onChange([...selectedCharacters, { ...character, role }]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const createNewCharacter = async () => {
    if (!newCharacterName.trim()) {
      toast({
        title: 'Error',
        description: 'El nombre del personaje es requerido',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCharacterName.trim(),
          nameRomaji: newCharacterNameRomaji.trim() || null,
          nameNative: newCharacterNameNative.trim() || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        addCharacter(data.character, selectedRole);
        setNewCharacterName('');
        setNewCharacterNameRomaji('');
        setNewCharacterNameNative('');
        toast({
          title: 'Personaje agregado',
          description: data.message,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo crear el personaje',
        variant: 'destructive',
      });
    }
  };

  const removeCharacter = (id: number) => {
    onChange(selectedCharacters.filter(c => c.id !== id));
  };

  const toggleRole = (id: number) => {
    onChange(
      selectedCharacters.map(c =>
        c.id === id
          ? { ...c, role: c.role === 'main' ? 'supporting' : 'main' as 'main' | 'supporting' }
          : c
      )
    );
  };

  const addVoiceActor = (characterId: number, voiceActor: any, language: 'japanese' | 'spanish') => {
    onChange(
      selectedCharacters.map(c =>
        c.id === characterId
          ? {
              ...c,
              voiceActors: {
                ...c.voiceActors,
                [language]: { id: voiceActor.id, name: voiceActor.name }
              }
            }
          : c
      )
    );
    
    // Limpiar búsqueda
    if (language === 'japanese') {
      setVoiceActorSearchJP('');
      setVoiceActorResultsJP([]);
    } else {
      setVoiceActorSearchES('');
      setVoiceActorResultsES([]);
    }
    
    toast({
      title: 'Actor de voz agregado',
      description: `${voiceActor.name} (${language === 'japanese' ? 'Japonés' : 'Español'})`,
    });
  };

  const createNewVoiceActor = async (characterId: number, name: string, language: 'japanese' | 'spanish') => {
    if (!name.trim()) {
      toast({
        title: 'Error',
        description: 'El nombre del actor de voz no puede estar vacío',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/voice-actors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nameNative: name,
          nameRomaji: name,
          language: language,
        }),
      });

      if (!response.ok) throw new Error('Error al crear voice actor');

      const data = await response.json();
      
      // Agregar el nuevo voice actor al personaje
      addVoiceActor(characterId, { id: data.id, name: data.name }, language);
      
      toast({
        title: 'Actor de voz creado',
        description: `${name} ha sido agregado exitosamente`,
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear el actor de voz',
        variant: 'destructive',
      });
    }
  };

  const removeVoiceActor = (characterId: number, language: 'japanese' | 'spanish') => {
    onChange(
      selectedCharacters.map(c =>
        c.id === characterId
          ? {
              ...c,
              voiceActors: {
                ...c.voiceActors,
                [language]: undefined
              }
            }
          : c
      )
    );
  };

  return (
    <div className="space-y-4">
      {/* Búsqueda */}
      <div className="relative">
        <Label>Buscar Personaje</Label>
        <div className="relative mt-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Resultados de búsqueda */}
        {searchResults.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-y-auto">
            {searchResults.map((character) => (
              <div key={character.id} className="p-3 hover:bg-accent">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{character.name}</p>
                  </div>
                </div>
                <div className="mt-2 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addCharacter(character, 'supporting')}
                  >
                    Secundario
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => addCharacter(character, 'main')}
                  >
                    Principal
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Crear nuevo personaje */}
      <div className="space-y-2">
        <Label>O Crear Nuevo Personaje</Label>
        <Input
          placeholder="Nombre"
          value={newCharacterName}
          onChange={(e) => setNewCharacterName(e.target.value)}
        />
        <Input
          placeholder="Nombre Romaji (Opcional)"
          value={newCharacterNameRomaji}
          onChange={(e) => setNewCharacterNameRomaji(e.target.value)}
        />
        <Input
          placeholder="Nombre Nativo (Opcional)"
          value={newCharacterNameNative}
          onChange={(e) => setNewCharacterNameNative(e.target.value)}
        />
        <div className="flex gap-2">
          <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as 'main' | 'supporting')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="main">Principal</SelectItem>
              <SelectItem value="supporting">Secundario</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={createNewCharacter} type="button">
            <Plus className="h-4 w-4 mr-2" />
            Crear
          </Button>
        </div>
      </div>

      {/* Personajes seleccionados */}
      {selectedCharacters.length > 0 && (
        <div>
          <Label>Personajes Seleccionados</Label>
          <div className="mt-2 space-y-3">
            {selectedCharacters.map((character) => (
              <div key={character.id} className="p-3 border rounded-md space-y-3">
                {/* Header del personaje */}
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{character.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {character.role === 'main' ? '⭐ Principal' : '🎭 Secundario'}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => toggleRole(character.id)}
                  >
                    Cambiar Rol
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCharacter(character.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Sección de Voice Actors */}
                <div className="space-y-2 pl-4 border-l-2">
                  <Label className="text-xs">Actores de Voz</Label>
                  
                  {/* Voice Actor Japonés */}
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">🇯🇵 Japonés</p>
                    {character.voiceActors?.japanese ? (
                      <div className="flex items-center gap-2 text-sm bg-muted p-2 rounded">
                        <span className="flex-1">{character.voiceActors.japanese.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeVoiceActor(character.id, 'japanese')}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="relative">
                        <Input
                          placeholder="Buscar seiyuu..."
                          value={editingCharacterId === character.id ? voiceActorSearchJP : ''}
                          onFocus={() => setEditingCharacterId(character.id)}
                          onChange={(e) => setVoiceActorSearchJP(e.target.value)}
                          className="text-sm"
                        />
                        {editingCharacterId === character.id && voiceActorSearchJP.length >= 2 && (
                          <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto">
                            {voiceActorResultsJP.length > 0 ? (
                              voiceActorResultsJP.map((va) => (
                                <div
                                  key={va.id}
                                  className="p-2 hover:bg-accent cursor-pointer text-sm"
                                  onClick={() => addVoiceActor(character.id, va, 'japanese')}
                                >
                                  {va.name}
                                </div>
                              ))
                            ) : (
                              <div className="p-2">
                                <p className="text-xs text-muted-foreground mb-2">No se encontró "{voiceActorSearchJP}"</p>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="w-full"
                                  onClick={() => createNewVoiceActor(character.id, voiceActorSearchJP, 'japanese')}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Crear "{voiceActorSearchJP}"
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Voice Actor Español */}
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">🇪🇸 Español</p>
                    {character.voiceActors?.spanish ? (
                      <div className="flex items-center gap-2 text-sm bg-muted p-2 rounded">
                        <span className="flex-1">{character.voiceActors.spanish.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeVoiceActor(character.id, 'spanish')}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="relative">
                        <Input
                          placeholder="Buscar doblador..."
                          value={editingCharacterId === character.id ? voiceActorSearchES : ''}
                          onFocus={() => setEditingCharacterId(character.id)}
                          onChange={(e) => setVoiceActorSearchES(e.target.value)}
                          className="text-sm"
                        />
                        {editingCharacterId === character.id && voiceActorSearchES.length >= 2 && (
                          <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto">
                            {voiceActorResultsES.length > 0 ? (
                              voiceActorResultsES.map((va) => (
                                <div
                                  key={va.id}
                                  className="p-2 hover:bg-accent cursor-pointer text-sm"
                                  onClick={() => addVoiceActor(character.id, va, 'spanish')}
                                >
                                  {va.name}
                                </div>
                              ))
                            ) : (
                              <div className="p-2">
                                <p className="text-xs text-muted-foreground mb-2">No se encontró "{voiceActorSearchES}"</p>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="w-full"
                                  onClick={() => createNewVoiceActor(character.id, voiceActorSearchES, 'spanish')}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Crear "{voiceActorSearchES}"
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
