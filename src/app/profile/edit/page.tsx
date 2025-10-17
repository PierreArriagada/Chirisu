'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { ChangePasswordDialog } from '@/components/change-password-dialog';

interface UserProfile {
  username: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  date_of_birth: string | null;
  nationality_code: string | null;
  nationality_name: string | null;
  nationality_flag_url: string | null;
  locale: string | null;
}

// Lista de países comunes para selección
const COUNTRIES = [
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
  { code: 'JP', name: 'Japón', flag: '🇯🇵' },
  { code: 'KR', name: 'Corea del Sur', flag: '🇰🇷' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'FR', name: 'Francia', flag: '🇫🇷' },
  { code: 'DE', name: 'Alemania', flag: '🇩🇪' },
  { code: 'IT', name: 'Italia', flag: '🇮🇹' },
  { code: 'GB', name: 'Reino Unido', flag: '🇬🇧' },
  { code: 'CA', name: 'Canadá', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
];

export default function EditProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
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
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/profile');
      
      if (!response.ok) {
        throw new Error('Error al cargar el perfil');
      }

      const data = await response.json();
      const profile = data.user;

      setFormData({
        display_name: profile.display_name || '',
        avatar_url: profile.avatar_url || '',
        bio: profile.bio || '',
        date_of_birth: profile.date_of_birth || '',
        nationality_code: profile.nationality_code || '',
        locale: profile.locale || 'es-CL',
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el perfil',
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

    // Validar bio (máximo 200 caracteres según schema)
    if (formData.bio && formData.bio.length > 200) {
      newErrors.bio = 'La biografía debe tener máximo 200 caracteres';
    }

    // Validar URL del avatar
    if (formData.avatar_url && formData.avatar_url.length > 500) {
      newErrors.avatar_url = 'La URL del avatar es demasiado larga';
    }

    // Validar fecha de nacimiento (no puede ser futura)
    if (formData.date_of_birth) {
      const birthDate = new Date(formData.date_of_birth);
      const today = new Date();
      if (birthDate > today) {
        newErrors.date_of_birth = 'La fecha de nacimiento no puede ser futura';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

    try {
      setSaving(true);

      // Preparar datos para enviar (solo los campos que cambiaron)
      const updateData: any = {};
      
      if (formData.display_name !== '') {
        updateData.display_name = formData.display_name;
      }
      if (formData.avatar_url !== '') {
        updateData.avatar_url = formData.avatar_url;
      }
      if (formData.bio !== '') {
        updateData.bio = formData.bio;
      }
      if (formData.date_of_birth !== '') {
        updateData.date_of_birth = formData.date_of_birth;
      }
      if (formData.nationality_code !== '') {
        const country = COUNTRIES.find(c => c.code === formData.nationality_code);
        if (country) {
          updateData.nationality_code = country.code;
          updateData.nationality_name = country.name;
          updateData.nationality_flag_url = `https://flagcdn.com/w80/${country.code.toLowerCase()}.png`;
        }
      }
      if (formData.locale !== '') {
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

      toast({
        title: 'Perfil actualizado',
        description: 'Tus cambios se han guardado correctamente',
      });

      // Redirigir al perfil después de 1 segundo
      setTimeout(() => {
        router.push('/profile');
      }, 1000);

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
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/profile')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al perfil
        </Button>
        <h1 className="text-3xl font-bold">Editar Perfil</h1>
        <p className="text-muted-foreground mt-2">
          Actualiza tu información personal y preferencias
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Información Básica */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
            <CardDescription>
              Información pública que otros usuarios pueden ver
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Nombre para mostrar */}
            <div className="space-y-2">
              <Label htmlFor="display_name">
                Nombre para mostrar
                <span className="text-muted-foreground text-sm ml-2">
                  ({formData.display_name.length}/120)
                </span>
              </Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => handleChange('display_name', e.target.value)}
                placeholder="Tu nombre público"
                maxLength={120}
              />
              {errors.display_name && (
                <p className="text-sm text-destructive">{errors.display_name}</p>
              )}
            </div>

            {/* Avatar URL */}
            <div className="space-y-2">
              <Label htmlFor="avatar_url">URL del Avatar</Label>
              <Input
                id="avatar_url"
                type="url"
                value={formData.avatar_url}
                onChange={(e) => handleChange('avatar_url', e.target.value)}
                placeholder="https://ejemplo.com/avatar.jpg"
                maxLength={500}
              />
              {errors.avatar_url && (
                <p className="text-sm text-destructive">{errors.avatar_url}</p>
              )}
              {formData.avatar_url && (
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground mb-2">Vista previa:</p>
                  <img
                    src={formData.avatar_url}
                    alt="Vista previa del avatar"
                    className="h-20 w-20 rounded-full object-cover border-2 border-border"
                    onError={(e) => {
                      e.currentTarget.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=default';
                    }}
                  />
                </div>
              )}
            </div>

            {/* Biografía */}
            <div className="space-y-2">
              <Label htmlFor="bio">
                Biografía
                <span className="text-muted-foreground text-sm ml-2">
                  ({formData.bio.length}/200)
                </span>
              </Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
                placeholder="Cuéntanos sobre ti..."
                maxLength={200}
                rows={4}
                className="resize-none"
              />
              {errors.bio && (
                <p className="text-sm text-destructive">{errors.bio}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Máximo 200 caracteres
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Información Personal */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Información Personal</CardTitle>
            <CardDescription>
              Información adicional para personalizar tu experiencia
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Fecha de nacimiento */}
            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Fecha de Nacimiento</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => handleChange('date_of_birth', e.target.value)}
                max={new Date().toISOString().split('T')[0]}
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
                <SelectTrigger id="nationality">
                  <SelectValue placeholder="Selecciona tu país" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.flag} {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Idioma */}
            <div className="space-y-2">
              <Label htmlFor="locale">Idioma Preferido</Label>
              <Select
                value={formData.locale}
                onValueChange={(value) => handleChange('locale', value)}
              >
                <SelectTrigger id="locale">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="es-CL">Español (Chile)</SelectItem>
                  <SelectItem value="es-ES">Español (España)</SelectItem>
                  <SelectItem value="es-MX">Español (México)</SelectItem>
                  <SelectItem value="es-AR">Español (Argentina)</SelectItem>
                  <SelectItem value="en-US">English (US)</SelectItem>
                  <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                  <SelectItem value="ja-JP">日本語</SelectItem>
                  <SelectItem value="ko-KR">한국어</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Seguridad */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Seguridad</CardTitle>
            <CardDescription>
              Gestiona la seguridad de tu cuenta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Contraseña</p>
                  <p className="text-sm text-muted-foreground">
                    Última actualización: hace tiempo
                  </p>
                </div>
                <ChangePasswordDialog />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botones de acción */}
        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/profile')}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
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
      </form>
    </div>
  );
}
