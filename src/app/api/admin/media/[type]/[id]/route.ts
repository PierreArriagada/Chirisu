import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { pool } from '@/lib/database';

// GET - Obtener información de un media específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  try {
    // Verificar autenticación
    const cookieStore = await cookies();
    const token = cookieStore.get('chirisu_session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    
    // Solo moderadores y admins pueden editar
    if (!payload || (!payload.isAdmin && !payload.isModerator)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { type, id } = await params;

    // Validar tipo
    const validTypes = ['anime', 'manga', 'novels', 'donghua', 'manhua', 'manhwa', 'fan_comic'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
    }

    // Obtener información del media
    const result = await pool.query(
      `SELECT * FROM app.${type} WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }

    return NextResponse.json({ media: result.rows[0] });

  } catch (error) {
    console.error('Error en GET /api/admin/media:', error);
    return NextResponse.json(
      { error: 'Error al obtener información' },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar información del media
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  try {
    // Verificar autenticación
    const cookieStore = await cookies();
    const token = cookieStore.get('chirisu_session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    
    // Solo moderadores y admins pueden editar
    if (!payload || (!payload.isAdmin && !payload.isModerator)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { type, id } = await params;
    const body = await request.json();

    // Validar tipo
    const validTypes = ['anime', 'manga', 'novels', 'donghua', 'manhua', 'manhwa', 'fan_comic'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
    }

    // Campos permitidos para actualizar
    const allowedFields = [
      'title_romaji',
      'title_native',
      'title_english',
      'title_spanish',
      'synopsis',
      'synopsis_spanish',
      'cover_image_url',
      'banner_image_url',
      'episode_count',
      'duration',
      'season',
      'year',
      'volumes',
      'chapters',
      'status_id',
    ];

    // Construir query dinámico
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 0;

    for (const field of allowedFields) {
      if (field in body) {
        paramCount++;
        updates.push(`${field} = $${paramCount}`);
        values.push(body[field]);
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 });
    }

    // Agregar updated_at
    paramCount++;
    updates.push(`updated_at = $${paramCount}`);
    values.push(new Date());

    // Agregar ID al final
    paramCount++;
    values.push(id);

    const query = `
      UPDATE app.${type}
      SET ${updates.join(', ')}
      WHERE id = $${paramCount} AND deleted_at IS NULL
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    }

    // Registrar en audit log
    await pool.query(
      `INSERT INTO app.audit_log (user_id, action, resource_type, resource_id, details)
       VALUES ($1, 'update', $2, $3, $4)`,
      [
        payload.userId,
        type,
        id,
        JSON.stringify({ updated_fields: Object.keys(body) })
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Actualizado correctamente',
      media: result.rows[0],
    });

  } catch (error) {
    console.error('Error en PATCH /api/admin/media:', error);
    return NextResponse.json(
      { error: 'Error al actualizar información' },
      { status: 500 }
    );
  }
}
