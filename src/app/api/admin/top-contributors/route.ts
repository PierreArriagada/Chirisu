import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { pool } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const cookieStore = await cookies();
    const token = cookieStore.get('chirisu_session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    
    if (!payload || !payload.isAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Obtener período de tiempo
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'all';

    // Construir filtro de fecha
    let dateFilter = '';
    if (period === 'week') {
      dateFilter = "AND uc.created_at >= NOW() - INTERVAL '7 days'";
    } else if (period === 'month') {
      dateFilter = "AND uc.created_at >= NOW() - INTERVAL '30 days'";
    }

    // Obtener top contribuyentes
    const result = await pool.query(`
      SELECT 
        u.id as user_id,
        u.username,
        COUNT(uc.id) as total_contributions,
        COUNT(uc.id) FILTER (WHERE uc.status = 'approved') as approved,
        COUNT(uc.id) FILTER (WHERE uc.status = 'pending') as pending,
        COUNT(uc.id) FILTER (WHERE uc.status = 'rejected') as rejected,
        CASE 
          WHEN COUNT(uc.id) > 0 THEN 
            (COUNT(uc.id) FILTER (WHERE uc.status = 'approved')::float / COUNT(uc.id)::float * 100)
          ELSE 0
        END as approval_rate
      FROM app.users u
      JOIN app.user_contributions uc ON uc.user_id = u.id
      WHERE 1=1 ${dateFilter}
      GROUP BY u.id, u.username
      HAVING COUNT(uc.id) > 0
      ORDER BY total_contributions DESC, approval_rate DESC
      LIMIT 50
    `);

    return NextResponse.json({ contributors: result.rows });

  } catch (error) {
    console.error('Error en GET /api/admin/top-contributors:', error);
    return NextResponse.json(
      { error: 'Error al obtener contribuyentes' },
      { status: 500 }
    );
  }
}
