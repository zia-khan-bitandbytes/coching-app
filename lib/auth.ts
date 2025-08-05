import { NextRequest } from 'next/server'
import pool from './db'

export type UserRole = 'coach' | 'customer' | 'super_admin'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  created_at: string
}

export interface AuthenticatedUser extends User {
  // Additional fields for authenticated user
}

// Role hierarchy - higher roles have access to lower roles
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  customer: 1,
  coach: 2,
  super_admin: 3
}

// Check if a user has the required role or higher
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

// Get user from request cookies (Edge Runtime compatible - no database calls)
export async function getUserFromRequest(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const userCookie = request.cookies.get('user')
    if (!userCookie?.value) {
      return null
    }

    const user = JSON.parse(userCookie.value) as AuthenticatedUser
    return user
  } catch (error) {
    console.error('Error parsing user cookie:', error)
    return null
  }
}

// Verify user exists in database and has valid role (for API routes only)
export async function verifyUser(userId: string): Promise<AuthenticatedUser | null> {
  try {
    const result = await pool.query(
      'SELECT id, email, name, role, created_at FROM users WHERE id = $1',
      [userId]
    )

    if (result.rows.length === 0) {
      return null
    }

    return result.rows[0] as AuthenticatedUser
  } catch (error) {
    console.error('Error verifying user:', error)
    return null
  }
}

// Check if user has access to a specific resource
export function canAccessResource(userRole: UserRole, resourceType: string, action: string): boolean {
  switch (resourceType) {
    case 'admin':
      return userRole === 'super_admin'
    case 'programs':
      return ['coach', 'super_admin'].includes(userRole)
    case 'payments':
      return ['coach', 'super_admin'].includes(userRole)
    case 'users':
      return userRole === 'super_admin'
    case 'dashboard':
      return true // All authenticated users can access dashboard
    default:
      return false
  }
}

// Get role display name
export function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case 'customer':
      return 'Customer'
    case 'coach':
      return 'Coach'
    case 'super_admin':
      return 'Super Admin'
    default:
      return 'Unknown'
  }
}

// Get role description
export function getRoleDescription(role: UserRole): string {
  switch (role) {
    case 'customer':
      return 'Access to coaching programs and progress tracking'
    case 'coach':
      return 'Can manage coaching programs and view customer data'
    case 'super_admin':
      return 'Full system access including user management and admin features'
    default:
      return 'Unknown role'
  }
} 