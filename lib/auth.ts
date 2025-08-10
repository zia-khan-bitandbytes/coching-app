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

export interface Coach {
  id: string
  user_id: string
  business_name: string
  bio?: string
  specialization?: string
  hourly_rate?: number
}

export interface AuthenticatedUser extends User {
  coach_id?: string
  business_name?: string
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
    const result = await pool.query(`
      SELECT u.id, u.email, u.name, u.role, u.created_at, c.id as coach_id, c.business_name
      FROM users u
      LEFT JOIN coaches c ON u.id = c.user_id
      WHERE u.id = $1
    `, [userId])

    if (result.rows.length === 0) {
      return null
    }

    const user = result.rows[0] as AuthenticatedUser
    return user
  } catch (error) {
    console.error('Error verifying user:', error)
    return null
  }
}

// Get user with coach information
export async function getUserWithCoachInfo(userId: string): Promise<AuthenticatedUser | null> {
  try {
    const result = await pool.query(`
      SELECT u.id, u.email, u.name, u.role, u.created_at, c.id as coach_id, c.business_name
      FROM users u
      LEFT JOIN coaches c ON u.id = c.user_id
      WHERE u.id = $1
    `, [userId])

    if (result.rows.length === 0) {
      return null
    }

    return result.rows[0] as AuthenticatedUser
  } catch (error) {
    console.error('Error getting user with coach info:', error)
    return null
  }
}

// Get coach information
export async function getCoachInfo(coachId: string): Promise<Coach | null> {
  try {
    const result = await pool.query(`
      SELECT c.id, c.user_id, c.business_name, c.bio, c.specialization, c.hourly_rate
      FROM coaches c
      WHERE c.id = $1
    `, [coachId])

    if (result.rows.length === 0) {
      return null
    }

    return result.rows[0] as Coach
  } catch (error) {
    console.error('Error getting coach info:', error)
    return null
  }
}

// Get all coaches (for admin)
export async function getAllCoaches(): Promise<Coach[]> {
  try {
    const result = await pool.query(`
      SELECT c.id, c.user_id, c.business_name, c.bio, c.specialization, c.hourly_rate,
             u.name, u.email, u.created_at
      FROM coaches c
      JOIN users u ON c.user_id = u.id
      ORDER BY c.created_at DESC
    `)

    return result.rows as Coach[]
  } catch (error) {
    console.error('Error getting all coaches:', error)
    return []
  }
}

// Get coach's customers
export async function getCoachCustomers(coachId: string): Promise<any[]> {
  try {
    const result = await pool.query(`
      SELECT u.id, u.name, u.email, u.created_at, cc.status, cc.assigned_at
      FROM users u
      JOIN coach_customers cc ON u.id = cc.customer_id
      WHERE cc.coach_id = $1
      ORDER BY cc.assigned_at DESC
    `, [coachId])

    return result.rows
  } catch (error) {
    console.error('Error getting coach customers:', error)
    return []
  }
}

// Get customer's coach
export async function getCustomerCoach(customerId: string): Promise<Coach | null> {
  try {
    const result = await pool.query(`
      SELECT c.id, c.user_id, c.business_name, c.bio, c.specialization, c.hourly_rate
      FROM coaches c
      JOIN coach_customers cc ON c.id = cc.coach_id
      WHERE cc.customer_id = $1
    `, [customerId])

    if (result.rows.length === 0) {
      return null
    }

    return result.rows[0] as Coach
  } catch (error) {
    console.error('Error getting customer coach:', error)
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