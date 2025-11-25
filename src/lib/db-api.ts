/**
 * @fileoverview Funciones de acceso a datos a través de la API.
 * 
 * Este archivo reemplaza las llamadas directas a `db.ts`. En lugar de obtener
 * datos de la simulación local, estas funciones hacen llamadas `fetch` a las
 * API Routes de Next.js.
 * 
 * Esto simula un entorno de producción donde el frontend está desacoplado del
 * backend y solo se comunica a través de endpoints de API.
 */
import type { MediaType } from './types';
import { getMediaPageData as getMediaPageDataFromDb } from './db'; // Importamos la simulación para usarla en la API

// Esta función se usaría en el frontend (Server Components)
export async function getMediaPageData(mediaIdOrSlug: string, mediaType: MediaType) {
  try {
    // En un entorno real, la URL base vendría de una variable de entorno.
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
    const res = await fetch(`${baseUrl}/api/anime/${mediaIdOrSlug}`, { 
      cache: 'no-store' // Deshabilitamos la caché para el ejemplo
    });

    if (!res.ok) {
      // Si la API devuelve un error (ej. 404), retornamos null.
      console.error(`API Error: ${res.status} ${res.statusText}`);
      return null;
    }

    const data = await res.json();
    return data as NonNullable<ReturnType<typeof getMediaPageDataFromDb>>;

  } catch (error) {
    console.error("Failed to fetch from API:", error);
    return null;
  }
}
