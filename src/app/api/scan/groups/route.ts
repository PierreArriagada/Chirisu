/**
 * API: Grupos de Scanlation
 * GET /api/scan/groups - Buscar grupos por nombre
 * POST /api/scan/groups - Crear nuevo grupo
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';
import { getCurrentUser } from '@/lib/auth';

// Función para generar slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .replace(/[^a-z0-9\s-]/g, '') // Solo alfanuméricos
    .replace(/\s+/g, '-') // Espacios a guiones
    .replace(/-+/g, '-') // Múltiples guiones a uno
    .trim();
}

// GET: Buscar grupos de scanlation
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '10');

    let query = `
      SELECT 
        sg.id,
        sg.name,
        sg.slug,
        sg.website_url,
        sg.discord_url,
        sg.logo_url,
        sg.is_verified,
        sg.created_at,
        (SELECT COUNT(*) FROM app.scanlation_group_links sgl WHERE sgl.group_id = sg.id) as projects_count
      FROM app.scanlation_groups sg
    `;

    const params: any[] = [];

    if (search) {
      query += ` WHERE sg.name ILIKE $1`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY sg.is_verified DESC, sg.name ASC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);

    return NextResponse.json({
      success: true,
      groups: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        websiteUrl: row.website_url,
        discordUrl: row.discord_url,
        logoUrl: row.logo_url,
        isVerified: row.is_verified,
        projectsCount: parseInt(row.projects_count) || 0,
        createdAt: row.created_at,
      }))
    });

  } catch (error) {
    console.error('Error en GET /api/scan/groups:', error);
    return NextResponse.json(
      { success: false, error: 'Error al buscar grupos' },
      { status: 500 }
    );
  }
}

// POST: Crear nuevo grupo de scanlation
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    
    const body = await request.json();
    const { name, websiteUrl, discordUrl, description } = body;

    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'El nombre del grupo es requerido (mínimo 2 caracteres)' },
        { status: 400 }
      );
    }

    const slug = generateSlug(name.trim());

    // Verificar si ya existe
    const existingCheck = await pool.query(
      `SELECT id, name FROM app.scanlation_groups WHERE slug = $1 OR LOWER(name) = LOWER($2)`,
      [slug, name.trim()]
    );

    if (existingCheck.rows.length > 0) {
      // Retornar el grupo existente
      return NextResponse.json({
        success: true,
        exists: true,
        group: {
          id: existingCheck.rows[0].id,
          name: existingCheck.rows[0].name,
        },
        message: 'El grupo ya existe'
      });
    }

    // Crear nuevo grupo
    const result = await pool.query(
      `INSERT INTO app.scanlation_groups (name, slug, website_url, discord_url, description, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, slug, website_url, is_verified, created_at`,
      [name.trim(), slug, websiteUrl || null, discordUrl || null, description || null, session?.userId || null]
    );

    const group = result.rows[0];

    return NextResponse.json({
      success: true,
      exists: false,
      group: {
        id: group.id,
        name: group.name,
        slug: group.slug,
        websiteUrl: group.website_url,
        isVerified: group.is_verified,
        createdAt: group.created_at,
      },
      message: 'Grupo creado exitosamente'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error en POST /api/scan/groups:', error);

    if (error.code === '23505') {
      return NextResponse.json(
        { success: false, error: 'Ya existe un grupo con ese nombre' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Error al crear grupo' },
      { status: 500 }
    );
  }
}
