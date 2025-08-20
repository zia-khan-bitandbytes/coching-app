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

    // Get coach customers with their stats and program details
    const customersResult = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        COUNT(DISTINCT up.program_id) as total_programs,
        COUNT(DISTINCT CASE WHEN up.status = 'active' THEN up.program_id END) as active_programs,
        COUNT(DISTINCT mp.milestone_id) as completed_milestones,
        COALESCE(SUM(p.amount), 0) as total_spent,
        MAX(up.enrolled_at) as last_activity
      FROM users u
      JOIN coach_customers cc ON u.id = cc.customer_id
      LEFT JOIN user_programs up ON u.id = up.user_id
      LEFT JOIN milestone_progress mp ON u.id = mp.user_id AND mp.completed = true
      LEFT JOIN payments p ON u.id = p.user_id AND p.status = 'completed'
      WHERE cc.coach_id = $1
      GROUP BY u.id, u.name, u.email
      ORDER BY u.name
    `, [coachId])

    // Get detailed program information for each customer
    const customersWithPrograms = await Promise.all(
      customersResult.rows.map(async (row) => {
        // Get programs for this customer with accurate milestone completion tracking
        const programsResult = await pool.query(`
          SELECT 
            cp.id,
            cp.name,
            cp.description,
            cp.price,
            cp.is_active,
            up.status as enrollment_status,
            up.enrolled_at,
            COUNT(DISTINCT m.id) as milestones_count,
            COUNT(DISTINCT CASE WHEN mp.completed = true THEN mp.milestone_id END) as completed_milestones,
            CASE 
              WHEN COUNT(DISTINCT m.id) > 0 AND COUNT(DISTINCT CASE WHEN mp.completed = true THEN mp.milestone_id END) = COUNT(DISTINCT m.id) 
              THEN 'completed'
              WHEN COUNT(DISTINCT CASE WHEN mp.completed = true THEN mp.milestone_id END) > 0 
              THEN 'in_progress'
              ELSE 'not_started'
            END as calculated_status
          FROM user_programs up
          JOIN coaching_programs cp ON up.program_id = cp.id
          LEFT JOIN milestones m ON cp.id = m.program_id
          LEFT JOIN milestone_progress mp ON m.id = mp.milestone_id AND mp.user_id = up.user_id AND mp.completed = true
          WHERE up.user_id = $1 AND cp.coach_id = $2
          GROUP BY cp.id, cp.name, cp.description, cp.price, cp.is_active, up.status, up.enrolled_at
          ORDER BY up.enrolled_at DESC
        `, [row.id, coachId])

        const enrolledPrograms = programsResult.rows.map(program => ({
          id: program.id,
          name: program.name,
          description: program.description,
          price: parseFloat(program.price),
          is_active: program.is_active,
          enrollment_status: program.calculated_status, // Use calculated status based on milestone completion
          enrolled_at: program.enrolled_at,
          milestones_count: parseInt(program.milestones_count),
          completed_milestones: parseInt(program.completed_milestones)
        }))

        return {
          id: row.id,
          name: row.name,
          email: row.email,
          enrolled_programs: enrolledPrograms,
          total_programs: parseInt(row.total_programs),
          active_programs: parseInt(row.active_programs),
          completed_milestones: parseInt(row.completed_milestones),
          total_spent: parseFloat(row.total_spent),
          last_activity: row.last_activity ? new Date(row.last_activity).toLocaleDateString() : 'Never'
        }
      })
    )

    console.log('Customers data calculated:', {
      totalCustomers: customersWithPrograms.length,
      sampleCustomer: customersWithPrograms[0],
      milestoneBreakdown: customersWithPrograms.map(c => ({
        name: c.name,
        totalMilestones: c.completed_milestones,
        programs: c.enrolled_programs.map(p => ({
          name: p.name,
          milestones: p.milestones_count,
          completed: p.completed_milestones,
          status: p.enrollment_status
        }))
      }))
    })

    return NextResponse.json({
      success: true,
      customers: customersWithPrograms
    })
  } catch (error) {
    console.error('Error fetching coach customers:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch coach customers' },
      { status: 500 }
    )
  }
} 