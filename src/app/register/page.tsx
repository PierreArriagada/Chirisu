/**
 * ========================================
 * PÁGINA: Registro de Usuario
 * ========================================
 * Ruta: /register
 * 
 * PROPÓSITO:
 * - Permitir registro de nuevos usuarios
 * - A2F OBLIGATORIO durante el registro
 * - Proceso de 3 pasos integrado
 * 
 * COMPONENTES:
 * - RegisterForm (src/components/auth/register-form.tsx)
 * 
 * FLUJO:
 * 1. Usuario completa formulario
 * 2. Se genera A2F automáticamente
 * 3. Usuario escanea QR y guarda códigos
 * 4. Verifica código de 6 dígitos
 * 5. Cuenta activada → Redirect a /profile
 * 
 * CONEXIONES:
 * - POST /api/auth/register
 * - POST /api/auth/verify-registration
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { RegisterForm } from '@/components/auth';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Crear Cuenta | Chirisu',
  description: 'Crea tu cuenta en Chirisu con autenticación de 2 factores',
};

export default function RegisterPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Únete a Chirisu</h1>
          <p className="text-muted-foreground">
            Crea tu cuenta y comienza a explorar anime, manga y más
          </p>
        </div>

        {/* Formulario de Registro */}
        <RegisterForm />

        {/* Link a Login */}
        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            ¿Ya tienes una cuenta?{' '}
            <Link href="/login">
              <Button variant="link" className="px-0">
                Iniciar Sesión
              </Button>
            </Link>
          </p>
        </div>

        {/* Información de Seguridad */}
        <div className="mt-8 p-4 rounded-lg bg-muted/50 border">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            Seguridad Mejorada con A2F
          </h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• La autenticación de 2 factores es obligatoria para todos los usuarios</li>
            <li>• Recibirás códigos de respaldo para guardar en un lugar seguro</li>
            <li>• Necesitarás una app como Google Authenticator o Authy</li>
            <li>• Tu cuenta estará protegida con doble capa de seguridad</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
