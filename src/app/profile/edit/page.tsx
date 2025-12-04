'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Save, User, Shield, Globe, Camera, Mail, AtSign } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { ChangePasswordDialog } from '@/components/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// Lista de países comunes para selección
const COUNTRIES = [
  { code: '', name: 'No especificado', flag: '🌍' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'MX', name: 'México', flag: '🇲🇽' },
  { code: 'ES', name: 'España', flag: '🇪🇸' },
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸' },
  { code: 'BR', name: 'Brasil', flag: '🇧🇷' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
  { code: 'PE', name: 'Perú', flag: '🇵🇪' },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪' },
  { code: 'EC', name: 'Ecuador', flag: '🇪🇨' },
  { code: 'BO', name: 'Bolivia', flag: '🇧🇴' },
  { code: 'PY', name: 'Paraguay', flag: '🇵🇾' },
  { code: 'UY', name: 'Uruguay', flag: '🇺🇾' },
  { code: 'CR', name: 'Costa Rica', flag: '🇨🇷' },
  { code: 'PA', name: 'Panamá', flag: '🇵🇦' },
  { code: 'GT', name: 'Guatemala', flag: '🇬🇹' },
  { code: 'CU', name: 'Cuba', flag: '🇨🇺' },
  { code: 'DO', name: 'República Dominicana', flag: '🇩🇴' },
  { code: 'HN', name: 'Honduras', flag: '🇭🇳' },
  { code: 'NI', name: 'Nicaragua', flag: '🇳🇮' },
  { code: 'SV', name: 'El Salvador', flag: '🇸🇻' },
  { code: 'PR', name: 'Puerto Rico', flag: '🇵🇷' },
  { code: 'JP', name: 'Japón', flag: '🇯🇵' },
  { code: 'KR', name: 'Corea del Sur', flag: '🇰🇷' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'TW', name: 'Taiwán', flag: '🇹🇼' },
  { code: 'FR', name: 'Francia', flag: '🇫🇷' },
  { code: 'DE', name: 'Alemania', flag: '🇩🇪' },
  { code: 'IT', name: 'Italia', flag: '🇮🇹' },
  { code: 'GB', name: 'Reino Unido', flag: '🇬🇧' },
  { code: 'CA', name: 'Canadá', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'NL', name: 'Países Bajos', flag: '🇳🇱' },
  { code: 'BE', name: 'Bélgica', flag: '🇧🇪' },
  { code: 'CH', name: 'Suiza', flag: '🇨🇭' },
  { code: 'PL', name: 'Polonia', flag: '🇵🇱' },
  { code: 'SE', name: 'Suecia', flag: '🇸🇪' },
  { code: 'NO', name: 'Noruega', flag: '🇳🇴' },
  { code: 'FI', name: 'Finlandia', flag: '🇫🇮' },
  { code: 'DK', name: 'Dinamarca', flag: '🇩🇰' },
  { code: 'RU', name: 'Rusia', flag: '🇷🇺' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'PH', name: 'Filipinas', flag: '🇵🇭' },
  { code: 'TH', name: 'Tailandia', flag: '🇹🇭' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'MY', name: 'Malasia', flag: '🇲🇾' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
];

export default function EditProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [originalData, setOriginalData] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    display_name: '',
    avatar_url: '',
    bio: '',
    date_of_birth: '',
    nationality_code: '',
    locale: 'es-CL',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadProfile();
  }, [user, router]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/profile');
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Error al cargar el perfil');
      }

      const data = await response.json();
      
      // La API devuelve data.profile con campos en camelCase
      // Necesitamos mapear a snake_case para el formulario
      const profile = data.profile;
      
      if (!profile) {
        throw new Error('No se recibieron datos del perfil');
      }

      const formValues = {
        username: profile.username || '',
        email: profile.email || '',
        display_name: profile.displayName || '',
        avatar_url: profile.avatarUrl || '',
        bio: profile.bio || '',
        date_of_birth: profile.dateOfBirth || '',
        nationality_code: profile.nationalityCode || '',
        locale: profile.locale || 'es-CL',
      };

      setFormData(formValues);
      setOriginalData(formValues);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el perfil. Intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validar display_name (máximo 120 caracteres según schema)
    if (formData.display_name && formData.display_name.length > 120) {
      newErrors.display_name = 'El nombre debe tener máximo 120 caracteres';
    }

    // Validar bio (máximo 500 caracteres - aumentado para mejor UX)
    if (formData.bio && formData.bio.length > 500) {
      newErrors.bio = 'La biografía debe tener máximo 500 caracteres';
    }

    // Validar URL del avatar
    if (formData.avatar_url) {
      if (formData.avatar_url.length > 500) {
        newErrors.avatar_url = 'La URL del avatar es demasiado larga';
      } else {
        try {
          new URL(formData.avatar_url);
        } catch {
          newErrors.avatar_url = 'Por favor ingresa una URL válida';
        }
      }
    }

    // Validar fecha de nacimiento (no puede ser futura y debe tener al menos 13 años)
    if (formData.date_of_birth) {
      const birthDate = new Date(formData.date_of_birth);
      const today = new Date();
      const minAgeDate = new Date();
      minAgeDate.setFullYear(minAgeDate.getFullYear() - 13);
      
      if (birthDate > today) {
        newErrors.date_of_birth = 'La fecha de nacimiento no puede ser futura';
      } else if (birthDate > minAgeDate) {
        newErrors.date_of_birth = 'Debes tener al menos 13 años';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const hasChanges = (): boolean => {
    if (!originalData) return false;
    return Object.keys(formData).some(
      key => formData[key as keyof typeof formData] !== originalData[key]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: 'Error de validación',
        description: 'Por favor corrige los errores en el formulario',
        variant: 'destructive',
      });
      return;
    }

    if (!hasChanges()) {
      toast({
        title: 'Sin cambios',
        description: 'No hay cambios para guardar',
      });
      return;
    }

    try {
      setSaving(true);

      // Preparar datos para enviar (solo los campos que cambiaron)
      const updateData: Record<string, any> = {};
      
      if (formData.display_name !== originalData?.display_name) {
        updateData.display_name = formData.display_name || null;
      }
      if (formData.avatar_url !== originalData?.avatar_url) {
        updateData.avatar_url = formData.avatar_url || null;
      }
      if (formData.bio !== originalData?.bio) {
        updateData.bio = formData.bio || null;
      }
      if (formData.date_of_birth !== originalData?.date_of_birth) {
        updateData.date_of_birth = formData.date_of_birth || null;
      }
      if (formData.nationality_code !== originalData?.nationality_code) {
        const country = COUNTRIES.find(c => c.code === formData.nationality_code);
        if (country && country.code) {
          updateData.nationality_code = country.code;
          updateData.nationality_name = country.name;
          updateData.nationality_flag_url = `https://flagcdn.com/w80/${country.code.toLowerCase()}.png`;
        } else {
          updateData.nationality_code = null;
          updateData.nationality_name = null;
          updateData.nationality_flag_url = null;
        }
      }
      if (formData.locale !== originalData?.locale) {
        updateData.locale = formData.locale;
      }

      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al actualizar el perfil');
      }

      // Actualizar datos originales
      setOriginalData({ ...formData });
      
      // Refrescar contexto de usuario si está disponible
      if (refreshUser) {
        await refreshUser();
      }

      toast({
        title: '✅ Perfil actualizado',
        description: 'Tus cambios se han guardado correctamente',
      });

      // Redirigir al perfil después de 1.5 segundos
      setTimeout(() => {
        router.push('/profile');
      }, 1500);

    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo actualizar el perfil',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo al editar
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Cargando tu perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/profile')}
          className="mb-4 hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al perfil
        </Button>
        
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Editar Perfil</h1>
            <p className="text-muted-foreground mt-1">
              Actualiza tu información personal y preferencias
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Preview Card - Muestra cómo se ve el perfil */}
        <Card className="border-primary/20 bg-gradient-to-br from-background to-muted/30">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Vista Previa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 border-2 border-primary/20">
                <AvatarImage 
                  src={formData.avatar_url || undefined} 
                  alt={formData.display_name || formData.username} 
                />
                <AvatarFallback className="text-2xl bg-primary/10">
                  {(formData.display_name || formData.username || 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-xl font-semibold">
                  {formData.display_name || formData.username || 'Tu nombre'}
                </h3>
                <p className="text-muted-foreground text-sm flex items-center gap-1">
                  <AtSign className="h-3 w-3" />
                  {formData.username}
                </p>
                {formData.bio && (
                  <p className="text-sm mt-2 text-muted-foreground line-clamp-2">
                    {formData.bio}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información de la cuenta (solo lectura) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Información de Cuenta
            </CardTitle>
            <CardDescription>
              Esta información no puede ser modificada desde aquí
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Usuario</Label>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border">
                  <AtSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{formData.username}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Correo electrónico</Label>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{formData.email}</span>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    No editable
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información Básica */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información Pública
            </CardTitle>
            <CardDescription>
              Esta información será visible para otros usuarios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Nombre para mostrar */}
            <div className="space-y-2">
              <Label htmlFor="display_name" className="flex items-center justify-between">
                <span>Nombre para mostrar</span>
                <span className="text-muted-foreground text-xs font-normal">
                  {formData.display_name.length}/120
                </span>
              </Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => handleChange('display_name', e.target.value)}
                placeholder="¿Cómo quieres que te llamen?"
                maxLength={120}
                className="h-11"
              />
              {errors.display_name && (
                <p className="text-sm text-destructive">{errors.display_name}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Si lo dejas vacío, se usará tu nombre de usuario
              </p>
            </div>

            {/* Avatar URL */}
            <div className="space-y-2">
              <Label htmlFor="avatar_url">URL del Avatar</Label>
              <Input
                id="avatar_url"
                type="url"
                value={formData.avatar_url}
                onChange={(e) => handleChange('avatar_url', e.target.value)}
                placeholder="https://ejemplo.com/mi-avatar.jpg"
                maxLength={500}
                className="h-11"
              />
              {errors.avatar_url && (
                <p className="text-sm text-destructive">{errors.avatar_url}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Puedes usar imágenes de Imgur, Discord CDN, o cualquier URL pública
              </p>
            </div>

            {/* Biografía */}
            <div className="space-y-2">
              <Label htmlFor="bio" className="flex items-center justify-between">
                <span>Biografía</span>
                <span className="text-muted-foreground text-xs font-normal">
                  {formData.bio.length}/500
                </span>
              </Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
                placeholder="Cuéntanos sobre ti, tus animes favoritos, géneros que te gustan..."
                maxLength={500}
                rows={4}
                className="resize-none"
              />
              {errors.bio && (
                <p className="text-sm text-destructive">{errors.bio}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Información Personal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Información Personal
            </CardTitle>
            <CardDescription>
              Información adicional para personalizar tu experiencia
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Fecha de nacimiento */}
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Fecha de Nacimiento</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => handleChange('date_of_birth', e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="h-11"
                />
                {errors.date_of_birth && (
                  <p className="text-sm text-destructive">{errors.date_of_birth}</p>
                )}
              </div>

              {/* Nacionalidad */}
              <div className="space-y-2">
                <Label htmlFor="nationality">Nacionalidad</Label>
                <Select
                  value={formData.nationality_code}
                  onValueChange={(value) => handleChange('nationality_code', value)}
                >
                  <SelectTrigger id="nationality" className="h-11">
                    <SelectValue placeholder="Selecciona tu país" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country.code || 'none'} value={country.code || 'none'}>
                        <span className="flex items-center gap-2">
                          <span>{country.flag}</span>
                          <span>{country.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Idioma */}
            <div className="space-y-2">
              <Label htmlFor="locale">Idioma Preferido</Label>
              <Select
                value={formData.locale}
                onValueChange={(value) => handleChange('locale', value)}
              >
                <SelectTrigger id="locale" className="h-11 max-w-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="es-CL">🇨🇱 Español (Chile)</SelectItem>
                  <SelectItem value="es-ES">🇪🇸 Español (España)</SelectItem>
                  <SelectItem value="es-MX">🇲🇽 Español (México)</SelectItem>
                  <SelectItem value="es-AR">🇦🇷 Español (Argentina)</SelectItem>
                  <SelectItem value="en-US">🇺🇸 English (US)</SelectItem>
                  <SelectItem value="pt-BR">🇧🇷 Português (Brasil)</SelectItem>
                  <SelectItem value="ja-JP">🇯🇵 日本語</SelectItem>
                  <SelectItem value="ko-KR">🇰🇷 한국어</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Afecta el formato de fechas y la interfaz (cuando esté disponible)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Seguridad */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Seguridad
            </CardTitle>
            <CardDescription>
              Gestiona la seguridad de tu cuenta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
              <div>
                <p className="font-medium">Contraseña</p>
                <p className="text-sm text-muted-foreground">
                  Cambia tu contraseña para mantener tu cuenta segura
                </p>
              </div>
              <ChangePasswordDialog />
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-muted/30 p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">
            {hasChanges() 
              ? '⚠️ Tienes cambios sin guardar' 
              : '✅ No hay cambios pendientes'}
          </p>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/profile')}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={saving || !hasChanges()}
              className="min-w-[140px]"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar cambios
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
