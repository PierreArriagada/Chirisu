import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { pool } from '@/lib/database';

/**
 * POST /api/user-reports/[id]/assign
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('chirisu_session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const payload = await verifyToken(token);

    if (!payload || (!payload.isAdmin && !payload.isModerator)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const checkResult = await pool.query(
      'SELECT id, assigned_to FROM app.user_reports WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: 'Reporte no encontrado' }, { status: 404 });
    }

    if (checkResult.rows[0].assigned_to) {
      return NextResponse.json(
        { error: 'Este reporte ya está asignado' },
        { status: 409 }
      );
    }

    await pool.query(
      `UPDATE app.user_reports 
       SET assigned_to = $1, assigned_at = NOW() 
       WHERE id = $2`,
      [payload.userId, id]
    );

    await pool.query(
      `INSERT INTO app.audit_log (user_id, action, resource_type, resource_id, new_values)
       VALUES ($1, 'assign_user_report', 'user_report', $2, $3)`,
      [payload.userId, id, JSON.stringify({ assigned_to: payload.userId })]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error en POST /api/user-reports/[id]/assign:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/user-reports/[id]/assign
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('chirisu_session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const payload = await verifyToken(token);

    if (!payload || (!payload.isAdmin && !payload.isModerator)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const checkResult = await pool.query(
      'SELECT id, assigned_to FROM app.user_reports WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: 'Reporte no encontrado' }, { status: 404 });
    }

    const report = checkResult.rows[0];

    if (report.assigned_to !== payload.userId && !payload.isAdmin) {
      return NextResponse.json(
        { error: 'No tienes permiso para liberar este reporte' },
        { status: 403 }
      );
    }

    await pool.query(
      `UPDATE app.user_reports 
       SET assigned_to = NULL, assigned_at = NULL 
       WHERE id = $1`,
      [id]
    );

    await pool.query(
      `INSERT INTO app.audit_log (user_id, action, resource_type, resource_id, old_values)
       VALUES ($1, 'release_user_report', 'user_report', $2, $3)`,
      [payload.userId, id, JSON.stringify({ assigned_to: report.assigned_to })]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error en DELETE /api/user-reports/[id]/assign:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
