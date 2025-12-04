/**
 * ========================================
 * HELPERS DE PERMISOS Y AUTORIZACIÓN
 * ========================================
 * 
 * Funciones para verificar roles y permisos de usuarios
 */

import 'server-only';
import { db } from './database';

// ============================================
// TIPOS
// ============================================

export type RoleName = 'admin' | 'moderator' | 'user' | 'scan';

export interface Permission {
  id: number;
  name: string;
  display_name: string;
  resource: string;
  action: string;
}

// ============================================
// VERIFICAR SI UN USUARIO TIENE UN ROL
// ============================================

export async function hasRole(
  userId: number,
  roleName: RoleName
): Promise<boolean> {
  try {
    const result = await db.query<{ has_role: boolean }>(
      `SELECT COUNT(*) > 0 as has_role
       FROM app.user_roles ur
       JOIN app.roles r ON ur.role_id = r.id
       WHERE ur.user_id = $1
       AND r.name = $2`,
      [userId, roleName]
    );

    return result.rows[0]?.has_role || false;
  } catch (error) {
    console.error('Error verificando rol:', error);
    return false;
  }
}

// ============================================
// VERIFICAR SI UN USUARIO TIENE UN PERMISO
// ============================================

export async function hasPermission(
  userId: number,
  permissionName: string
): Promise<boolean> {
  try {
    const result = await db.query<{ has_permission: boolean }>(
      `SELECT COUNT(*) > 0 as has_permission
       FROM app.user_roles ur
       JOIN app.role_permissions rp ON ur.role_id = rp.role_id
       JOIN app.permissions p ON rp.permission_id = p.id
       WHERE ur.user_id = $1
       AND p.name = $2`,
      [userId, permissionName]
    );

    return result.rows[0]?.has_permission || false;
  } catch (error) {
    console.error('Error verificando permiso:', error);
    return false;
  }
}

// ============================================
// VERIFICAR PERMISO POR RECURSO Y ACCIÓN
// ============================================

export async function hasPermissionFor(
  userId: number,
  resource: string,
  action: string
): Promise<boolean> {
  try {
    const result = await db.query<{ has_permission: boolean }>(
      `SELECT COUNT(*) > 0 as has_permission
       FROM app.user_roles ur
       JOIN app.role_permissions rp ON ur.role_id = rp.role_id
       JOIN app.permissions p ON rp.permission_id = p.id
       WHERE ur.user_id = $1
       AND p.resource = $2
       AND p.action = $3`,
      [userId, resource, action]
    );

    return result.rows[0]?.has_permission || false;
  } catch (error) {
    console.error('Error verificando permiso:', error);
    return false;
  }
}

// ============================================
// OBTENER TODOS LOS PERMISOS DE UN USUARIO
// ============================================

export async function getUserPermissions(
  userId: number
): Promise<Permission[]> {
  try {
    const result = await db.query<Permission>(
      `SELECT DISTINCT p.id, p.name, p.display_name, p.resource, p.action
       FROM app.user_roles ur
       JOIN app.role_permissions rp ON ur.role_id = rp.role_id
       JOIN app.permissions p ON rp.permission_id = p.id
       WHERE ur.user_id = $1
       ORDER BY p.resource, p.action`,
      [userId]
    );

    return result.rows;
  } catch (error) {
    console.error('Error obteniendo permisos:', error);
    return [];
  }
}

// ============================================
// OBTENER TODOS LOS ROLES DE UN USUARIO
// ============================================

export async function getUserRoles(userId: number): Promise<RoleName[]> {
  try {
    const result = await db.query<{ name: RoleName }>(
      `SELECT r.name
       FROM app.user_roles ur
       JOIN app.roles r ON ur.role_id = r.id
       WHERE ur.user_id = $1`,
      [userId]
    );

    return result.rows.map(row => row.name);
  } catch (error) {
    console.error('Error obteniendo roles:', error);
    return [];
  }
}

// ============================================
// VERIFICAR SI ES ADMIN
// ============================================

export async function isAdmin(userId: number): Promise<boolean> {
  return hasRole(userId, 'admin');
}

// ============================================
// VERIFICAR SI ES MODERADOR
// ============================================

export async function isModerator(userId: number): Promise<boolean> {
  return hasRole(userId, 'moderator');
}

// ============================================
// VERIFICAR SI ES ADMIN O MODERADOR
// ============================================

export async function isAdminOrModerator(userId: number): Promise<boolean> {
  const roles = await getUserRoles(userId);
  return roles.includes('admin') || roles.includes('moderator');
}

// ============================================
// VERIFICAR SI ES SCANLATOR
// ============================================

export async function isScanlator(userId: number): Promise<boolean> {
  return hasRole(userId, 'scan');
}

// ============================================
// MIDDLEWARE: REQUIERE PERMISO
// ============================================

export async function requirePermission(
  userId: number,
  permissionName: string
): Promise<void> {
  const hasAccess = await hasPermission(userId, permissionName);
  
  if (!hasAccess) {
    throw new Error('Acceso denegado: No tienes permiso para realizar esta acción');
  }
}

// ============================================
// MIDDLEWARE: REQUIERE ROL
// ============================================

export async function requireRole(
  userId: number,
  roleName: RoleName
): Promise<void> {
  const hasRoleAccess = await hasRole(userId, roleName);
  
  if (!hasRoleAccess) {
    throw new Error(`Acceso denegado: Se requiere el rol de ${roleName}`);
  }
}

// ============================================
// MIDDLEWARE: REQUIERE ADMIN
// ============================================

export async function requireAdmin(userId: number): Promise<void> {
  await requireRole(userId, 'admin');
}

// ============================================
// MIDDLEWARE: REQUIERE MODERADOR O ADMIN
// ============================================

export async function requireModeratorOrAdmin(userId: number): Promise<void> {
  const isAuthorized = await isAdminOrModerator(userId);
  
  if (!isAuthorized) {
    throw new Error('Acceso denegado: Se requiere ser moderador o administrador');
  }
}
