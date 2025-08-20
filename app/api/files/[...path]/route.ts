import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import pool from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params
    
    console.log('File request for path:', path)
    
    if (!path || path.length === 0) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 })
    }

    // Extract user ID from the request headers (should be set by middleware)
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      console.log('No user ID in request headers')
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Construct the file path
    const filePath = join(process.cwd(), 'public', 'uploads', ...path)
    console.log('Looking for file at:', filePath)
    
    // Check if file exists
    if (!existsSync(filePath)) {
      console.log('File not found at:', filePath)
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Verify that the user has permission to access this file
    // The path structure is: uploads/userId/milestoneId/taskId/filename
    if (path.length >= 3) {
      const fileUserId = path[0] // First part of path should be user ID
      const milestoneId = path[1]
      const taskId = path[2]
      
      // Check if the requesting user has access to this file
      const accessCheck = await pool.query(`
        SELECT tf.id 
        FROM task_files tf
        JOIN tasks t ON tf.task_id = t.id
        JOIN milestones m ON t.milestone_id = m.id
        JOIN coaching_programs cp ON m.program_id = cp.id
        JOIN user_programs up ON cp.id = up.program_id
        WHERE tf.user_id = $1 AND tf.milestone_id = $2 AND tf.task_id = $3 AND up.user_id = $4
      `, [fileUserId, milestoneId, taskId, userId])

      if (accessCheck.rows.length === 0) {
        console.log('Access denied: User does not have permission to access this file')
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }
    
    console.log('File access authorized, serving:', filePath)

    // Read the file
    const fileBuffer = await readFile(filePath)
    
    // Determine content type based on file extension
    const extension = path[path.length - 1].split('.').pop()?.toLowerCase()
    let contentType = 'application/octet-stream'
    
    switch (extension) {
      case 'pdf':
        contentType = 'application/pdf'
        break
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg'
        break
      case 'png':
        contentType = 'image/png'
        break
      case 'gif':
        contentType = 'image/gif'
        break
      case 'txt':
        contentType = 'text/plain'
        break
      case 'doc':
        contentType = 'application/msword'
        break
      case 'docx':
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        break
      case 'xls':
        contentType = 'application/vnd.ms-excel'
        break
      case 'xlsx':
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        break
    }

    // Extract original filename from the timestamped filename
    const timestampedFilename = path[path.length - 1]
    const originalFilename = timestampedFilename.replace(/^\d+_/, '')
    
    // Return the file with appropriate headers
    return new NextResponse(fileBuffer as any, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${originalFilename}"`,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    })
  } catch (error) {
    console.error('Error serving file:', error)
    return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 })
  }
} 