'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

// 1. Define la estructura de un usuario
// PSQL: En una implementación real, esta estructura coincidiría con las columnas
// de tu tabla 'users' en PostgreSQL (ej: id, name, email, image_url, role, created_at, password_hash).
type UserRole = 'admin' | 'moderator' | 'user';
type User = {
  id: string;
  name: string;
  email: string;
  image: string;
  role: UserRole;
};

// --- BASE DE DATOS SIMULADA ---
// PSQL: Esto sería una tabla `users` en tu base de datos PostgreSQL.
// La contraseña se guardaría como un hash (ej. usando bcrypt), no como texto plano.
const simulatedUsers: (User & { password: string })[] = [
  {
    id: '1-admin',
    name: 'Admin Demo',
    email: 'admin@example.com',
    password: 'adminpassword',
    image: 'https://picsum.photos/seed/admin-avatar/100/100',
    role: 'admin',
  },
  {
    id: '2-mod',
    name: 'Moderador Demo',
    email: 'moderator@example.com',
    password: 'modpassword',
    image: 'https://picsum.photos/seed/mod-avatar/100/100',
    role: 'moderator',
  },
  {
    id: '3-user',
    name: 'Usuario Demo',
    email: 'user@example.com',
    password: 'userpassword',
    image: 'https://picsum.photos/seed/user-avatar/100/100',
    role: 'user',
  },
];
// --- FIN DE LA BASE DE DATOS SIMULADA ---


// 2. Define la estructura del contexto de autenticación
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
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
