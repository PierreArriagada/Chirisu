'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { simulatedUsers, type User } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';

// 1. Define la estructura del contexto de autenticación
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

// 2. Crea el contexto con un valor inicial nulo
const AuthContext = createContext<AuthContextType | null>(null);

// 3. Crea un "Hook" personalizado para usar el contexto fácilmente
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}

// 4. Crea el componente "Proveedor" que envolverá la aplicación
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  // Función para simular el inicio de sesión con email y contraseña
  const login = (email: string, password: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      // PSQL: Aquí, en lugar de buscar en un array, harías una llamada a tu API de backend.
      // 1. El backend recibiría el email y la contraseña.
      // 2. Buscaría en la tabla `users` por el email:
      //    `SELECT * FROM users WHERE email = $1;`
      // 3. Si encuentra un usuario, compararía la contraseña enviada con el hash guardado usando bcrypt.compare.
      // 4. Si la contraseña es correcta, crearía un token de sesión (ej. JWT) y lo devolvería.
      // 5. El frontend guardaría el token y los datos del usuario.

      setTimeout(() => { // Simula la latencia de la red
        const foundUser = simulatedUsers.find(
          (u) => u.email === email && u.password === password
        );

        if (foundUser) {
          const { password, ...userToSet } = foundUser;
          setUser(userToSet);
          resolve();
        } else {
          reject(new Error('Correo o contraseña incorrectos.'));
        }
      }, 500);
    });
  };

  const updateUser = (updatedUser: User) => {
    // PSQL: Esta función haría una llamada a la API para actualizar los datos del usuario.
    // `UPDATE users SET ... WHERE id = $1`
    // O `UPDATE user_lists SET ... WHERE user_id = $1`
    setUser(updatedUser);
  };

  // Función para simular el cierre de sesión
  const logout = () => {
    // PSQL: Esto simplemente eliminaría el token de sesión del cliente.
    // No requiere una llamada a la base de datos, solo actualiza el estado del frontend.
    setUser(null);
    toast({
        title: 'Sesión cerrada',
        description: 'Has cerrado sesión correctamente.',
      });
    router.push('/'); // Redirige a la página de inicio
  };

  const value = {
    user,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
