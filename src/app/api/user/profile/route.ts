/**
 * ========================================
 * API ROUTE: PERFIL DE USUARIO
 * GET /api/user/profile
 * ========================================
 * 
 * Obtiene los datos completos del usuario autenticado:
 * - Información básica (nombre, email, avatar)
 * - Listas predefinidas (pending, following, watched, favorites)
 * - Listas personalizadas
 * - Configuración de privacidad
 */

import 'server-only';

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/database';

// ============================================
// TIPOS
// ============================================

interface UserProfileData {
  id: number;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  isAdmin: boolean;
  isModerator: boolean;
  createdAt: string;
  
  // Listas predefinidas con items
  lists: {
    pending: ListItem[];
    following: ListItem[];
    watched: ListItem[];
    favorites: ListItem[];
  };
  
  // Configuración de privacidad de listas
  listSettings: {
    pending: 'public' | 'private';
    following: 'public' | 'private';
    watched: 'public' | 'private';
    favorites: 'public' | 'private';
  };
  
  // Listas personalizadas
  customLists: CustomList[];
  
  // Contribuciones aprobadas
  contributions: UserContribution[];
}

interface ListItem {
  id: string;              // list_item_id
  mediaId: string;         // anime/manga/novel ID
  title: string;
  type: string;
  slug: string;
  imageUrl: string;
  rating?: number;
  addedAt: string;
}

interface CustomList {
  id: string;
  name: string;
  isPublic: boolean;
  items: ListItem[];
  createdAt: string;
}

interface UserContribution {
  id: string;
  contributionType: 'full' | 'modification' | 'report';
  mediaType: 'anime' | 'manga' | 'novel';
  mediaTitle: string;
  status: 'pending' | 'approved' | 'rejected';
  awardedPoints: number;
  createdAt: string;
  reviewedAt: string | null;
  rejectionReason: string | null;
  contributionData: any;
}

// ============================================
// ENDPOINT: GET /api/user/profile
// ============================================

