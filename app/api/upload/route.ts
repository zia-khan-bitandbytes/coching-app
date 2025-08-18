import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import pool from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const milestoneId = formData.get('milestoneId') as string
    const coachId = formData.get('coachId') as string
    const programId = formData.get('programId') as string

    if (!file) {
      return NextResponse.json({ 
        success: false, 
        error: 'No file provided' 
      }, { status: 400 })
    }

    if (!milestoneId || !coachId || !programId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required parameters' 
      }, { status: 400 })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Create subdirectories for better organization
    const coachDir = join(uploadsDir, coachId)
    const programDir = join(coachDir, programId)
    const milestoneDir = join(programDir, milestoneId)
    
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
    const fileExtension = originalName.split('.').pop()
    const fileName = `${timestamp}_${originalName.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const filePath = join(milestoneDir, fileName)

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Generate public URL - use the API route to serve files
    const publicUrl = `/api/files/${coachId}/${programId}/${milestoneId}/${fileName}`

    // Store file information in database (if table exists)
    let fileRecord
    try {
      const result = await pool.query(`
        INSERT INTO task_files (milestone_id, file_name, original_name, file_path, file_size, file_type, uploaded_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, file_name, original_name, file_path, file_size, file_type, created_at
      `, [
        milestoneId,
        fileName,
        originalName,
        publicUrl,
        file.size,
        file.type,
        coachId
      ])
      fileRecord = result.rows[0]
      console.log('File stored in database:', fileRecord)
    } catch (error) {
      // If table doesn't exist, create a simple file record
      console.log('task_files table not found, using fallback')
      fileRecord = {
        id: Date.now(),
        original_name: originalName,
        file_size: file.size,
        file_type: file.type,
        file_path: publicUrl,
        created_at: new Date().toISOString()
      }
    }

    return NextResponse.json({
      success: true,
      file: {
        id: fileRecord.id,
        name: fileRecord.original_name,
        size: fileRecord.file_size,
        type: fileRecord.file_type,
        url: fileRecord.file_path,
        uploadedAt: fileRecord.created_at
      }
    })

  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to upload file' 
    }, { status: 500 })
  }
} 