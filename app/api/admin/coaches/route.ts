import { NextRequest, NextResponse } from 'next/server'
import { getAllCoaches } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const coaches = await getAllCoaches()
    
    return NextResponse.json({
      success: true,
      coaches: coaches
    })
  } catch (error) {
    console.error('Error fetching coaches:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch coaches' },
      { status: 500 }
    )
  }
} 