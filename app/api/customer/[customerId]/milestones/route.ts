import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params

    // Get customer's milestone progress
    const milestonesResult = await pool.query(`
      SELECT 
        m.id,
        m.title,
        m.description,
        m.order_index,
        mp.completed,
        mp.completed_at,
        mp.notes,
        cp.name as program_name
      FROM milestones m
      JOIN coaching_programs cp ON m.program_id = cp.id
      JOIN user_programs up ON cp.id = up.program_id
      LEFT JOIN milestone_progress mp ON m.id = mp.milestone_id AND mp.user_id = $1
      WHERE up.user_id = $1
      ORDER BY m.order_index
    `, [customerId])

    const milestones = milestonesResult.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      order_index: row.order_index,
      completed: row.completed || false,
      completed_at: row.completed_at,
      notes: row.notes,
      program_name: row.program_name
    }))

    return NextResponse.json({
      success: true,
      milestones: milestones
    })
  } catch (error) {
    console.error('Error fetching customer milestones:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customer milestones' },
      { status: 500 }
    )
  }
} 