export async function GET() {
  try {
    // 1. VERIFICAR AUTENTICACIÓN
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado. Inicia sesión primero.' },
        { status: 401 }
      );
    }

    const userId = currentUser.userId;

    // 2. OBTENER DATOS BÁSICOS DEL USUARIO CON ROLES
    const userResult = await db.query<{
      id: number;
      email: string;
      username: string;
      display_name: string | null;
      avatar_url: string | null;
      bio: string | null;
      created_at: Date;
    }>(
      `SELECT 
        id, email, username, display_name, avatar_url, bio, created_at
       FROM app.users 
       WHERE id = $1 AND deleted_at IS NULL`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];

    // 2.1. OBTENER ROLES DEL USUARIO
    const rolesResult = await db.query<{
      role_name: string;
    }>(
      `SELECT r.name as role_name
       FROM app.user_roles ur
       JOIN app.roles r ON ur.role_id = r.id
       WHERE ur.user_id = $1`,
      [userId]
    );

    const userRoles = rolesResult.rows.map(r => r.role_name);
    const isAdmin = userRoles.includes('admin');
    const isModerator = userRoles.includes('moderator');

    // 3. OBTENER CONFIGURACIÓN DE PRIVACIDAD DE LISTAS (desde tabla lists)
    const settingsResult = await db.query<{
      slug: string;
      is_public: boolean;
    }>(
      `SELECT slug, is_public 
       FROM app.lists 
       WHERE user_id = $1 AND is_default = TRUE`,
      [userId]
    );

    // Convertir a objeto de configuración
    const listSettings: UserProfileData['listSettings'] = {
      pending: 'private',
      following: 'private',
      watched: 'private',
      favorites: 'private',
    };

    settingsResult.rows.forEach(row => {
      // Mapear slug de la lista a los nombres de las listas en el perfil
      const slugToListType: Record<string, keyof typeof listSettings> = {
        'por-ver': 'pending',
        'siguiendo': 'following',
        'completado': 'watched',
        'favoritos': 'favorites'
      };
      
      const listType = slugToListType[row.slug];
      if (listType) {
        listSettings[listType] = row.is_public ? 'public' : 'private';
      }
    });

    // 4. OBTENER ITEMS DE LAS LISTAS PREDEFINIDAS
    const listsResult = await db.query<{
      list_slug: string;
      list_item_id: number;
      media_id: number;
      media_type: string;
      title: string;
      slug: string | null;
      image_url: string | null;
      average_rating: number | null;
      added_at: Date;
    }>(
      `SELECT 
        l.slug as list_slug,
        li.id as list_item_id,
        li.listable_id as media_id,
        li.listable_type as media_type,
        COALESCE(
          a.title_romaji, 
          m.title_romaji, 
          n.title_romaji,
          d.title_romaji,
          mh.title_romaji,
          mw.title_romaji,
          fc.title
        ) as title,
        COALESCE(
          a.slug, 
          m.slug, 
          n.slug,
          d.slug,
          mh.slug,
          mw.slug,
          fc.slug
        ) as slug,
        COALESCE(
          a.cover_image_url, 
          m.cover_image_url, 
          n.cover_image_url,
          d.cover_image_url,
          mh.cover_image_url,
          mw.cover_image_url,
          fc.cover_image_url
        ) as image_url,
        COALESCE(a.average_score, m.average_score, n.average_score, d.average_score, mh.average_score, mw.average_score, fc.average_score) as average_rating,
        li.created_at as added_at
       FROM app.lists l
       JOIN app.list_items li ON l.id = li.list_id
       LEFT JOIN app.anime a ON (li.listable_type = 'anime' AND li.listable_id = a.id)
       LEFT JOIN app.manga m ON (li.listable_type = 'manga' AND li.listable_id = m.id)
       LEFT JOIN app.novels n ON (li.listable_type = 'novel' AND li.listable_id = n.id)
       LEFT JOIN app.donghua d ON (li.listable_type = 'donghua' AND li.listable_id = d.id)
       LEFT JOIN app.manhua mh ON (li.listable_type = 'manhua' AND li.listable_id = mh.id)
       LEFT JOIN app.manhwa mw ON (li.listable_type = 'manhwa' AND li.listable_id = mw.id)
       LEFT JOIN app.fan_comics fc ON (li.listable_type = 'fan_comic' AND li.listable_id = fc.id)
       WHERE l.user_id = $1 AND l.is_default = TRUE
         AND (
           (li.listable_type = 'anime' AND a.id IS NOT NULL) OR
           (li.listable_type = 'manga' AND m.id IS NOT NULL) OR
           (li.listable_type = 'novel' AND n.id IS NOT NULL) OR
           (li.listable_type = 'donghua' AND d.id IS NOT NULL) OR
           (li.listable_type = 'manhua' AND mh.id IS NOT NULL) OR
           (li.listable_type = 'manhwa' AND mw.id IS NOT NULL) OR
           (li.listable_type = 'fan_comic' AND fc.id IS NOT NULL)
         )
       ORDER BY li.created_at DESC`,
      [userId]
    );

    // Organizar items por tipo de lista
    const lists: UserProfileData['lists'] = {
      pending: [],
      following: [],
      watched: [],
      favorites: [],
    };

    // Función para normalizar el tipo de media
    const normalizeMediaType = (dbType: string): string => {
      const typeMap: Record<string, string> = {
        'anime': 'Anime',
        'manga': 'Manga',
        'novel': 'Novela',
        'donghua': 'Donghua',
        'manhua': 'Manhua',
        'manhwa': 'Manhwa',
        'fan_comic': 'Fan Comic',
      };
      return typeMap[dbType] || dbType;
    };

    listsResult.rows.forEach(row => {
      const item: ListItem = {
        id: row.list_item_id.toString(),
        mediaId: row.media_id.toString(),
        title: row.title,
        type: normalizeMediaType(row.media_type),
        slug: row.slug || '',
        imageUrl: row.image_url || 'https://placehold.co/400x600?text=No+Image',
        rating: row.average_rating || undefined,
        addedAt: row.added_at.toISOString(),
      };

      // Mapear slug de la lista a los nombres de las listas en el perfil
      const slugToListType: Record<string, keyof typeof lists> = {
        'por-ver': 'pending',
        'siguiendo': 'following',
        'completado': 'watched',
        'favoritos': 'favorites'
      };
      
      const listType = slugToListType[row.list_slug];
      if (listType) {
        lists[listType].push(item);
      }
    });

    // 5. OBTENER LISTAS PERSONALIZADAS (listas no predefinidas)
    const customListsResult = await db.query<{
      id: number;
      name: string;
      is_public: boolean;
      created_at: Date;
    }>(
      `SELECT id, name, is_public, created_at 
       FROM app.lists 
       WHERE user_id = $1 AND is_default = FALSE
       ORDER BY created_at DESC`,
      [userId]
    );

    const customLists: CustomList[] = [];

    // Para cada lista personalizada, obtener sus items
    for (const customList of customListsResult.rows) {
      const itemsResult = await db.query<{
        list_item_id: number;
        media_id: number;
        media_type: string;
        title: string;
        slug: string | null;
        image_url: string | null;
        average_rating: number | null;
        added_at: Date;
      }>(
        `SELECT 
          li.id as list_item_id,
          li.listable_id as media_id,
          li.listable_type as media_type,
          COALESCE(
            a.title_romaji, 
            m.title_romaji, 
            n.title_romaji,
            d.title_romaji,
            mh.title_romaji,
            mw.title_romaji,
            fc.title
          ) as title,
          COALESCE(
            a.slug, 
            m.slug, 
            n.slug,
            d.slug,
            mh.slug,
            mw.slug,
            fc.slug
          ) as slug,
          COALESCE(
            a.cover_image_url, 
            m.cover_image_url, 
            n.cover_image_url,
            d.cover_image_url,
            mh.cover_image_url,
            mw.cover_image_url,
            fc.cover_image_url
          ) as image_url,
          COALESCE(a.average_score, m.average_score, n.average_score, d.average_score, mh.average_score, mw.average_score, fc.average_score) as average_rating,
          li.created_at as added_at
         FROM app.list_items li
         LEFT JOIN app.anime a ON (li.listable_type = 'anime' AND li.listable_id = a.id)
         LEFT JOIN app.manga m ON (li.listable_type = 'manga' AND li.listable_id = m.id)
         LEFT JOIN app.novels n ON (li.listable_type = 'novel' AND li.listable_id = n.id)
         LEFT JOIN app.donghua d ON (li.listable_type = 'donghua' AND li.listable_id = d.id)
         LEFT JOIN app.manhua mh ON (li.listable_type = 'manhua' AND li.listable_id = mh.id)
         LEFT JOIN app.manhwa mw ON (li.listable_type = 'manhwa' AND li.listable_id = mw.id)
         LEFT JOIN app.fan_comics fc ON (li.listable_type = 'fan_comic' AND li.listable_id = fc.id)
         WHERE li.list_id = $1
           AND (
             (li.listable_type = 'anime' AND a.id IS NOT NULL) OR
             (li.listable_type = 'manga' AND m.id IS NOT NULL) OR
             (li.listable_type = 'novel' AND n.id IS NOT NULL) OR
             (li.listable_type = 'donghua' AND d.id IS NOT NULL) OR
             (li.listable_type = 'manhua' AND mh.id IS NOT NULL) OR
             (li.listable_type = 'manhwa' AND mw.id IS NOT NULL) OR
             (li.listable_type = 'fan_comic' AND fc.id IS NOT NULL)
           )
         ORDER BY li.created_at DESC`,
        [customList.id]
      );

      const items: ListItem[] = itemsResult.rows.map(row => ({
        id: row.list_item_id.toString(),
        mediaId: row.media_id.toString(),
        title: row.title,
        type: normalizeMediaType(row.media_type),
        slug: row.slug || '',
        imageUrl: row.image_url || 'https://placehold.co/400x600?text=No+Image',
        rating: row.average_rating || undefined,
        addedAt: row.added_at.toISOString(),
      }));

      customLists.push({
        id: customList.id.toString(),
        name: customList.name,
        isPublic: customList.is_public,
        items,
        createdAt: customList.created_at.toISOString(),
      });
    }

    // 6. OBTENER TODAS LAS CONTRIBUCIONES DEL USUARIO
    // Combinar user_contributions (creación) y content_contributions (ediciones)
    const contributionsResult = await db.query<{
      id: number;
      contribution_source: string;
      contribution_data: any;
      contributable_type: string;
      status: string;
      awarded_points: number | null;
      created_at: Date;
      reviewed_at: Date | null;
      rejection_reason: string | null;
      media_title: string | null;
    }>(
      `
      -- Contribuciones de creación (user_contributions)
      SELECT 
        uc.id,
        'user_contribution' as contribution_source,
        uc.contribution_data,
        uc.contributable_type,
        uc.status,
        uc.awarded_points,
        uc.created_at,
        uc.reviewed_at,
        uc.rejection_reason,
        COALESCE(
          a.title_romaji,
          m.title_romaji,
          n.title_romaji
        ) as media_title
       FROM app.user_contributions uc
       LEFT JOIN app.anime a ON (uc.contributable_type = 'anime' AND uc.contributable_id = a.id)
       LEFT JOIN app.manga m ON (uc.contributable_type = 'manga' AND uc.contributable_id = m.id)
       LEFT JOIN app.novels n ON (uc.contributable_type = 'novel' AND uc.contributable_id = n.id)
       WHERE uc.user_id = $1
       
      UNION ALL
       
      -- Contribuciones de edición (content_contributions)
      SELECT 
        cc.id,
        'content_contribution' as contribution_source,
        cc.proposed_changes as contribution_data,
        cc.contributable_type,
        cc.status,
        NULL as awarded_points,
        cc.created_at,
        cc.reviewed_at,
        cc.moderator_notes as rejection_reason,
        COALESCE(
          a.title_romaji,
          m.title_romaji,
          n.title_romaji,
          d.title_romaji,
          mh.title_romaji,
          mw.title_romaji,
          fc.title_romaji
        ) as media_title
       FROM app.content_contributions cc
       LEFT JOIN app.anime a ON (cc.contributable_type = 'anime' AND cc.contributable_id = a.id)
       LEFT JOIN app.manga m ON (cc.contributable_type = 'manga' AND cc.contributable_id = m.id)
       LEFT JOIN app.novels n ON (cc.contributable_type = 'novel' AND cc.contributable_id = n.id)
       LEFT JOIN app.donghua d ON (cc.contributable_type = 'donghua' AND cc.contributable_id = d.id)
       LEFT JOIN app.manhua mh ON (cc.contributable_type = 'manhua' AND cc.contributable_id = mh.id)
       LEFT JOIN app.manhwa mw ON (cc.contributable_type = 'manhwa' AND cc.contributable_id = mw.id)
       LEFT JOIN app.fan_comic fc ON (cc.contributable_type = 'fan_comic' AND cc.contributable_id = fc.id)
       WHERE cc.contributor_user_id = $1 AND cc.deleted_at IS NULL
       
       ORDER BY created_at DESC
       LIMIT 20
      `,
      [userId]
    );

    const contributions: UserContribution[] = contributionsResult.rows.map(row => {
      const data = row.contribution_data || {};
      
      // Determinar tipo de contribución
      let contributionType: 'full' | 'modification' | 'report' = 'modification';
      
      if (row.contribution_source === 'content_contribution') {
        // Las ediciones siempre son 'modification'
        contributionType = 'modification';
      } else if (data.type === 'full' || data.isFullEntry) {
        contributionType = 'full';
      } else if (data.type === 'report' || data.reportReason) {
        contributionType = 'report';
      }

      // Mapear estados (content_contributions usa 'in_review' y 'needs_changes')
      let status: 'pending' | 'approved' | 'rejected' = 'pending';
      if (row.status === 'approved') {
        status = 'approved';
      } else if (row.status === 'rejected' || row.status === 'needs_changes') {
        status = 'rejected';
      } else {
        status = 'pending'; // pending, in_review
      }

      return {
        id: row.id.toString(),
        contributionType,
        mediaType: row.contributable_type as 'anime' | 'manga' | 'novel',
        mediaTitle: row.media_title || data.title || 'Desconocido',
        status,
        awardedPoints: row.awarded_points || 0,
        createdAt: row.created_at.toISOString(),
        reviewedAt: row.reviewed_at ? row.reviewed_at.toISOString() : null,
        rejectionReason: row.rejection_reason,
        contributionData: data,
      };
    });

    // 7. PREPARAR RESPUESTA
    const profileData: UserProfileData = {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.display_name || user.username,
      avatarUrl: user.avatar_url,
      bio: user.bio,
      isAdmin: isAdmin,
      isModerator: isModerator,
      createdAt: user.created_at.toISOString(),
      lists,
      listSettings,
      customLists,
      contributions,
    };

    return NextResponse.json({
      success: true,
      profile: profileData,
    });

  } catch (error) {
    console.error('❌ Error en GET /api/user/profile:', error);
    
    return NextResponse.json(
      { error: 'Error al obtener perfil de usuario' },
      { status: 500 }
    );
  }
}

