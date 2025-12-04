/**
 * API: Solicitudes de Scanlator
 * GET /api/scan/requests - Listar solicitudes (admin) o mi solicitud (usuario)
 * POST /api/scan/requests - Crear nueva solicitud
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';
import { getCurrentUser } from '@/lib/auth';

// GET: Listar solicitudes
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');

    // Si es admin, puede ver todas las solicitudes
    if (session.isAdmin) {
      let query = `
        SELECT 
          sr.*,
          u.username,
          u.email,
          u.avatar_url,
          u.display_name,
          reviewer.username as reviewer_username
        FROM app.scan_requests sr
        JOIN app.users u ON sr.user_id = u.id
        LEFT JOIN app.users reviewer ON sr.reviewed_by = reviewer.id
        WHERE 1=1
      `;
      const params: any[] = [];
      
      if (status) {
        query += ` AND sr.status = $1`;
        params.push(status);
      }
      
      query += ` ORDER BY sr.created_at DESC`;

      const result = await pool.query(query, params);

      return NextResponse.json({
        success: true,
        requests: result.rows.map(r => ({
          id: r.id,
          userId: r.user_id,
          username: r.username,
          email: r.email,
          displayName: r.display_name,
          avatarUrl: r.avatar_url,
          groupName: r.group_name,
          groupUrl: r.group_url,
          experience: r.experience,
          mediaTypes: r.media_types,
          languages: r.languages,
          portfolioUrls: r.portfolio_urls,
          status: r.status,
          reviewedBy: r.reviewer_username,
          reviewedAt: r.reviewed_at,
          rejectionReason: r.rejection_reason,
          createdAt: r.created_at,
        }))
      });
    }

    // Usuario normal: solo puede ver su propia solicitud
    const result = await pool.query(
      `SELECT * FROM app.scan_requests WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [session.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({
        success: true,
        request: null,
        canApply: true
      });
    }

    const r = result.rows[0];
    return NextResponse.json({
      success: true,
      request: {
        id: r.id,
        groupName: r.group_name,
        groupUrl: r.group_url,
        experience: r.experience,
        mediaTypes: r.media_types,
        languages: r.languages,
        portfolioUrls: r.portfolio_urls,
        status: r.status,
        rejectionReason: r.rejection_reason,
        createdAt: r.created_at,
      },
      canApply: r.status === 'rejected' // Puede volver a aplicar si fue rechazado
    });

  } catch (error) {
    console.error('Error en GET /api/scan/requests:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener solicitudes' },
      { status: 500 }
    );
  }
}

// POST: Crear nueva solicitud
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar si ya tiene el rol scan
    const roleCheck = await pool.query(
      `SELECT 1 FROM app.user_roles ur
       JOIN app.roles r ON ur.role_id = r.id
       WHERE ur.user_id = $1 AND r.name = 'scan'`,
      [session.userId]
    );

    if (roleCheck.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Ya tienes el rol de scanlator' },
        { status: 400 }
      );
    }

    // Verificar si ya tiene una solicitud pendiente
    const pendingCheck = await pool.query(
      `SELECT 1 FROM app.scan_requests WHERE user_id = $1 AND status = 'pending'`,
      [session.userId]
    );

    if (pendingCheck.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Ya tienes una solicitud pendiente' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { groupName, groupUrl, experience, mediaTypes, languages, portfolioUrls } = body;

    // Validaciones
    if (!groupName || !experience) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos: groupName, experience' },
        { status: 400 }
      );
    }

    if (experience.length < 50) {
      return NextResponse.json(
        { success: false, error: 'La experiencia debe tener al menos 50 caracteres' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO app.scan_requests 
        (user_id, group_name, group_url, experience, media_types, languages, portfolio_urls)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        session.userId,
        groupName,
        groupUrl || null,
        experience,
        mediaTypes || ['manga'],
        languages || ['es'],
        portfolioUrls || []
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Solicitud enviada exitosamente. Un administrador la revisará pronto.',
      request: {
        id: result.rows[0].id,
        status: result.rows[0].status,
        createdAt: result.rows[0].created_at
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error en POST /api/scan/requests:', error);
    
    if (error.code === '23505') {
      return NextResponse.json(
        { success: false, error: 'Ya tienes una solicitud pendiente' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Error al crear solicitud' },
      { status: 500 }
    );
  }
}
