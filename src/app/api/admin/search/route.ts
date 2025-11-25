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

    // Obtener parámetros de búsqueda
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const query = searchParams.get('query');

    if (!type || !query) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    }

    // Validar tipo
    const validTypes = ['anime', 'manga', 'novels', 'donghua', 'manhua', 'manhwa', 'fan_comic'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
    }

    // Buscar en la tabla correspondiente
    const searchPattern = `%${query}%`;
    let results;

    // Construir query según el tipo
    const queryText = `
      SELECT 
        id,
        title_romaji,
        title_native,
        title_english,
        title_spanish,
        status_id,
        created_at
      FROM app.${type}
      WHERE 
        LOWER(title_romaji) ILIKE $1 OR
        LOWER(title_native) ILIKE $1 OR
        LOWER(title_english) ILIKE $1 OR
        LOWER(title_spanish) ILIKE $1
      ORDER BY id DESC
      LIMIT 50
    `;

    results = await pool.query(queryText, [searchPattern]);

    return NextResponse.json({ results: results.rows });

  } catch (error) {
    console.error('Error en GET /api/admin/search:', error);
    return NextResponse.json(
      { error: 'Error al realizar la búsqueda' },
      { status: 500 }
    );
  }
}
