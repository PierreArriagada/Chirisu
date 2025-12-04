import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

/**
 * GET /api/media/[type]/[id]/staff
 * Obtiene el staff de cualquier tipo de media
 * Soporta: anime, manga, manhwa, manhua, donghua, novel, fan_comic
 */

const VALID_TYPES = ['anime', 'manga', 'manhwa', 'manhua', 'donghua', 'novel', 'fan_comic'];

// Mapeo de tipo a tabla
const TABLE_MAP: Record<string, string> = {
  anime: 'anime',
  manga: 'manga',
  manhwa: 'manhwa',
  manhua: 'manhua',
  donghua: 'donghua',
  novel: 'novels',
  fan_comic: 'fan_comics',
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ type: string; id: string }> }
) {
  try {
    const { type, id } = await context.params;
    const mediaId = parseInt(id);

    // Validar tipo
    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Tipo de media inválido: ${type}. Tipos válidos: ${VALID_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    if (isNaN(mediaId)) {
      return NextResponse.json(
        { error: 'ID de media inválido' },
        { status: 400 }
      );
    }

    const tableName = TABLE_MAP[type];

    // Verificar que el media existe
    const mediaCheck = await pool.query(
      `SELECT id FROM app.${tableName} WHERE id = $1`,
      [mediaId]
    );

    if (mediaCheck.rows.length === 0) {
      return NextResponse.json(
        { error: `${type} no encontrado` },
        { status: 404 }
      );
    }

    // Obtener staff con sus roles
    const staffQuery = `
      SELECT 
        s.id,
        s.name,
        s.name_romaji,
        s.name_native,
        s.image_url,
        s.bio,
        s.slug,
        s.gender,
        s.hometown,
        s.date_of_birth,
        s.primary_occupations,
        ss.role
      FROM app.staffable_staff ss
      JOIN app.staff s ON s.id = ss.staff_id
      WHERE ss.staffable_type = $1 
        AND ss.staffable_id = $2
      ORDER BY 
        CASE ss.role 
          WHEN 'Director' THEN 1
          WHEN 'Original Creator' THEN 2
          WHEN 'Series Composition' THEN 3
          WHEN 'Script' THEN 4
          WHEN 'Music' THEN 5
          WHEN 'Character Design' THEN 6
          WHEN 'Art Director' THEN 7
          WHEN 'Animation Director' THEN 8
          WHEN 'Author' THEN 9
          WHEN 'Artist' THEN 10
          ELSE 99
        END,
        s.name
    `;

    const result = await pool.query(staffQuery, [type, mediaId]);

    // Agrupar por rol
    const staffByRole: Record<string, any[]> = {};
    result.rows.forEach(staff => {
      const role = staff.role || 'Staff';
      if (!staffByRole[role]) {
        staffByRole[role] = [];
      }
      staffByRole[role].push(staff);
    });

    return NextResponse.json({
      success: true,
      data: {
        staff: result.rows,
        byRole: staffByRole,
        total: result.rows.length,
        mediaType: type
      }
    });

  } catch (error) {
    console.error('❌ Error en GET /api/media/[type]/[id]/staff:', error);
    return NextResponse.json(
      { 
        error: 'Error al obtener staff',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
