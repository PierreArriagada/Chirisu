import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';
import { getCurrentUser } from '@/lib/auth';

/**
 * ============================================
 * API ENDPOINT: GET /api/user/export
 * ============================================
 * 
 * Exporta todas las listas del usuario en formato CSV o Excel
 * Incluye: favoritos, listas por defecto, y listas personalizadas
 * Todos los tipos: anime, manga, novel, donghua, manhua, manhwa, fan_comic
 */

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'csv'; // 'csv' o 'json' (para Excel)
    const userId = currentUser.userId;

    // 1. OBTENER FAVORITOS
    const favoritesResult = await pool.query(
      `SELECT 
        'Favoritos' as lista,
        m.title,
        f.item_type as tipo,
        m.average_score as puntuacion,
        TO_CHAR(f.created_at, 'YYYY-MM-DD') as fecha_agregado,
        COALESCE(m.total_episodes, m.total_chapters, 0) as total_episodios,
        m.status as estado
      FROM app.user_favorites f
      LEFT JOIN (
        SELECT id, title, average_score, total_episodes, NULL as total_chapters, status, 'anime' as media_type FROM app.anime
        UNION ALL
        SELECT id, title, average_score, NULL, total_chapters, status, 'manga' FROM app.manga
        UNION ALL
        SELECT id, title, average_score, NULL, total_chapters, status, 'novel' FROM app.novels
        UNION ALL
        SELECT id, title, average_score, total_episodes, NULL, status, 'donghua' FROM app.donghua
        UNION ALL
        SELECT id, title, average_score, NULL, total_chapters, status, 'manhua' FROM app.manhua
        UNION ALL
        SELECT id, title, average_score, NULL, total_chapters, status, 'manhwa' FROM app.manhwa
        UNION ALL
        SELECT id, title, average_score, NULL, total_chapters, status, 'fan_comic' FROM app.fan_comic
      ) m ON f.item_id = m.id AND f.item_type = m.media_type
      WHERE f.user_id = $1
      ORDER BY f.created_at DESC`,
      [userId]
    );

    // 2. OBTENER LISTAS POR DEFECTO (Pendiente, Siguiendo, Completado)
    const defaultListsResult = await pool.query(
      `SELECT 
        l.name as lista,
        m.title,
        li.item_type as tipo,
        m.average_score as puntuacion,
        li.status as estado_usuario,
        li.score as mi_puntuacion,
        li.progress as progreso,
        TO_CHAR(li.added_at, 'YYYY-MM-DD') as fecha_agregado,
        COALESCE(m.total_episodes, m.total_chapters, 0) as total_episodios,
        m.status as estado
      FROM app.user_lists l
      INNER JOIN app.list_items li ON l.id = li.list_id
      LEFT JOIN (
        SELECT id, title, average_score, total_episodes, NULL as total_chapters, status, 'anime' as media_type FROM app.anime
        UNION ALL
        SELECT id, title, average_score, NULL, total_chapters, status, 'manga' FROM app.manga
        UNION ALL
        SELECT id, title, average_score, NULL, total_chapters, status, 'novel' FROM app.novels
        UNION ALL
        SELECT id, title, average_score, total_episodes, NULL, status, 'donghua' FROM app.donghua
        UNION ALL
        SELECT id, title, average_score, NULL, total_chapters, status, 'manhua' FROM app.manhua
        UNION ALL
        SELECT id, title, average_score, NULL, total_chapters, status, 'manhwa' FROM app.manhwa
        UNION ALL
        SELECT id, title, average_score, NULL, total_chapters, status, 'fan_comic' FROM app.fan_comic
      ) m ON li.item_id = m.id AND li.item_type = m.media_type
      WHERE l.user_id = $1 AND l.is_default = true
      ORDER BY l.name, li.added_at DESC`,
      [userId]
    );

    // 3. OBTENER LISTAS PERSONALIZADAS
    const customListsResult = await pool.query(
      `SELECT 
        l.name as lista,
        m.title,
        li.item_type as tipo,
        m.average_score as puntuacion,
        TO_CHAR(li.added_at, 'YYYY-MM-DD') as fecha_agregado,
        COALESCE(m.total_episodes, m.total_chapters, 0) as total_episodios,
        m.status as estado,
        l.is_public as lista_publica
      FROM app.user_lists l
      INNER JOIN app.list_items li ON l.id = li.list_id
      LEFT JOIN (
        SELECT id, title, average_score, total_episodes, NULL as total_chapters, status, 'anime' as media_type FROM app.anime
        UNION ALL
        SELECT id, title, average_score, NULL, total_chapters, status, 'manga' FROM app.manga
        UNION ALL
        SELECT id, title, average_score, NULL, total_chapters, status, 'novel' FROM app.novels
        UNION ALL
        SELECT id, title, average_score, total_episodes, NULL, status, 'donghua' FROM app.donghua
        UNION ALL
        SELECT id, title, average_score, NULL, total_chapters, status, 'manhua' FROM app.manhua
        UNION ALL
        SELECT id, title, average_score, NULL, total_chapters, status, 'manhwa' FROM app.manhwa
        UNION ALL
        SELECT id, title, average_score, NULL, total_chapters, status, 'fan_comic' FROM app.fan_comic
      ) m ON li.item_id = m.id AND li.item_type = m.media_type
      WHERE l.user_id = $1 AND l.is_default = false
      ORDER BY l.name, li.added_at DESC`,
      [userId]
    );

    // Combinar todos los datos
    const allData = [
      ...favoritesResult.rows,
      ...defaultListsResult.rows,
      ...customListsResult.rows
    ];

    if (format === 'csv') {
      // GENERAR CSV
      const headers = [
        'Lista',
        'Título',
        'Tipo',
        'Puntuación General',
        'Mi Puntuación',
        'Estado Usuario',
        'Progreso',
        'Total Episodios/Capítulos',
        'Estado',
        'Fecha Agregado'
      ];

      const csvRows = allData.map(row => [
        escapeCsvValue(row.lista || ''),
        escapeCsvValue(row.title || ''),
        escapeCsvValue(row.tipo || ''),
        row.puntuacion || '',
        row.mi_puntuacion || '',
        escapeCsvValue(row.estado_usuario || ''),
        row.progreso || '',
        row.total_episodios || '',
        escapeCsvValue(row.estado || ''),
        row.fecha_agregado || ''
      ]);

      const csv = [
        headers.join(','),
        ...csvRows.map(row => row.join(','))
      ].join('\n');

      // Agregar BOM para Excel UTF-8
      const bom = '\uFEFF';
      const csvWithBom = bom + csv;

      return new NextResponse(csvWithBom, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="chirisu-mis-listas-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    } else {
      // GENERAR JSON (para importar a Excel)
      return NextResponse.json({
        success: true,
        exportDate: new Date().toISOString(),
        totalItems: allData.length,
        data: allData.map(row => ({
          lista: row.lista,
          titulo: row.title,
          tipo: row.tipo,
          puntuacionGeneral: row.puntuacion,
          miPuntuacion: row.mi_puntuacion,
          estadoUsuario: row.estado_usuario,
          progreso: row.progreso,
          totalEpisodios: row.total_episodios,
          estado: row.estado,
          fechaAgregado: row.fecha_agregado,
          listaPublica: row.lista_publica
        }))
      });
    }

  } catch (error) {
    console.error('Error en GET /api/user/export:', error);
    return NextResponse.json(
      { error: 'Error al exportar datos' },
      { status: 500 }
    );
  }
}

// Helper para escapar valores CSV
function escapeCsvValue(value: string): string {
  if (!value) return '';
  
  // Si contiene coma, comillas o salto de línea, envolver en comillas
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    // Escapar comillas duplicándolas
    return `"${value.replace(/"/g, '""')}"`;
  }
  
  return value;
}
