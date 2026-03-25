'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'

interface Message {
  id: string
  sender_id: string
  content: string
  created_at: string
}

interface SessionInfo {
  id: string
  mandant_id: string
  anwalt_id: string
  status: string
  type: string
  started_at: string | null
  ended_at: string | null
  duration_seconds: number | null
}

export default function ChatRoomPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const [session, setSession] = useState<SessionInfo | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [otherName, setOtherName] = useState('')
  const [otherAvatar, setOtherAvatar] = useState('')
  const [sending, setSending] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Init: load session, messages, subscribe
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const { data: sess } = await supabase
        .from('consultation_sessions')
        .select('*')
        .eq('id', id)
        .single()

      if (!sess) { router.push('/beratung'); return }
      setSession(sess)

      const otherId = sess.mandant_id === user.id ? sess.anwalt_id : sess.mandant_id
      const { data: otherProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name, avatar_url')
        .eq('id', otherId)
        .single()

      if (otherProfile) {
        setOtherName(`${otherProfile.first_name || ''} ${otherProfile.last_name || ''}`)
        setOtherAvatar(otherProfile.avatar_url || '')
      }

      // Load existing messages
      const { data: msgs } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', id)
        .order('created_at', { ascending: true })

      if (msgs) setMessages(msgs)
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`chat-${id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `session_id=eq.${id}` },
        (payload) => {
          const msg = payload.new as Message
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev
            return [...prev, msg]
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'consultation_sessions', filter: `id=eq.${id}` },
        (payload) => {
          setSession(payload.new as SessionInfo)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // Auto-scroll on new messages
  useEffect(() => { scrollToBottom() }, [messages, scrollToBottom])

  // Timer
  useEffect(() => {
    if (!session?.started_at || session.status !== 'active') return
    const start = new Date(session.started_at).getTime()
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000))
    tick()
    const iv = setInterval(tick, 1000)
    return () => clearInterval(iv)
  }, [session])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || !userId || sending) return
    setSending(true)

    await supabase.from('chat_messages').insert({
      session_id: id,
      sender_id: userId,
      content: newMessage.trim(),
    })

    setNewMessage('')
    setSending(false)
    inputRef.current?.focus()
  }

  async function endSession() {
    if (!confirm('Möchten Sie die Beratung wirklich beenden?')) return

    const now = new Date().toISOString()
    const startedAt = session?.started_at ? new Date(session.started_at).getTime() : Date.now()
    const duration = Math.floor((Date.now() - startedAt) / 1000)

    await supabase
      .from('consultation_sessions')
      .update({ status: 'completed', ended_at: now, duration_seconds: duration })
      .eq('id', id)
  }

  async function acceptSession() {
    await supabase
      .from('consultation_sessions')
      .update({ status: 'active', started_at: new Date().toISOString() })
      .eq('id', id)
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  if (!session) {
    return <div className="flex items-center justify-center h-64 text-navy-400">Laden...</div>
  }

  const isActive = session.status === 'active'
  const isRequested = session.status === 'requested'
  const isCompleted = ['completed', 'declined', 'cancelled'].includes(session.status)
  const isAnwalt = userId === session.anwalt_id

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-6rem)] max-w-3xl mx-auto">
      {/* Header */}
      <Card className="p-4 rounded-b-none border-b-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar src={otherAvatar} name={otherName} size="sm" />
            <div>
              <p className="font-semibold text-navy-900">{otherName}</p>
              <div className="flex items-center gap-2">
                {isActive && (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs text-emerald-600 font-medium">{formatTime(elapsed)}</span>
                  </>
                )}
                {isRequested && <Badge variant="warning">Warte auf Annahme</Badge>}
                {isCompleted && (
                  <Badge variant="info">
                    Beendet{session.duration_seconds ? ` · ${formatTime(session.duration_seconds)}` : ''}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isActive && (
              <Button variant="outline" size="sm" onClick={endSession} className="text-red-600 border-red-200 hover:bg-red-50">
                Beenden
              </Button>
            )}
            {isRequested && isAnwalt && (
              <Button variant="primary" size="sm" onClick={acceptSession}>
                Annehmen
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => router.push('/beratung')}>
              ←
            </Button>
          </div>
        </div>
      </Card>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-navy-50/50 border-x border-navy-100 px-4 py-6 space-y-4">
        {messages.length === 0 && isActive && (
          <p className="text-center text-navy-300 text-sm py-8">
            Schreiben Sie die erste Nachricht, um die Beratung zu beginnen.
          </p>
        )}
        {isRequested && (
          <p className="text-center text-navy-300 text-sm py-8">
            {isAnwalt
              ? 'Nehmen Sie die Anfrage an, um den Chat zu starten.'
              : 'Warten Sie, bis der Anwalt die Anfrage annimmt.'}
          </p>
        )}

        {messages.map(msg => {
          const isOwn = msg.sender_id === userId
          return (
            <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                isOwn
                  ? 'bg-navy-700 text-white rounded-br-md'
                  : 'bg-white text-navy-800 border border-navy-100 rounded-bl-md'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                <p className={`text-[10px] mt-1 ${isOwn ? 'text-navy-300' : 'text-navy-400'}`}>
                  {new Date(msg.created_at || '').toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <Card className="p-4 rounded-t-none border-t-0">
        {isActive ? (
          <form onSubmit={sendMessage} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Nachricht schreiben..."
              className="flex-1 px-4 py-3 rounded-xl border border-navy-200 bg-white text-navy-800 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
              autoFocus
            />
            <Button type="submit" variant="primary" disabled={!newMessage.trim() || sending}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </Button>
          </form>
        ) : isCompleted ? (
          <p className="text-center text-navy-400 text-sm">Diese Beratung ist beendet.</p>
        ) : (
          <p className="text-center text-navy-400 text-sm">Chat wird gestartet, sobald die Anfrage angenommen wird.</p>
        )}
      </Card>
    </div>
  )
}
