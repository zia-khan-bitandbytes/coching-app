import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { messageId, userId, emoji } = await req.json()
    
    if (!messageId || !userId || !emoji) {
      return NextResponse.json({ error: 'MessageId, userId, and emoji are required' }, { status: 400 })
    }
    
    // Check if reaction already exists
    const existingReaction = await pool.query(
      'SELECT id FROM message_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3',
      [messageId, userId, emoji]
    )
    
    if (existingReaction.rows.length > 0) {
      // Remove reaction if it already exists (toggle)
      await pool.query(
        'DELETE FROM message_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3',
        [messageId, userId, emoji]
      )
    } else {
      // Add new reaction
      await pool.query(
        'INSERT INTO message_reactions (message_id, user_id, emoji) VALUES ($1, $2, $3)',
        [messageId, userId, emoji]
      )
    }
    
    // Get updated reaction count
    const reactionCount = await pool.query(
      'SELECT COUNT(*) as count FROM message_reactions WHERE message_id = $1 AND emoji = $2',
      [messageId, emoji]
    )
    
    return NextResponse.json({ 
      count: parseInt(reactionCount.rows[0].count),
      added: existingReaction.rows.length === 0
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update reaction' }, { status: 500 })
  }
} 