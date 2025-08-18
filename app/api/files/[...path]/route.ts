import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

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

    // Construct the file path
    const filePath = join(process.cwd(), 'public', 'uploads', ...path)
    console.log('Looking for file at:', filePath)
    
    // Check if file exists
    if (!existsSync(filePath)) {
      console.log('File not found at:', filePath)
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }
    
    console.log('File found, serving:', filePath)

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