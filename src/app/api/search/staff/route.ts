import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const result = await pool.query(
      `SELECT 
        id,
        name,
        name_native,
        image_url
      FROM app.staff
      WHERE 
        LOWER(name) LIKE LOWER($1) OR
        LOWER(name_native) LIKE LOWER($1)
      ORDER BY name
      LIMIT 20`,
      [`%${query}%`]
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error searching staff:', error);
    return NextResponse.json({ error: 'Error searching staff' }, { status: 500 });
  }
}
