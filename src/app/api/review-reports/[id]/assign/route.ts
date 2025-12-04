import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { pool } from '@/lib/database';

/**
 * POST /api/review-reports/[id]/assign
 * Asigna un reporte de review al moderador actual
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

    // Verificar que el reporte existe y no está asignado
    const checkResult = await pool.query(
      'SELECT id, assigned_to FROM app.review_reports WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: 'Reporte no encontrado' }, { status: 404 });
    }

    const report = checkResult.rows[0];

    if (report.assigned_to) {
      return NextResponse.json(
        { error: 'Este reporte ya está asignado a otro moderador' },
        { status: 409 }
      );
    }

    // Asignar el reporte y cambiar estado a 'reviewing'
    await pool.query(
      `UPDATE app.review_reports 
       SET assigned_to = $1, assigned_at = NOW(), status = 'reviewing'
       WHERE id = $2`,
      [payload.userId, id]
    );

    // Registrar en audit_log
    await pool.query(
      `INSERT INTO app.audit_log (user_id, action, resource_type, resource_id, new_values)
       VALUES ($1, 'assign_review_report', 'review_report', $2, $3)`,
      [payload.userId, id, JSON.stringify({ assigned_to: payload.userId, assigned_at: new Date(), status: 'reviewing' })]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error en POST /api/review-reports/[id]/assign:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/review-reports/[id]/assign
 * Libera un reporte de review asignado
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

    // Verificar que el reporte existe
    const checkResult = await pool.query(
      'SELECT id, assigned_to FROM app.review_reports WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: 'Reporte no encontrado' }, { status: 404 });
    }

    const report = checkResult.rows[0];

    // Solo el moderador asignado o un admin pueden liberar
    if (report.assigned_to !== payload.userId && !payload.isAdmin) {
      return NextResponse.json(
        { error: 'No tienes permiso para liberar este reporte' },
        { status: 403 }
      );
    }

    // Liberar el reporte y volver a estado 'pending'
    await pool.query(
      `UPDATE app.review_reports 
       SET assigned_to = NULL, assigned_at = NULL, status = 'pending'
       WHERE id = $1`,
      [id]
    );

    // Registrar en audit_log
    await pool.query(
      `INSERT INTO app.audit_log (user_id, action, resource_type, resource_id, old_values)
       VALUES ($1, 'release_review_report', 'review_report', $2, $3)`,
      [payload.userId, id, JSON.stringify({ assigned_to: report.assigned_to, status: 'pending' })]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error en DELETE /api/review-reports/[id]/assign:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
