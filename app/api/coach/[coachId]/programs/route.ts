import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ coachId: string }> }
) {
  try {
    const { coachId } = await params

    if (!coachId) {
      return NextResponse.json(
        { success: false, error: 'Coach ID is required' },
        { status: 400 }
      )
    }

    // First check if duration_days column exists
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'coaching_programs' 
      AND column_name = 'duration_days'
    `)

    const hasDurationColumn = columnCheck.rows.length > 0

    // Build query based on whether duration_days column exists
    let query: string
    let queryParams: any[]

    if (hasDurationColumn) {
      // Use the new query with duration_days
      query = `
        SELECT 
          cp.id,
          cp.name,
          cp.description,
          cp.price,
          cp.duration_days,
          cp.created_at,
          COUNT(up.id) as members_count,
          0 as total_revenue,
          -- Calculate monthly revenue for one-time payment tracking
          CASE 
            WHEN cp.duration_days > 0 THEN 
              ROUND((cp.price * COUNT(up.id)) / (cp.duration_days * 1.0 / 30), 2)
            ELSE 0 
          END as monthly_revenue
        FROM coaching_programs cp
        LEFT JOIN user_programs up ON cp.id = up.program_id AND up.status = 'active'
        WHERE cp.coach_id = $1
        GROUP BY cp.id, cp.name, cp.description, cp.price, cp.duration_days, cp.created_at
        ORDER BY cp.created_at DESC
      `
      queryParams = [coachId]
    } else {
      // Use the old query without duration_days
      query = `
        SELECT 
          cp.id,
          cp.name,
          cp.description,
          cp.price,
          cp.created_at,
          COUNT(up.id) as members_count,
          0 as total_revenue
        FROM coaching_programs cp
        LEFT JOIN user_programs up ON cp.id = up.program_id AND up.status = 'active'
        WHERE cp.coach_id = $1
        GROUP BY cp.id, cp.name, cp.description, cp.price, cp.created_at
        ORDER BY cp.created_at DESC
      `
      queryParams = [coachId]
    }

    const programsResult = await pool.query(query, queryParams)

    const programs = programsResult.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      price: parseFloat(row.price),
      duration_days: hasDurationColumn ? (parseInt(row.duration_days) || 30) : 30,
      created_at: row.created_at,
      members_count: parseInt(row.members_count),
      total_revenue: parseFloat(row.total_revenue),
      monthly_revenue: hasDurationColumn ? parseFloat(row.monthly_revenue) : (parseFloat(row.price) * parseInt(row.members_count) * 0.3) // Fallback calculation
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