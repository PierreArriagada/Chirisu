import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

/**
 * API para contribuciones de contenido
 * 
 * POST /api/content-contributions
 * - Crear nueva contribución de usuario
 * 
 * GET /api/content-contributions
 * - Listar contribuciones (filtros: status, userId, contributableType)
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      contributableType,
      contributableId,
      contributionType = 'add_info',
      proposedChanges,
      contributionNotes,
      sources,
    } = body;

    // Validaciones
    if (!userId || !contributableType || !contributableId || !proposedChanges) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    const validTypes = ['anime', 'manga', 'novel', 'donghua', 'manhua', 'manhwa', 'fan_comic'];
    if (!validTypes.includes(contributableType)) {
      return NextResponse.json(
        { error: 'Tipo de contenido inválido' },
        { status: 400 }
      );
    }

    // Insertar contribución
    const result = await pool.query(
      `INSERT INTO app.content_contributions (
        contributor_user_id,
        contributable_type,
        contributable_id,
        contribution_type,
        proposed_changes,
        contribution_notes,
        sources,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
      RETURNING id, created_at`,
      [
        userId,
        contributableType,
        contributableId,
        contributionType,
        JSON.stringify(proposedChanges),
        contributionNotes,
        sources ? JSON.stringify(sources) : null,
      ]
    );

    console.log(`✅ Nueva contribución creada: ID ${result.rows[0].id} por usuario ${userId}`);

    return NextResponse.json({
      success: true,
      contributionId: result.rows[0].id.toString(),
      message: 'Contribución enviada exitosamente. Será revisada por un moderador.',
    });

  } catch (error: any) {
    console.error('❌ Error en POST /api/content-contributions:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const userId = searchParams.get('userId'); // ID del contribuyente (para perfil de usuario)
    const currentUserId = searchParams.get('currentUserId'); // ID del moderador actual
    const isAdmin = searchParams.get('isAdmin') === 'true';
    const contributableType = searchParams.get('contributableType');
    const limit = parseInt(searchParams.get('limit') || '50');

    console.log('🔍 GET /api/content-contributions:', { status, userId, currentUserId, isAdmin });

    let query = `
      SELECT 
        c.id,
        c.contributor_user_id,
        c.contributable_type,
        c.contributable_id,
        c.contribution_type,
        c.proposed_changes,
        c.contribution_notes,
        c.sources,
        c.status,
        c.assigned_to_user_id,
        c.moderator_notes,
        c.reviewed_by_user_id,
        c.reviewed_at,
        c.created_at,
        c.updated_at,
        u.username as contributor_username,
        u.display_name as contributor_display_name,
        am.username as assigned_to_username,
        am.display_name as assigned_to_display_name,
        rm.username as reviewed_by_username
      FROM app.content_contributions c
      LEFT JOIN app.users u ON c.contributor_user_id = u.id
      LEFT JOIN app.users am ON c.assigned_to_user_id = am.id
      LEFT JOIN app.users rm ON c.reviewed_by_user_id = rm.id
      WHERE c.deleted_at IS NULL
    `;

    const params: any[] = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      query += ` AND c.status = $${paramCount}`;
      params.push(status);
    }

    // Si es para el perfil de usuario, filtrar por contributor_user_id
    if (userId) {
      paramCount++;
      query += ` AND c.contributor_user_id = $${paramCount}`;
      params.push(userId);
    }

    // Lógica de visibilidad para moderadores (igual que reportes de comentarios)
    if (currentUserId && !userId) {
      if (!isAdmin) {
        // Moderadores ven:
        // 1. Casos asignados a ellos
        // 2. Casos sin asignar (pending)
        // 3. Casos abandonados (in_review por más de 15 días)
        paramCount++;
        query += ` AND (
          c.assigned_to_user_id = $${paramCount}
          OR c.assigned_to_user_id IS NULL
          OR (c.status = 'in_review' AND c.updated_at < NOW() - INTERVAL '15 days')
        )`;
        params.push(currentUserId);
      }
      // Admins ven todo (no agregar filtro)
    }

    if (contributableType) {
      paramCount++;
      query += ` AND c.contributable_type = $${paramCount}`;
      params.push(contributableType);
    }

    query += ` ORDER BY c.created_at DESC LIMIT $${paramCount + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);

    console.log(`📊 Contribuciones encontradas: ${result.rows.length}`);

    const contributions = result.rows.map((row) => ({
      id: row.id.toString(),
      contributorUserId: row.contributor_user_id.toString(),
      contributorUsername: row.contributor_username,
      contributorDisplayName: row.contributor_display_name,
      contributableType: row.contributable_type,
      contributableId: row.contributable_id.toString(),
      contributionType: row.contribution_type,
      proposedChanges: row.proposed_changes,
      contributionNotes: row.contribution_notes,
      sources: row.sources,
      status: row.status,
      assignedToUserId: row.assigned_to_user_id?.toString(),
      assignedToUsername: row.assigned_to_username,
      assignedToDisplayName: row.assigned_to_display_name,
      moderatorNotes: row.moderator_notes,
      reviewedByUserId: row.reviewed_by_user_id?.toString(),
      reviewedByUsername: row.reviewed_by_username,
      reviewedAt: row.reviewed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json({
      success: true,
      contributions,
      count: contributions.length,
    });

  } catch (error: any) {
    console.error('❌ Error en GET /api/content-contributions:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
