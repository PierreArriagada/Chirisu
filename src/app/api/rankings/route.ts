import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

/**
 * ============================================
 * API ENDPOINT: GET /api/rankings
 * ============================================
 * 
 * Descripción:
 * Obtiene rankings de anime, manga o novelas usando vistas materializadas
 * optimizadas que se actualizan cada 5 horas automáticamente.
 * 
 * Query Params:
 * - type: 'anime' | 'manga' | 'novel' (required)
 * - period: 'daily' | 'weekly' | 'monthly' | 'all_time' (required)
 * - limit: número de resultados (default: 10, max: 100)
 * 
 * Ejemplos de uso:
 * - GET /api/rankings?type=anime&period=daily&limit=10
 * - GET /api/rankings?type=manga&period=weekly&limit=20
 * - GET /api/rankings?type=anime&period=all_time&limit=100
 * 
 * Performance:
 * - Tiempo de respuesta: < 10ms (consulta a vista materializada)
 * - Datos actualizados: cada 5 horas automáticamente
 * - Cache: Datos pre-calculados en base de datos
 * ============================================
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const period = searchParams.get('period');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Validación de parámetros
    if (!type || !['anime', 'manga', 'novel'].includes(type)) {
      return NextResponse.json(
        { error: 'Parámetro "type" requerido: anime, manga, o novel' },
        { status: 400 }
      );
    }

    if (!period || !['daily', 'weekly', 'monthly', 'all_time'].includes(period)) {
      return NextResponse.json(
        { error: 'Parámetro "period" requerido: daily, weekly, monthly, o all_time' },
        { status: 400 }
      );
    }

    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'El límite debe estar entre 1 y 100' },
        { status: 400 }
      );
    }

    let rankings: any[] = [];

    // ============================================
    // Seleccionar función optimizada según el período
    // Usa vistas materializadas para performance ultra-rápida
    // ============================================
    switch (period) {
      case 'daily':
        // Top Daily: Basado en actividad de las últimas 24 horas
        const dailyResult = await pool.query(
          'SELECT * FROM app.get_cached_daily_ranking($1, $2)',
          [type, limit]
        );
        rankings = dailyResult.rows.map((row, index) => ({
          id: row.media_id,
          slug: row.slug,
          title: row.title,
          coverImage: row.cover_image_url,
          averageScore: parseFloat(row.average_score) || 0,
          score: parseFloat(row.daily_score) || 0,
          ranking: row.rank_position || (index + 1), // Usa rank_position de la vista
          period: 'daily'
        }));
        break;

      case 'weekly':
        // Top Weekly: Basado en actividad de los últimos 7 días
        const weeklyResult = await pool.query(
          'SELECT * FROM app.get_cached_weekly_ranking($1, $2)',
          [type, limit]
        );
        rankings = weeklyResult.rows.map((row, index) => ({
          id: row.media_id,
          slug: row.slug,
          title: row.title,
          coverImage: row.cover_image_url,
          averageScore: parseFloat(row.average_score) || 0,
          score: parseFloat(row.weekly_score) || 0,
          ranking: row.rank_position || (index + 1), // Usa rank_position de la vista
          period: 'weekly'
        }));
        break;

      case 'monthly':
        // Top Monthly: Usa weekly con mayor peso en popularidad
        // Nota: Por ahora usa la misma lógica que weekly
        // TODO: Crear vista materializada específica para monthly si es necesario
        const monthlyResult = await pool.query(
          'SELECT * FROM app.get_cached_weekly_ranking($1, $2)',
          [type, limit]
        );
        rankings = monthlyResult.rows.map((row, index) => ({
          id: row.media_id,
          slug: row.slug,
          title: row.title,
          coverImage: row.cover_image_url,
          averageScore: parseFloat(row.average_score) || 0,
          score: parseFloat(row.weekly_score) || 0,
          ranking: row.rank_position || (index + 1), // Usa rank_position de la vista
          period: 'monthly'
        }));
        break;

      case 'all_time':
        // Top All-Time: Ranking histórico con Bayesian average
        const allTimeResult = await pool.query(
          'SELECT * FROM app.get_cached_alltime_ranking($1, $2)',
          [type, limit]
        );
        rankings = allTimeResult.rows.map((row, index) => ({
          id: row.media_id,
          slug: row.slug,
          title: row.title,
          coverImage: row.cover_image_url,
          averageScore: parseFloat(row.average_score) || 0,
          ratingsCount: row.ratings_count || 0,
          bayesianScore: parseFloat(row.bayesian_score) || 0,
          ranking: row.rank_position || (index + 1), // Usa rank_position de la vista
          period: 'all_time'
        }));
        break;
    }

    return NextResponse.json({
      type,
      period,
      count: rankings.length,
      rankings
    });

  } catch (error) {
    console.error('Error en /api/rankings:', error);
    return NextResponse.json(
      { error: 'Error al obtener rankings' },
      { status: 500 }
    );
  }
}
