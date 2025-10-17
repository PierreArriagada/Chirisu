import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

/**
 * API de Listas de Usuario
 * 
 * GET /api/user/lists?userId={id}
 * - Obtiene todas las listas del usuario (por defecto y personalizadas)
 * 
 * POST /api/user/lists
 * - Body: { userId, name, isPublic }
 * - Crea una nueva lista personalizada
 * 
 * PUT /api/user/lists/{listId}
 * - Body: { name, isPublic }
 * - Actualiza una lista personalizada
 * 
 * DELETE /api/user/lists/{listId}
 * - Elimina una lista personalizada
 */

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido' },
        { status: 400 }
      );
    }

    // Obtener todas las listas del usuario
    const listsResult = await pool.query(`
      SELECT 
        l.id,
        l.name,
        l.slug,
        l.description,
        l.is_public,
        l.is_default,
        l.created_at,
        COUNT(li.id) as items_count
      FROM app.lists l
      LEFT JOIN app.list_items li ON l.id = li.list_id
      WHERE l.user_id = $1
      GROUP BY l.id
      ORDER BY l.is_default DESC, l.created_at DESC
    `, [userId]);

    // Agrupar por tipo
    const defaultLists: any[] = [];
    const customLists: any[] = [];

    listsResult.rows.forEach(row => {
      const list = {
        id: row.id.toString(),
        name: row.name,
        slug: row.slug,
        description: row.description,
        isPublic: row.is_public,
        itemsCount: parseInt(row.items_count) || 0,
        createdAt: row.created_at,
      };

      if (row.is_default) {
        defaultLists.push(list);
      } else {
        customLists.push(list);
      }
    });

    return NextResponse.json({
      success: true,
      defaultLists,
      customLists,
    });

  } catch (error: any) {
    console.error('❌ Error en GET /api/user/lists:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, isPublic = false } = body;

    if (!userId || !name) {
      return NextResponse.json(
        { error: 'userId y name son requeridos' },
        { status: 400 }
      );
    }

    // Generar slug desde el nombre
    const slug = name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 100);

    // Verificar que el slug no exista para este usuario
    const existsResult = await pool.query(
      `SELECT id FROM app.lists WHERE user_id = $1 AND slug = $2`,
      [userId, slug]
    );

    if (existsResult.rows.length > 0) {
      return NextResponse.json(
        { error: 'Ya tienes una lista con ese nombre' },
        { status: 400 }
      );
    }

    // Crear la lista
    const createResult = await pool.query(
      `INSERT INTO app.lists (user_id, name, slug, is_public, is_default)
       VALUES ($1, $2, $3, $4, FALSE)
       RETURNING id, name, slug, is_public, created_at`,
      [userId, name, slug, isPublic]
    );

    const newList = createResult.rows[0];

    console.log(`✅ Lista creada: ${name} (ID: ${newList.id}) para user ${userId}`);

    return NextResponse.json({
      success: true,
      list: {
        id: newList.id.toString(),
        name: newList.name,
        slug: newList.slug,
        isPublic: newList.is_public,
        itemsCount: 0,
        createdAt: newList.created_at,
      },
    });

  } catch (error: any) {
    console.error('❌ Error en POST /api/user/lists:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
