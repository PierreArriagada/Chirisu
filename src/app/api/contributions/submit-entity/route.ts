import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/database';

const VALID_ENTITY_TYPES = ['character', 'staff', 'voice_actor', 'studio', 'genre'];

/**
 * POST /api/contributions/submit-entity
 * Endpoint para enviar contribuciones de entidades (personajes, staff, estudios, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const currentUser = await getCurrentUser();
    
    if (!currentUser || !currentUser.userId) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Obtener datos del request
    const { entityType, contributionData } = await request.json();

    // Validar entityType
    if (!VALID_ENTITY_TYPES.includes(entityType)) {
      return NextResponse.json(
        { error: `Tipo de entidad inválido: ${entityType}` },
        { status: 400 }
      );
    }

    // Validar que hay datos
    if (!contributionData || typeof contributionData !== 'object') {
      return NextResponse.json(
        { error: 'Datos de contribución inválidos' },
        { status: 400 }
      );
    }

    // Insertar en user_contributions
    // El trigger se encargará de notificar a los moderadores
    const result = await db.query(
      `INSERT INTO app.user_contributions (
        user_id,
        contributable_type,
        contribution_data,
        status,
        created_at
      ) VALUES ($1, $2, $3, 'pending', NOW())
      RETURNING id`,
      [
        currentUser.userId,
        entityType,
        JSON.stringify(contributionData)
      ]
    );

    const contributionId = result.rows[0].id;

    console.log(`✅ Contribución creada: ID ${contributionId}, Tipo: ${entityType}, Usuario: ${currentUser.userId}`);

    return NextResponse.json({
      success: true,
      contributionId: contributionId.toString(),
      message: `Tu contribución de ${entityType} ha sido enviada para revisión.`,
    });

  } catch (error) {
    console.error('Error en /api/contributions/submit-entity:', error);
    return NextResponse.json(
      { 
        error: 'Error al procesar la contribución',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
