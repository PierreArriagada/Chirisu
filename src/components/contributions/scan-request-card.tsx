'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { 
  BookOpen, 
  Send, 
  Clock, 
  CheckCircle, 
  XCircle,
  Loader2,
  ExternalLink,
  Plus,
  X
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ScanRequest {
  id: number;
  groupName: string;
  groupUrl: string | null;
  experience: string;
  mediaTypes: string[];
  languages: string[];
  portfolioUrls: string[];
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason: string | null;
  createdAt: string;
}

const mediaTypeOptions = [
  { value: 'manga', label: 'Manga' },
  { value: 'manhwa', label: 'Manhwa' },
  { value: 'manhua', label: 'Manhua' },
  { value: 'novel', label: 'Novelas' },
  { value: 'fan_comic', label: 'Fan Comics' },
  { value: 'anime', label: 'Anime (Fansub)' },
  { value: 'donghua', label: 'Donghua' },
];

export function ScanRequestCard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [existingRequest, setExistingRequest] = useState<ScanRequest | null>(null);
  const [canApply, setCanApply] = useState(false);
  const [isScanlator, setIsScanlator] = useState(false);

  // Form state
  const [groupName, setGroupName] = useState('');
  const [groupUrl, setGroupUrl] = useState('');
  const [experience, setExperience] = useState('');
  const [selectedMediaTypes, setSelectedMediaTypes] = useState<string[]>(['manga']);
  const [portfolioUrls, setPortfolioUrls] = useState<string[]>(['']);

  useEffect(() => {
    checkStatus();
  }, []);

  async function checkStatus() {
    try {
      setLoading(true);
      
      // Verificar si ya es scanlator
      const roleResponse = await fetch('/api/auth/session');
      if (roleResponse.ok) {
        const sessionData = await roleResponse.json();
        if (sessionData.user?.roles?.includes('scan')) {
          setIsScanlator(true);
          setLoading(false);
          return;
        }
      }

      // Verificar solicitud existente
      const response = await fetch('/api/scan/requests');
      if (response.ok) {
        const data = await response.json();
        setExistingRequest(data.request);
        setCanApply(data.canApply);
      }
    } catch (error) {
      console.error('Error verificando estado:', error);
    } finally {
      setLoading(false);
    }
  }

  function addPortfolioUrl() {
    setPortfolioUrls([...portfolioUrls, '']);
  }

  function removePortfolioUrl(index: number) {
    setPortfolioUrls(portfolioUrls.filter((_, i) => i !== index));
  }

  function updatePortfolioUrl(index: number, value: string) {
    const updated = [...portfolioUrls];
    updated[index] = value;
    setPortfolioUrls(updated);
  }

  function toggleMediaType(type: string) {
    if (selectedMediaTypes.includes(type)) {
      setSelectedMediaTypes(selectedMediaTypes.filter(t => t !== type));
    } else {
      setSelectedMediaTypes([...selectedMediaTypes, type]);
    }
  }

  async function handleSubmit() {
    if (!groupName.trim()) {
      toast({ title: 'Error', description: 'Debes indicar el nombre de tu grupo', variant: 'destructive' });
      return;
    }
    if (experience.length < 50) {
      toast({ title: 'Error', description: 'La experiencia debe tener al menos 50 caracteres', variant: 'destructive' });
      return;
    }
    if (selectedMediaTypes.length === 0) {
      toast({ title: 'Error', description: 'Selecciona al menos un tipo de media', variant: 'destructive' });
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch('/api/scan/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupName: groupName.trim(),
          groupUrl: groupUrl.trim() || null,
          experience: experience.trim(),
          mediaTypes: selectedMediaTypes,
          languages: ['es'],
          portfolioUrls: portfolioUrls.filter(url => url.trim())
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar solicitud');
      }

      toast({
        title: '✅ Solicitud enviada',
        description: 'Un administrador revisará tu solicitud pronto.'
      });

      setDialogOpen(false);
      checkStatus();

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  }

  // Si ya es scanlator, mostrar mensaje
  if (!loading && isScanlator) {
    return (
      <Card className="border-purple-500/30 bg-purple-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700">
            <BookOpen className="h-5 w-5" />
            Eres Scanlator
          </CardTitle>
          <CardDescription>
            Ya tienes el rol de scanlator. Puedes gestionar tus proyectos de traducción.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <a href="/scan/projects">Ver mis proyectos</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Loading
  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  // Solicitud existente
  if (existingRequest) {
    return (
      <Card className={
        existingRequest.status === 'pending' ? 'border-yellow-500/30 bg-yellow-500/5' :
        existingRequest.status === 'approved' ? 'border-green-500/30 bg-green-500/5' :
        'border-red-500/30 bg-red-500/5'
      }>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Solicitud para Scanlator
            <Badge variant={
              existingRequest.status === 'pending' ? 'secondary' :
              existingRequest.status === 'approved' ? 'default' :
              'destructive'
            } className="ml-2">
              {existingRequest.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
              {existingRequest.status === 'approved' && <CheckCircle className="h-3 w-3 mr-1" />}
              {existingRequest.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
              {existingRequest.status === 'pending' ? 'Pendiente' :
               existingRequest.status === 'approved' ? 'Aprobada' : 'Rechazada'}
            </Badge>
          </CardTitle>
          <CardDescription>
            {existingRequest.status === 'pending' && 'Tu solicitud está siendo revisada por un administrador.'}
            {existingRequest.status === 'approved' && '¡Felicidades! Tu solicitud fue aprobada.'}
            {existingRequest.status === 'rejected' && 'Tu solicitud fue rechazada.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <span className="text-sm text-muted-foreground">Grupo:</span>
            <p className="font-medium">{existingRequest.groupName}</p>
          </div>
          
          <div>
            <span className="text-sm text-muted-foreground">Tipos de media:</span>
            <div className="flex gap-1 flex-wrap mt-1">
              {existingRequest.mediaTypes?.map(type => (
                <Badge key={type} variant="outline">{type}</Badge>
              ))}
            </div>
          </div>

          {existingRequest.status === 'rejected' && existingRequest.rejectionReason && (
            <div className="p-3 bg-red-500/10 rounded-lg">
              <span className="text-sm font-medium text-red-700">Razón del rechazo:</span>
              <p className="text-sm mt-1">{existingRequest.rejectionReason}</p>
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            Enviada el {new Date(existingRequest.createdAt).toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </div>
        </CardContent>

        {canApply && existingRequest.status === 'rejected' && (
          <CardFooter>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Send className="h-4 w-4 mr-2" />
                  Enviar nueva solicitud
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <ScanRequestForm
                  groupName={groupName}
                  setGroupName={setGroupName}
                  groupUrl={groupUrl}
                  setGroupUrl={setGroupUrl}
                  experience={experience}
                  setExperience={setExperience}
                  selectedMediaTypes={selectedMediaTypes}
                  toggleMediaType={toggleMediaType}
                  portfolioUrls={portfolioUrls}
                  addPortfolioUrl={addPortfolioUrl}
                  removePortfolioUrl={removePortfolioUrl}
                  updatePortfolioUrl={updatePortfolioUrl}
                  submitting={submitting}
                  onSubmit={handleSubmit}
                  onCancel={() => setDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </CardFooter>
        )}
      </Card>
    );
  }

  // Sin solicitud - Mostrar botón para aplicar
  return (
    <Card className="border-dashed border-purple-500/30 hover:border-purple-500/50 transition-colors">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-purple-600" />
          ¿Eres Scanlator o Fansubber?
        </CardTitle>
        <CardDescription>
          Si traduces manga, manhwa, novelas o haces fansubs de anime, solicita el rol de Scanlator 
          para gestionar tus proyectos de traducción y compartir tus capítulos con la comunidad.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="outline">Gestiona proyectos</Badge>
          <Badge variant="outline">Sube capítulos</Badge>
          <Badge variant="outline">Comparte tu trabajo</Badge>
          <Badge variant="outline">Página de perfil especial</Badge>
        </div>
      </CardContent>
      <CardFooter>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Send className="h-4 w-4 mr-2" />
              Solicitar rol de Scanlator
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <ScanRequestForm
              groupName={groupName}
              setGroupName={setGroupName}
              groupUrl={groupUrl}
              setGroupUrl={setGroupUrl}
              experience={experience}
              setExperience={setExperience}
              selectedMediaTypes={selectedMediaTypes}
              toggleMediaType={toggleMediaType}
              portfolioUrls={portfolioUrls}
              addPortfolioUrl={addPortfolioUrl}
              removePortfolioUrl={removePortfolioUrl}
              updatePortfolioUrl={updatePortfolioUrl}
              submitting={submitting}
              onSubmit={handleSubmit}
              onCancel={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}

// Formulario extraído como componente
function ScanRequestForm({
  groupName, setGroupName,
  groupUrl, setGroupUrl,
  experience, setExperience,
  selectedMediaTypes, toggleMediaType,
  portfolioUrls, addPortfolioUrl, removePortfolioUrl, updatePortfolioUrl,
  submitting, onSubmit, onCancel
}: {
  groupName: string;
  setGroupName: (v: string) => void;
  groupUrl: string;
  setGroupUrl: (v: string) => void;
  experience: string;
  setExperience: (v: string) => void;
  selectedMediaTypes: string[];
  toggleMediaType: (type: string) => void;
  portfolioUrls: string[];
  addPortfolioUrl: () => void;
  removePortfolioUrl: (index: number) => void;
  updatePortfolioUrl: (index: number, value: string) => void;
  submitting: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Solicitar rol de Scanlator</DialogTitle>
        <DialogDescription>
          Completa el formulario para solicitar acceso al sistema de scanlation.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="groupName">Nombre del grupo *</Label>
          <Input
            id="groupName"
            placeholder="Ej: MangaDex Scans, Fansub Latino, etc."
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="groupUrl">URL del grupo (opcional)</Label>
          <Input
            id="groupUrl"
            placeholder="https://tu-sitio.com o Discord, etc."
            value={groupUrl}
            onChange={(e) => setGroupUrl(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Tipos de media que traduces *</Label>
          <div className="flex flex-wrap gap-2">
            {mediaTypeOptions.map(option => (
              <div
                key={option.value}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                  selectedMediaTypes.includes(option.value)
                    ? 'bg-purple-500/20 border-purple-500'
                    : 'bg-muted/50 border-muted hover:border-purple-500/50'
                }`}
                onClick={() => toggleMediaType(option.value)}
              >
                <Checkbox
                  checked={selectedMediaTypes.includes(option.value)}
                  onCheckedChange={() => toggleMediaType(option.value)}
                />
                <span className="text-sm">{option.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="experience">Experiencia y motivación * (mínimo 50 caracteres)</Label>
          <Textarea
            id="experience"
            placeholder="Cuéntanos sobre tu experiencia traduciendo, cuánto tiempo llevas, qué proyectos has trabajado, por qué quieres unirte, etc."
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            {experience.length}/50 caracteres mínimo
          </p>
        </div>

        <div className="space-y-2">
          <Label>Links a trabajos previos (opcional)</Label>
          {portfolioUrls.map((url, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder="https://mangadex.org/title/..."
                value={url}
                onChange={(e) => updatePortfolioUrl(index, e.target.value)}
              />
              {portfolioUrls.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removePortfolioUrl(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addPortfolioUrl}>
            <Plus className="h-4 w-4 mr-1" />
            Agregar otro link
          </Button>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button 
          onClick={onSubmit} 
          disabled={submitting}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Enviar solicitud
        </Button>
      </DialogFooter>
    </>
  );
}

export default ScanRequestCard;
