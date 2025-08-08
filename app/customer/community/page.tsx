"use client"

import { useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { showSuccessToast, showErrorToast } from "@/lib/toast"

interface Message {
  id: string
  user: string
  text: string
  timestamp: string
  replies?: Message[]
  reactions?: { [emoji: string]: number }
}

export default function CommunityPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Get user from localStorage
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }
    
    // Fetch messages
    fetchMessages()
    
    // Poll for new messages every 5 seconds
    const interval = setInterval(fetchMessages, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/community/messages')
      const data = await response.json()
      if (response.ok) {
        setMessages(data.messages)
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || !user) return
    setLoading(true)
    
    try {
      const response = await fetch('/api/community/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: input,
          userId: user.id,
          parentId: replyTo
        })
      })
      
      const data = await response.json()
      if (response.ok) {
        setInput("")
        setReplyTo(null)
        showSuccessToast('Message sent!')
        // Refresh messages
        fetchMessages()
      } else {
        showErrorToast(data.error || 'Failed to send message')
      }
    } catch (error) {
      showErrorToast('Failed to send message')
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleReact = async (msgId: string, emoji: string) => {
    if (!user) return
    
    try {
      const response = await fetch('/api/community/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: msgId,
          userId: user.id,
          emoji
        })
      })
      
      const data = await response.json()
      if (response.ok) {
        // Update local state
        setMessages(msgs => 
          msgs.map(msg => {
            if (msg.id === msgId) {
              return { ...msg, reactions: { ...msg.reactions, [emoji]: data.count } }
            }
            // Check replies too
            if (msg.replies) {
              const updatedReplies = msg.replies.map(reply => 
                reply.id === msgId 
                  ? { ...reply, reactions: { ...reply.reactions, [emoji]: data.count } }
                  : reply
              )
              return { ...msg, replies: updatedReplies }
            }
            return msg
          })
        )
      }
    } catch (error) {
      showErrorToast('Failed to update reaction')
    }
  }

  const handleReply = (msgId: string) => {
    setReplyTo(msgId)
    inputRef.current?.focus()
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-2xl">
          <CardContent className="text-center py-8">
            <p>Please log in to access the community chat.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Community Chat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-[400px] overflow-y-auto mb-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p>No messages yet. Be the first to start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="border-b pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{msg.user}</span>
                    <span className="text-xs text-gray-400">{new Date(msg.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="ml-2 my-1">{msg.text}</div>
                  <div className="flex gap-2 ml-2">
                    <Button size="sm" variant="ghost" onClick={() => handleReact(msg.id, "👍")}>
                      👍 {msg.reactions?.["👍"] || 0}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleReact(msg.id, "❤️")}>
                      ❤️ {msg.reactions?.["❤️"] || 0}
                    </Button>
                    <Button size="sm" variant="link" onClick={() => handleReply(msg.id)}>
                      Reply
                    </Button>
                  </div>
                  
                  {/* Display replies */}
                  {msg.replies && msg.replies.length > 0 && (
                    <div className="ml-6 mt-2 space-y-2">
                      {msg.replies.map((reply) => (
                        <div key={reply.id} className="border-l-2 pl-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{reply.user}</span>
                            <span className="text-xs text-gray-400">{new Date(reply.timestamp).toLocaleString()}</span>
                          </div>
                          <div className="ml-2 my-1">{reply.text}</div>
                          <div className="flex gap-2 ml-2">
                            <Button size="sm" variant="ghost" onClick={() => handleReact(reply.id, "👍")}>
                              👍 {reply.reactions?.["👍"] || 0}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleReact(reply.id, "❤️")}>
                              ❤️ {reply.reactions?.["❤️"] || 0}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          <form
            onSubmit={e => {
              e.preventDefault()
              handleSend()
            }}
            className="flex gap-2"
          >
            <Input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={replyTo ? "Reply to message..." : "Type your message..."}
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !input.trim()}>
              {loading ? "Sending..." : replyTo ? "Reply" : "Send"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}