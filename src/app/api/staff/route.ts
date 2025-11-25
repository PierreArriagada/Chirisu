/**
 * ========================================
 * API ROUTE: STAFF (Personal)
 * ========================================
 * 
 * GET /api/staff
 * - Obtiene personal (directores, autores, etc.)
 * - Permite búsqueda por query param "search"
 * 
 * POST /api/staff
 * - Crea un nuevo miembro del staff (para contribuciones)
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = `
      SELECT 
        id,
        name_romaji,
        name_native,
        image_url
      FROM app.staff
    `;

    const params: any[] = [];

    if (search) {
      query += ` WHERE LOWER(name_romaji) LIKE LOWER($1) OR LOWER(name_native) LIKE LOWER($1)`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY name_romaji ASC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);

    const staff = result.rows.map(row => ({
      id: row.id,
      nameRomaji: row.name_romaji,
      nameNative: row.name_native,
      imageUrl: row.image_url,
    }));

    return NextResponse.json({
      success: true,
      staff,
      total: staff.length,
    });

  } catch (error) {
    console.error('❌ Error en GET /api/staff:', error);
    return NextResponse.json(
      { error: 'Error al obtener staff' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { nameRomaji, nameNative, imageUrl } = await request.json();

    if (!nameRomaji || nameRomaji.trim().length === 0) {
      return NextResponse.json(
        { error: 'El nombre romaji es requerido' },
        { status: 400 }
      );
    }

    // Verificar si ya existe
    const existingResult = await pool.query(
      'SELECT id, name_romaji, name_native, image_url FROM app.staff WHERE LOWER(name_romaji) = LOWER($1)',
      [nameRomaji.trim()]
    );

    if (existingResult.rows.length > 0) {
      return NextResponse.json({
        success: true,
        staff: {
          id: existingResult.rows[0].id,
          nameRomaji: existingResult.rows[0].name_romaji,
          nameNative: existingResult.rows[0].name_native,
          imageUrl: existingResult.rows[0].image_url,
        },
        message: 'El miembro del staff ya existe',
      });
    }

    // Crear nuevo staff
    const result = await pool.query(
      'INSERT INTO app.staff (name_romaji, name_native, image_url) VALUES ($1, $2, $3) RETURNING id, name_romaji, name_native, image_url',
      [nameRomaji.trim(), nameNative?.trim() || null, imageUrl || null]
    );

    return NextResponse.json({
      success: true,
      staff: {
        id: result.rows[0].id,
        nameRomaji: result.rows[0].name_romaji,
        nameNative: result.rows[0].name_native,
        imageUrl: result.rows[0].image_url,
      },
      message: 'Miembro del staff creado exitosamente',
    });

  } catch (error) {
    console.error('❌ Error en POST /api/staff:', error);
    return NextResponse.json(
      { error: 'Error al crear staff' },
      { status: 500 }
    );
  }
}
