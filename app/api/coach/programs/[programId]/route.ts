import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { programId: string } }
) {
  try {
    const { programId } = await params
    
    // Extract coach ID from the URL path
    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const coachIdIndex = pathParts.findIndex(part => part === 'coach') + 1
    const coachId = pathParts[coachIdIndex]
    
    if (!coachId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Coach ID not found in URL' 
      }, { status: 400 })
    }
    
    // Check if program belongs to the coach
    const programCheck = await pool.query(`
      SELECT id FROM coaching_programs WHERE id = $1 AND coach_id = $2
    `, [programId, coachId])
    
    if (programCheck.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Program not found or access denied' 
      }, { status: 404 })
    }

    // Delete the program (milestones will be deleted automatically due to CASCADE)
    // This will also cascade delete:
    // - milestones (due to ON DELETE CASCADE)
    // - user_programs enrollments (due to ON DELETE CASCADE)
    // - milestone_progress (due to ON DELETE CASCADE)
    // - payments (due to ON DELETE CASCADE)
    await pool.query(`DELETE FROM coaching_programs WHERE id = $1`, [programId])
    
    return NextResponse.json({
      success: true,
      message: 'Program deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting program:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to delete program' 
    }, { status: 500 })
  }
} 