// ============================================
// ENDPOINT: PATCH /api/user/profile
// Actualizar información del perfil
// ============================================

interface UpdateProfileBody {
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  date_of_birth?: string;
  nationality_code?: string;
  nationality_name?: string;
  nationality_flag_url?: string;
  locale?: string;
}

export async function PATCH(request: Request) {
  try {
    // 1. VERIFICAR AUTENTICACIÓN
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado. Inicia sesión primero.' },
        { status: 401 }
      );
    }

    const userId = currentUser.userId;

    // 2. PARSEAR BODY
    const body: UpdateProfileBody = await request.json();
    const { 
      display_name, 
      avatar_url, 
      bio, 
      date_of_birth,
      nationality_code,
      nationality_name,
      nationality_flag_url,
      locale 
    } = body;

    // Validaciones básicas
    if (display_name !== undefined && display_name.trim().length === 0) {
      return NextResponse.json(
        { error: 'El nombre no puede estar vacío' },
        { status: 400 }
      );
    }

    if (display_name !== undefined && display_name.length > 120) {
      return NextResponse.json(
        { error: 'El nombre es demasiado largo (máximo 120 caracteres)' },
        { status: 400 }
      );
    }

    if (bio !== undefined && bio.length > 200) {
      return NextResponse.json(
        { error: 'La biografía es demasiado larga (máximo 200 caracteres)' },
        { status: 400 }
      );
    }

    if (date_of_birth !== undefined) {
      const birthDate = new Date(date_of_birth);
      const today = new Date();
      if (birthDate > today) {
        return NextResponse.json(
          { error: 'La fecha de nacimiento no puede ser futura' },
          { status: 400 }
        );
      }
    }

    // 3. CONSTRUIR QUERY DINÁMICO
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (display_name !== undefined) {
      updates.push(`display_name = $${paramIndex++}`);
      values.push(display_name.trim());
    }

    if (avatar_url !== undefined) {
      updates.push(`avatar_url = $${paramIndex++}`);
      values.push(avatar_url || null);
    }

    if (bio !== undefined) {
      updates.push(`bio = $${paramIndex++}`);
      values.push(bio.trim() || null);
    }

    if (date_of_birth !== undefined) {
      updates.push(`date_of_birth = $${paramIndex++}`);
      values.push(date_of_birth || null);
    }

    if (nationality_code !== undefined) {
      updates.push(`nationality_code = $${paramIndex++}`);
      values.push(nationality_code || null);
    }

    if (nationality_name !== undefined) {
      updates.push(`nationality_name = $${paramIndex++}`);
      values.push(nationality_name || null);
    }

    if (nationality_flag_url !== undefined) {
      updates.push(`nationality_flag_url = $${paramIndex++}`);
      values.push(nationality_flag_url || null);
    }

    if (locale !== undefined) {
      updates.push(`locale = $${paramIndex++}`);
      values.push(locale);
    }

    // Si no hay nada que actualizar
    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No se proporcionaron campos para actualizar' },
        { status: 400 }
      );
    }

    // Agregar updated_at
    updates.push(`updated_at = NOW()`);

    // Agregar WHERE user_id
    values.push(userId);

    // 4. EJECUTAR UPDATE
    const query = `
      UPDATE app.users 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, email, username, display_name, avatar_url, bio, 
                date_of_birth, nationality_code, nationality_name, 
                nationality_flag_url, locale
    `;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const updatedUser = result.rows[0];

    // 4.1. OBTENER ROLES DEL USUARIO ACTUALIZADO
    const rolesResult = await db.query<{
      role_name: string;
    }>(
      `SELECT r.name as role_name
       FROM app.user_roles ur
       JOIN app.roles r ON ur.role_id = r.id
       WHERE ur.user_id = $1`,
      [userId]
    );

    const userRoles = rolesResult.rows.map(r => r.role_name);
    const isAdmin = userRoles.includes('admin');
    const isModerator = userRoles.includes('moderator');

    // 5. REGISTRAR EN AUDIT LOG
    await db.query(
      `INSERT INTO app.audit_log (user_id, action, resource_type, resource_id, new_values)
       VALUES ($1, 'update_profile', 'user', $2, $3)`,
      [userId, userId, JSON.stringify(body)]
    );

    // 6. RETORNAR USUARIO ACTUALIZADO
    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        displayName: updatedUser.display_name || updatedUser.username,
        avatarUrl: updatedUser.avatar_url,
        bio: updatedUser.bio,
        isAdmin: isAdmin,
        isModerator: isModerator,
      },
    });

  } catch (error) {
    console.error('❌ Error en PATCH /api/user/profile:', error);
    
    return NextResponse.json(
      { error: 'Error al actualizar perfil' },
      { status: 500 }
    );
  }
}
