/**
 * ========================================
 * BARREL EXPORT: Componentes de Autenticación
 * ========================================
 * Ubicación: src/components/auth/index.ts
 * 
 * PROPÓSITO:
 * - Centralizar exports de todos los componentes de auth
 * - Simplificar imports en otras partes de la app
 * 
 * USO:
 * import { ForgotPasswordDialog, GoogleAuthButton } from '@/components/auth';
 */

export { ChangePasswordDialog } from './change-password-dialog';
export { ForgotPasswordDialog } from './forgot-password-dialog';
export { ResetPasswordForm } from './reset-password-form';
export { GoogleAuthButton } from './google-auth-button';
export { TwoFactorSetupDialog } from './two-factor-setup-dialog';
export { TwoFactorVerifyDialog } from './two-factor-verify-dialog';
export { TwoFactorDisableDialog } from './two-factor-disable-dialog';
export { RegisterForm } from './register-form';
export { RecoverPasswordForm } from './recover-password-form';

