/**
 * ========================================
 * API ROUTE: GÉNEROS
 * ========================================
 * 
 * GET /api/genres
 * - Obtiene todos los géneros disponibles
 */

import { NextResponse } from 'next/server';
import { pool } from '@/lib/database';

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        code,
        name_es,
        name_en,
        name_ja,
        description_es,
        description_en,
        is_active
      FROM app.genres
      WHERE is_active = true
      ORDER BY name_es ASC
    `);

    const genres = result.rows.map(row => ({
      id: row.id,
      code: row.code,
      nameEs: row.name_es,
      nameEn: row.name_en,
      nameJa: row.name_ja,
      descriptionEs: row.description_es,
      descriptionEn: row.description_en,
      isActive: row.is_active,
    }));

    return NextResponse.json({
      success: true,
      genres,
      total: genres.length,
    });

  } catch (error) {
    console.error('❌ Error en GET /api/genres:', error);
    return NextResponse.json(
      { error: 'Error al obtener géneros' },
      { status: 500 }
    );
  }
}
