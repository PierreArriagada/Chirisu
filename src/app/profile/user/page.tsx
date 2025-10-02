import { redirect } from 'next/navigation'

// Esta página es un ejemplo. En una aplicación real, probablemente usarías
// una ruta dinámica como /profile/[userId]
// Por ahora, simplemente redirigimos a la página de perfil principal.
export default function UserSubPage() {
  redirect('/profile')
}
