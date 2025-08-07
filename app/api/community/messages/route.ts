import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
  try {
    // Get main messages
    const result = await pool.query(`
      SELECT 
        m.id,
        m.text,
        m.created_at,
        u.name as user_name,
        u.id as user_id,
        m.parent_id
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.parent_id IS NULL
      ORDER BY m.created_at DESC
    `)
    
    const messages = []
    
    for (const msg of result.rows) {
      // Get reactions for this message
      const reactionsResult = await pool.query(`
        SELECT emoji, COUNT(*) as count
        FROM message_reactions 
        WHERE message_id = $1 
        GROUP BY emoji
      `, [msg.id])
      
      const reactions: { [key: string]: number } = {}
      reactionsResult.rows.forEach(row => {
        reactions[row.emoji] = parseInt(row.count)
      })
      
      // Get replies for this message
      const repliesResult = await pool.query(`
        SELECT 
          r.id,
          r.text,
          r.created_at,
          u.name as user_name
        FROM messages r
        JOIN users u ON r.user_id = u.id
        WHERE r.parent_id = $1
        ORDER BY r.created_at ASC
      `, [msg.id])
      
      const replies = await Promise.all(repliesResult.rows.map(async (reply) => {
        // Get reactions for each reply
        const replyReactionsResult = await pool.query(`
          SELECT emoji, COUNT(*) as count
          FROM message_reactions 
          WHERE message_id = $1 
          GROUP BY emoji
        `, [reply.id])
        
        const replyReactions: { [key: string]: number } = {}
        replyReactionsResult.rows.forEach(row => {
          replyReactions[row.emoji] = parseInt(row.count)
        })
        
        return {
          id: reply.id,
          user: reply.user_name,
          text: reply.text,
          timestamp: reply.created_at,
          reactions: replyReactions
        }
      }))
      
      messages.push({
        id: msg.id,
        user: msg.user_name,
        text: msg.text,
        timestamp: msg.created_at,
        reactions,
        replies
      })
    }
    
    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { text, parentId, userId } = await req.json()
    
    if (!text || !userId) {
      return NextResponse.json({ error: 'Text and userId are required' }, { status: 400 })
    }
    
    const result = await pool.query(
      'INSERT INTO messages (user_id, text, parent_id) VALUES ($1, $2, $3) RETURNING id, created_at',
      [userId, text, parentId || null]
    )
    
    const newMessage = result.rows[0]
    
    // Get user name
    const userResult = await pool.query('SELECT name FROM users WHERE id = $1', [userId])
    const userName = userResult.rows[0]?.name || 'Unknown'
    
    return NextResponse.json({
      id: newMessage.id,
      user: userName,
      text,
      timestamp: newMessage.created_at,
      reactions: {},
      replies: []
    })
  } catch (error) {
    console.error('Error posting message:', error)
    return NextResponse.json({ error: 'Failed to post message' }, { status: 500 })
  }
} 