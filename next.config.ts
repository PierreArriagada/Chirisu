import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
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
<<<<<<< HEAD
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
=======
  // Añadir la variable de entorno para que esté disponible en el cliente
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
>>>>>>> d3e59e8a72b3b9ecd4bb64f73b81cc23f36469ab
  },
};

export default nextConfig;
