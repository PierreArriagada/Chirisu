import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  // Configuración para usar módulos de Node.js solo en el servidor
  serverExternalPackages: ['pg', 'pg-pool', 'bcryptjs'],
  images: {
    // Usar loader externo para cargar cualquier imagen sin restricciones
    unoptimized: true, // Deshabilitar optimización automática de Next.js
    // Alternativamente, usar un loader personalizado:
    // loader: 'custom',
    // loaderFile: './lib/image-loader.ts',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Permitir CUALQUIER hostname HTTPS
      },
      {
        protocol: 'http',
        hostname: '**', // Permitir CUALQUIER hostname HTTP (menos seguro, opcional)
      },
      // Añadir el host de las imágenes de la base de datos si es necesario
    ],
  },
  // Añadir la variable de entorno para que esté disponible en el cliente
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  // Headers de seguridad
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY', // Previene clickjacking
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff', // Previene MIME sniffing
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
