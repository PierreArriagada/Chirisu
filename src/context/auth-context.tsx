'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

// 1. Define la estructura de un usuario
// PSQL: En una implementación real, esta estructura coincidiría con las columnas
// de tu tabla 'users' en PostgreSQL (ej: id, name, email, image_url, role, created_at).
type UserRole = 'admin' | 'moderator' | 'user';
type User = {
  id: string;
  name: string;
  email: string;
  image: string;
  role: UserRole;
};

// 2. Define la estructura del contexto de autenticación
interface AuthContextType {
  user: User | null;
  login: (role: UserRole) => void;
  logout: () => void;
}

// 3. Crea el contexto con un valor inicial nulo
const AuthContext = createContext<AuthContextType | null>(null);

// 4. Crea un "Hook" personalizado para usar el contexto fácilmente
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}

// 5. Crea el componente "Proveedor" que envolverá la aplicación
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  // Función para simular el inicio de sesión
  const login = (role: UserRole) => {
    // PSQL: Aquí, en lugar de datos quemados, harías una llamada a tu API de backend.
    // 1. El usuario se autentica (ej. con Google, o email/contraseña).
    // 2. Tu backend recibe la información del usuario.
    // 3. Busca en la tabla 'users' si el email existe.
    //    `SELECT * FROM users WHERE email = $1;`
    // 4. Si no existe, crea un nuevo registro:
    //    `INSERT INTO users (name, email, image_url, role) VALUES ($1, $2, $3, 'user') RETURNING *;`
    // 5. Devuelve los datos del usuario (incluyendo su rol) al frontend.
    // Para esta simulación, creamos un usuario basado en el rol.
    
    let mockUser: User;

    if (role === 'admin') {
        mockUser = {
            id: '1-admin',
            name: 'Admin Demo',
            email: 'admin@example.com',
            image: 'https://picsum.photos/seed/admin-avatar/100/100',
            role: 'admin',
        };
    } else if (role === 'moderator') {
        mockUser = {
            id: '2-mod',
            name: 'Moderador Demo',
            email: 'moderator@example.com',
            image: 'https://picsum.photos/seed/mod-avatar/100/100',
            role: 'moderator',
        };
    } else {
        mockUser = {
            id: '3-user',
            name: 'Usuario Demo',
            email: 'user@example.com',
            image: 'https://picsum.photos/seed/user-avatar/100/100',
            role: 'user',
        };
    }
    
    setUser(mockUser);
    router.push('/'); // Redirige a la página de inicio
  };

  // Función para simular el cierre de sesión
  const logout = () => {
    // PSQL: Esto simplemente eliminaría el token de sesión del cliente.
    // No requiere una llamada a la base de datos, solo actualiza el estado del frontend.
    setUser(null);
    router.push('/'); // Redirige a la página de inicio
  };

  const value = {
    user,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
