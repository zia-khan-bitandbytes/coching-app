import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import pool from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    console.log('=== Customer Upload API Called ===')
    
    const { customerId } = await params
    console.log('Customer ID:', customerId)
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    const milestoneId = formData.get('milestoneId') as string
    const taskId = formData.get('taskId') as string

    console.log('Form data:', { 
      milestoneId, 
      taskId, 
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type
    })

    if (!file) {
      console.log('No file provided')
      return NextResponse.json({ 
        success: false, 
        error: 'No file provided' 
      }, { status: 400 })
    }

    if (!milestoneId || !taskId) {
      console.log('Missing parameters:', { milestoneId, taskId })
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required parameters' 
      }, { status: 400 })
    }

    // Verify the customer has access to this milestone and task
    console.log('Verifying customer access...')
    const verificationResult = await pool.query(`
      SELECT t.id, m.id as milestone_id, cp.coach_id, cp.id as program_id
      FROM tasks t
      JOIN milestones m ON t.milestone_id = m.id
      JOIN coaching_programs cp ON m.program_id = cp.id
      JOIN user_programs up ON cp.id = up.program_id
      WHERE t.id = $1 AND m.id = $2 AND up.user_id = $3
    `, [taskId, milestoneId, customerId])

    console.log('Verification result rows:', verificationResult.rows.length)

    if (verificationResult.rows.length === 0) {
      console.log('Access denied')
      return NextResponse.json({ 
        success: false, 
        error: 'Task not found or access denied' 
      }, { status: 404 })
    }

    const taskData = verificationResult.rows[0]
    const coachId = taskData.coach_id.toString()
    const programId = taskData.program_id.toString()

    console.log('Task data:', taskData)

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads')
    console.log('Uploads directory:', uploadsDir)
    
    if (!existsSync(uploadsDir)) {
      console.log('Creating uploads directory...')
      await mkdir(uploadsDir, { recursive: true })
    }

    // Create subdirectories for better organization
    const coachDir = join(uploadsDir, coachId.toString())
    const programDir = join(coachDir, programId.toString())
    const milestoneDir = join(programDir, milestoneId.toString())
    
    console.log('Creating directories:', { coachDir, programDir, milestoneDir })
    
    if (!existsSync(coachDir)) {
      await mkdir(coachDir, { recursive: true })
    }
    if (!existsSync(programDir)) {
      await mkdir(programDir, { recursive: true })
    }
    if (!existsSync(milestoneDir)) {
      await mkdir(milestoneDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const originalName = file.name
    const fileName = `${timestamp}_${originalName.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const filePath = join(milestoneDir, fileName)

    console.log('Saving file to:', filePath)

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    console.log('File saved successfully')

    // Generate public URL
    const publicUrl = `/api/files/${coachId}/${programId}/${milestoneId}/${fileName}`

    // Store file information in database (if table exists)
    let fileRecord
    try {
      const result = await pool.query(`
        INSERT INTO task_files (task_id, user_id, filename, original_filename, file_path, file_size, mime_type, uploaded_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, filename, original_filename, file_path, file_size, mime_type, uploaded_at
      `, [
        taskId,
        customerId,
        fileName,
        originalName,
        publicUrl,
        file.size,
        file.type,
        new Date()
      ])
      fileRecord = result.rows[0]
      console.log('File stored in database:', fileRecord)
    } catch (error) {
      console.error('Database error:', error)
      // If table doesn't exist, create a simple file record
      console.log('task_files table not found, using fallback')
      fileRecord = {
        id: Date.now(),
        original_filename: originalName,
        file_size: file.size,
        mime_type: file.type,
        file_path: publicUrl,
        uploaded_at: new Date()
      }
    }

    console.log('File record:', fileRecord)

    // Update the task to include the uploaded file
    const taskResult = await pool.query(`
      SELECT description FROM tasks WHERE id = $1
    `, [taskId])

    if (taskResult.rows.length > 0) {
      const currentDescription = taskResult.rows[0].description
      let files = []
      let cleanDescription = currentDescription

      // Parse existing files if any
      if (currentDescription && currentDescription.includes('[FILES:')) {
        try {
          const filesMatch = currentDescription.match(/\[FILES:(.*?)\]$/)
          if (filesMatch) {
            files = JSON.parse(filesMatch[1])
            cleanDescription = currentDescription.replace(/\n\n\[FILES:.*?\]$/, '')
          }
        } catch (error) {
          console.error('Error parsing existing files:', error)
        }
      }

      // Add the new file
      const newFile = {
        id: fileRecord.id,
        name: fileRecord.original_filename,
        size: fileRecord.file_size,
        type: fileRecord.mime_type,
        url: fileRecord.file_path,
        uploadedAt: fileRecord.uploaded_at
      }
      files.push(newFile)

      // Update the task description with the new file
      const filesInfo = JSON.stringify(files)
      const newDescription = `${cleanDescription}\n\n[FILES:${filesInfo}]`

      await pool.query(`
        UPDATE tasks 
        SET description = $1
        WHERE id = $2
      `, [newDescription, taskId])

      console.log('Task updated with new file')
    }

    console.log('Upload completed successfully')

    return NextResponse.json({
      success: true,
      file: {
        id: fileRecord.id,
        name: fileRecord.original_filename,
        size: fileRecord.file_size,
        type: fileRecord.mime_type,
        url: fileRecord.file_path,
        uploadedAt: fileRecord.uploaded_at
      }
    })

  } catch (error) {
    console.error('Error in customer upload:', error)
    console.error('Error stack:', (error as Error).stack)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to upload file',
      details: (error as Error).message
    }, { status: 500 })
  }
} 