import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { milestoneId: string } }
) {
  try {
    const { milestoneId } = await params
    
    // For now, using coach ID 1 as default (you can get this from auth later)
    const coachId = 1
    
    // Check if milestone belongs to a program owned by the coach
    const milestoneCheck = await pool.query(`
      SELECT m.id FROM milestones m
      JOIN coaching_programs cp ON m.program_id = cp.id
      WHERE m.id = $1 AND cp.coach_id = $2
    `, [milestoneId, coachId])
    
    if (milestoneCheck.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Milestone not found or access denied' 
      }, { status: 404 })
    }

    // Delete the milestone
    await pool.query(`DELETE FROM milestones WHERE id = $1`, [milestoneId])
    
    return NextResponse.json({
      success: true,
      message: 'Milestone deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting milestone:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to delete milestone' 
    }, { status: 500 })
  }
} 