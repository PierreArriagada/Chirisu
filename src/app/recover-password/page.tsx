/**
 * ========================================
 * PÁGINA: Recuperar Contraseña
 * ========================================
 * Ruta: /recover-password
 * 
 * PROPÓSITO:
 * - Permitir recuperar contraseña con Recovery Code + A2F
 * - NO requiere email (sistema actual sin correo empresarial)
 * 
 * COMPONENTES:
 * - RecoverPasswordForm
 * 
 * FLUJO:
 * 1. Usuario ingresa recovery code
 * 2. Usuario ingresa código A2F
 * 3. Usuario establece nueva contraseña
 * 4. Recibe NUEVO recovery code
 * 5. Redirect a /login
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { RecoverPasswordForm } from '@/components/auth';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Recuperar Contraseña | Chirisu',
  description: 'Recupera tu contraseña usando tu recovery code y autenticación de 2 factores',
};

export default function RecoverPasswordPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Recuperar Contraseña</h1>
          <p className="text-muted-foreground">
            Usa tu recovery code y código A2F para restablecer tu contraseña
          </p>
        </div>

        {/* Formulario */}
        <RecoverPasswordForm />

        {/* Link a Login */}
        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            ¿Recordaste tu contraseña?{' '}
            <Link href="/login">
              <Button variant="link" className="px-0">
                Iniciar Sesión
              </Button>
            </Link>
          </p>
        </div>

        {/* Información */}
        <div className="mt-8 p-4 rounded-lg bg-muted/50 border">
          <h3 className="font-semibold mb-2">ℹ️ Información Importante</h3>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>
              <strong>Recovery Code:</strong> El código de 64 caracteres hexadecimales que recibiste al registrarte
            </li>
            <li>
              <strong>Código A2F:</strong> Puedes usar:
              <ul className="ml-4 mt-1 space-y-1">
                <li>• Tu app de autenticación (Google Authenticator, Authy, etc.) - código de 6 dígitos</li>
                <li>• Uno de tus códigos de respaldo (backup codes) guardados al registrarte</li>
              </ul>
            </li>
            <li>
              <strong>Importante:</strong> Después de restablecer recibirás un NUEVO recovery code. Guárdalo en un lugar seguro.
            </li>
            <li>
              <strong>Nota:</strong> Si usas un código de respaldo, este se eliminará automáticamente y no podrá ser usado nuevamente.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
