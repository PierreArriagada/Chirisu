/**
 * ========================================
 * API ROUTE: ASIGNAR REPORTE A MODERADOR
 * ========================================
 * 
 * POST /api/content-reports/[id]/assign
 * - Asigna un reporte al moderador actual
 * 
 * DELETE /api/content-reports/[id]/assign
 * - Libera la asignación del reporte
 */

import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/database';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    const { id } = await params;

    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    if (!currentUser.isAdmin && !currentUser.isModerator) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    // Verificar si el reporte existe y no está asignado
    const reportCheck = await db.query(
      `SELECT id, assigned_to, status 
       FROM app.content_reports 
       WHERE id = $1`,
      [id]
    );

    if (reportCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Reporte no encontrado' },
        { status: 404 }
      );
    }

    const report = reportCheck.rows[0];

    // Si ya está asignado a otro moderador
    if (report.assigned_to && report.assigned_to !== currentUser.userId) {
      const assignedUser = await db.query(
        `SELECT username, display_name FROM app.users WHERE id = $1`,
        [report.assigned_to]
      );

      return NextResponse.json(
        { 
          error: 'Este caso ya está asignado a otro moderador',
          assignedTo: assignedUser.rows[0]
        },
        { status: 409 }
      );
    }

    // Si ya está resuelto o descartado
    if (report.status === 'resolved' || report.status === 'dismissed') {
      return NextResponse.json(
        { error: 'Este reporte ya fue cerrado' },
        { status: 400 }
      );
    }

    // Asignar el reporte al moderador actual
    await db.query(
      `UPDATE app.content_reports 
       SET assigned_to = $1, 
           assigned_at = CURRENT_TIMESTAMP,
           status = 'in_review'
       WHERE id = $2`,
      [currentUser.userId, id]
    );

    return NextResponse.json({
      success: true,
      message: 'Caso asignado exitosamente',
    });

  } catch (error) {
    console.error('❌ Error en POST /api/content-reports/[id]/assign:', error);
    return NextResponse.json(
      { error: 'Error al asignar el caso' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    const { id } = await params;

    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    if (!currentUser.isAdmin && !currentUser.isModerator) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    // Verificar si el reporte existe
    const reportCheck = await db.query(
      `SELECT id, assigned_to, status FROM app.content_reports WHERE id = $1`,
      [id]
    );

    if (reportCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Reporte no encontrado' },
        { status: 404 }
      );
    }

    const report = reportCheck.rows[0];

    // Solo el admin o el moderador asignado pueden liberar el caso
    if (!currentUser.isAdmin && report.assigned_to !== currentUser.userId) {
      return NextResponse.json(
        { error: 'No puedes liberar este caso' },
        { status: 403 }
      );
    }

    // Liberar la asignación
    await db.query(
      `UPDATE app.content_reports 
       SET assigned_to = NULL, 
           assigned_at = NULL,
           status = 'pending'
       WHERE id = $1`,
      [id]
    );

    return NextResponse.json({
      success: true,
      message: 'Caso liberado exitosamente',
    });

  } catch (error) {
    console.error('❌ Error en DELETE /api/content-reports/[id]/assign:', error);
    return NextResponse.json(
      { error: 'Error al liberar el caso' },
      { status: 500 }
    );
  }
}
