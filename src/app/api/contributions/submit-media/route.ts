/**
 * ========================================
 * API ROUTE: ENVIAR CONTRIBUCIÓN DE MEDIO
 * ========================================
 * 
 * POST /api/contributions/submit-media
 * - Envía una contribución de cualquier tipo de medio (anime, manga, novel, etc.)
 * - Soporta los 7 tipos: anime, manga, novel, donghua, manhua, manhwa, fan_comic
 */

import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/database';
import { MEDIA_TABLE_NAMES, POLYMORPHIC_TYPES, type MediaType } from '@/lib/media-types';

const VALID_MEDIA_TYPES = ['anime', 'manga', 'novel', 'donghua', 'manhua', 'manhwa', 'fan_comic'];

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { mediaType, contributionData } = body;

    // Validar tipo de medio
    if (!mediaType || !VALID_MEDIA_TYPES.includes(mediaType)) {
      return NextResponse.json(
        { error: `Tipo de medio inválido. Debe ser uno de: ${VALID_MEDIA_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validar datos de contribución
    if (!contributionData || typeof contributionData !== 'object') {
      return NextResponse.json(
        { error: 'Datos de contribución inválidos' },
        { status: 400 }
      );
    }

    // Enriquecer datos con información adicional
    const enrichedData = {
      ...contributionData,
      type: 'new_media',
      submittedAt: new Date().toISOString(),
    };

    // Insertar contribución en user_contributions
    // Nota: el campo es user_id, NO contributor_user_id
    const result = await db.query(
      `INSERT INTO app.user_contributions (
        user_id,
        contributable_type,
        contributable_id,
        contribution_data,
        status,
        is_visible_in_profile
      ) VALUES ($1, $2, $3, $4, 'pending', true)
      RETURNING id, created_at`,
      [
        currentUser.userId,
        mediaType,
        null, // contributable_id es null para nuevo contenido
        JSON.stringify(enrichedData)
      ]
    );

    const contributionId = result.rows[0].id;

    console.log(`✅ Contribución creada: ID ${contributionId}, Tipo: ${mediaType}, Usuario: ${currentUser.userId}`);

    return NextResponse.json({
      success: true,
      contributionId: contributionId.toString(),
      message: `Tu contribución de ${mediaType} ha sido enviada y está pendiente de revisión.`,
    });

  } catch (error: any) {
    console.error('❌ Error en POST /api/contributions/submit-media:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Error al enviar la contribución' 
      },
      { status: 500 }
    );
  }
}
