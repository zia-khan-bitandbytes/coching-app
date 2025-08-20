import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { coachId: string } }
) {
  try {
    const { coachId } = await params

    // Get coach programs with enrollment counts and revenue
    const programsResult = await pool.query(`
      SELECT 
        cp.id,
        cp.name,
        cp.description,
        cp.price,
        cp.is_active,
        cp.created_at,
        COUNT(up.id) as members_count,
        COALESCE(SUM(p.amount), 0) as total_revenue
      FROM coaching_programs cp
      LEFT JOIN user_programs up ON cp.id = up.program_id AND up.status = 'active'
      LEFT JOIN payments p ON cp.id = p.program_id AND p.status = 'completed'
      WHERE cp.coach_id = $1
      GROUP BY cp.id, cp.name, cp.description, cp.price, cp.is_active, cp.created_at
      ORDER BY cp.created_at DESC
    `, [coachId])

    const programs = programsResult.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      price: parseFloat(row.price),
      is_active: row.is_active,
      created_at: row.created_at,
      members_count: parseInt(row.members_count),
      total_revenue: parseFloat(row.total_revenue)
    }))

    return NextResponse.json({
      success: true,
      programs: programs
    })
  } catch (error) {
    console.error('Error fetching coach programs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch coach programs' },
      { status: 500 }
    )
  }
} 