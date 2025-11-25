/**
 * ========================================
 * API ROUTE: CONTRIBUCIONES DE USUARIO
 * ========================================
 * 
 * GET /api/user/contributions?userId={id}
 * - Obtiene todas las contribuciones de un usuario
 * 
 * POST /api/user/contributions
 * - Crea una nueva contribución (pendiente de aprobación)
 */

import 'server-only';

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/database';
// notifyAdminsAndMods removido: ahora lo hace el trigger fn_notify_new_contribution()

// ============================================
// TIPOS
// ============================================

interface Contribution {
  id: string;
  userId: string;
  contributionType: 'full' | 'modification' | 'report';
  mediaType: 'anime' | 'manga' | 'novel';
  mediaId?: string;
  mediaTitle?: string;
  status: 'pending' | 'approved' | 'rejected';
  contributionData: any;
  awardedPoints: number;
  isVisibleInProfile: boolean;
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

// ============================================
// GET: Obtener contribuciones de un usuario
// ============================================

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const status = searchParams.get('status'); // 'pending', 'approved', 'rejected'
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido' },
        { status: 400 }
      );
    }

    // Construir query con filtros opcionales
    let query = `
      SELECT 
        uc.id,
        uc.user_id,
        uc.contributable_type,
        uc.contributable_id,
        uc.contribution_data,
        uc.status,
        uc.awarded_points,
        uc.is_visible_in_profile,
        uc.created_at,
        uc.reviewed_by,
        uc.reviewed_at,
        uc.rejection_reason,
        -- Obtener título del medio si existe
        COALESCE(
          a.title_romaji,
          m.title_romaji,
          n.title_romaji
        ) as media_title
      FROM app.user_contributions uc
      LEFT JOIN app.anime a ON (uc.contributable_type = 'anime' AND uc.contributable_id = a.id)
      LEFT JOIN app.manga m ON (uc.contributable_type = 'manga' AND uc.contributable_id = m.id)
      LEFT JOIN app.novels n ON (uc.contributable_type = 'novel' AND uc.contributable_id = n.id)
      WHERE uc.user_id = $1
    `;

    const params: any[] = [userId];

    if (status) {
      query += ` AND uc.status = $${params.length + 1}`;
      params.push(status);
    }

    query += ` ORDER BY uc.created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await db.query(query, params);

    const contributions: Contribution[] = result.rows.map((row: any) => {
      const data = row.contribution_data || {};
      
      // Determinar el tipo de contribución basado en contribution_data
      let contributionType: 'full' | 'modification' | 'report' = 'modification';
      
      if (data.type === 'full' || data.isFullEntry) {
        contributionType = 'full';
      } else if (data.type === 'report' || data.reportReason) {
        contributionType = 'report';
      }

      return {
        id: row.id.toString(),
        userId: row.user_id.toString(),
        contributionType,
        mediaType: row.contributable_type,
        mediaId: row.contributable_id?.toString(),
        mediaTitle: row.media_title,
        status: row.status,
        contributionData: data,
        awardedPoints: row.awarded_points || 0,
        isVisibleInProfile: row.is_visible_in_profile,
        createdAt: row.created_at.toISOString(),
        reviewedBy: row.reviewed_by?.toString(),
        reviewedAt: row.reviewed_at?.toISOString(),
        rejectionReason: row.rejection_reason,
      };
    });

    return NextResponse.json({
      success: true,
      contributions,
      total: contributions.length,
    });

  } catch (error) {
    console.error('❌ Error en GET /api/user/contributions:', error);
    return NextResponse.json(
      { error: 'Error al obtener contribuciones' },
      { status: 500 }
    );
  }
}

// ============================================
// POST: Crear nueva contribución
// ============================================

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      contributionType, // 'full', 'modification', 'report'
      mediaType,        // 'anime', 'manga', 'novel'
      mediaId,          // ID del medio (null si es creación nueva)
      contributionData, // Datos de la contribución
    } = body;

    // Validaciones
    if (!contributionType || !mediaType || !contributionData) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    if (!['full', 'modification', 'report'].includes(contributionType)) {
      return NextResponse.json(
        { error: 'Tipo de contribución inválido' },
        { status: 400 }
      );
    }

    const validMediaTypes = ['anime', 'manga', 'novel', 'donghua', 'manhua', 'manhwa', 'fan_comic'];
    if (!validMediaTypes.includes(mediaType)) {
      return NextResponse.json(
        { error: 'Tipo de medio inválido' },
        { status: 400 }
      );
    }

    // Preparar datos de contribución
    const enrichedData = {
      ...contributionData,
      type: contributionType,
      submittedAt: new Date().toISOString(),
    };

    // Insertar contribución
    const result = await db.query(
      `INSERT INTO app.user_contributions (
        user_id,
        contributable_type,
        contributable_id,
        contribution_data,
        status,
        is_visible_in_profile
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, created_at`,
      [
        currentUser.userId,
        mediaType,
        mediaId || null,
        JSON.stringify(enrichedData),
        'pending',
        true,
      ]
    );

    const newContribution = result.rows[0];

    // 🎯 Las notificaciones a admins/mods se crean automáticamente por el trigger:
    // fn_notify_new_contribution() en la base de datos
    
    console.log(`✅ Contribución ${newContribution.id} creada por usuario ${currentUser.userId}`);

    return NextResponse.json({
      success: true,
      message: 'Contribución enviada. Está pendiente de aprobación por un moderador.',
      contribution: {
        id: newContribution.id.toString(),
        createdAt: newContribution.created_at.toISOString(),
      },
    });

  } catch (error) {
    console.error('❌ Error en POST /api/user/contributions:', error);
    return NextResponse.json(
      { error: 'Error al crear contribución' },
      { status: 500 }
    );
  }
}
