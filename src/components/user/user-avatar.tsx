'use client';

/**
 * @fileoverview UserAvatar - Componente client para mostrar avatar de usuario.
 * 
 * Este componente muestra el avatar del usuario y puede ser clickeable
 * para navegar al perfil público del usuario.
 */

import Link from 'next/link';

interface UserAvatarProps {
  avatarUrl: string | null;
  displayName: string;
  username?: string;  // Si se proporciona, el avatar será clickeable
  size?: number;
  clickeable?: boolean;
}

export function UserAvatar({ 
  avatarUrl, 
  displayName, 
  username,
  size = 48,
  clickeable = true 
}: UserAvatarProps) {
  // Fallback: usar username si displayName es null/undefined/empty
  const nameToDisplay = displayName || username || 'Usuario';
  
  const avatarContent = avatarUrl ? (
    <div 
      className="rounded-full overflow-hidden bg-muted flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <img
        src={avatarUrl}
        alt={nameToDisplay}
        className="w-full h-full object-cover object-center"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          if (target.parentElement) {
            target.parentElement.innerHTML = `
              <div class="w-full h-full rounded-full bg-primary/10 flex items-center justify-center">
                <span class="text-xl font-bold text-primary">
                  ${nameToDisplay.charAt(0).toUpperCase()}
                </span>
              </div>
            `;
          }
        }}
      />
    </div>
  ) : (
    <div 
      className="rounded-full bg-primary/10 flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <span className="text-xl font-bold text-primary">
        {nameToDisplay.charAt(0).toUpperCase()}
      </span>
    </div>
  );

  // Si tiene username y es clickeable, envolver en Link
  if (username && clickeable) {
    return (
      <Link href={`/u/${username}`} className="flex-shrink-0">
        <div className="hover:ring-2 hover:ring-primary rounded-full transition-all cursor-pointer">
          {avatarContent}
        </div>
      </Link>
    );
  }

  return <div className="flex-shrink-0">{avatarContent}</div>;
}
