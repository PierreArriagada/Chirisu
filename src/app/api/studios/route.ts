/**
 * ========================================
 * API ROUTE: ESTUDIOS
 * ========================================
 * 
 * GET /api/studios
 * - Obtiene todos los estudios de animación
 * - Permite búsqueda por query param "search"
 * 
 * POST /api/studios
 * - Crea un nuevo estudio (para contribuciones)
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
        name
      FROM app.studios
    `;

    const params: any[] = [];

    if (search) {
      query += ` WHERE LOWER(name) LIKE LOWER($1)`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY name ASC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);

    const studios = result.rows.map(row => ({
      id: row.id,
      name: row.name,
    }));

    return NextResponse.json({
      success: true,
      studios,
      total: studios.length,
    });

  } catch (error) {
    console.error('❌ Error en GET /api/studios:', error);
    return NextResponse.json(
      { error: 'Error al obtener estudios' },
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

    const { name } = await request.json();

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'El nombre del estudio es requerido' },
        { status: 400 }
      );
    }

    // Verificar si ya existe
    const existingResult = await pool.query(
      'SELECT id, name FROM app.studios WHERE LOWER(name) = LOWER($1)',
      [name.trim()]
    );

    if (existingResult.rows.length > 0) {
      return NextResponse.json({
        success: true,
        studio: {
          id: existingResult.rows[0].id,
          name: existingResult.rows[0].name,
        },
        message: 'El estudio ya existe',
      });
    }

    // Crear nuevo estudio
    const result = await pool.query(
      'INSERT INTO app.studios (name) VALUES ($1) RETURNING id, name',
      [name.trim()]
    );

    return NextResponse.json({
      success: true,
      studio: {
        id: result.rows[0].id,
        name: result.rows[0].name,
      },
      message: 'Estudio creado exitosamente',
    });

  } catch (error) {
    console.error('❌ Error en POST /api/studios:', error);
    return NextResponse.json(
      { error: 'Error al crear estudio' },
      { status: 500 }
    );
  }
}
