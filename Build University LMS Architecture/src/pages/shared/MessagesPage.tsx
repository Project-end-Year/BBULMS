import { useState } from 'react'
import { Send } from 'lucide-react'
import { User, messages as initialMessages, users, Message } from '../../lib/mock'

interface Props { user: User }

export default function MessagesPage({ user }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [input, setInput] = useState('')

  const contacts = [...new Set(messages.filter((m) => m.senderId === user.id || m.receiverId === user.id).flatMap((m) => [m.senderId, m.receiverId]))]
    .filter((id) => id !== user.id)
    .map((id) => users.find((u) => u.id === id))
    .filter(Boolean) as User[]

  const selectedUser = selectedUserId ? users.find((u) => u.id === selectedUserId) : null
  const conversation = messages.filter(
    (m) => (m.senderId === user.id && m.receiverId === selectedUserId) || (m.senderId === selectedUserId && m.receiverId === user.id)
  ).sort((a, b) => a.createdAt.localeCompare(b.createdAt))

  const unreadFrom = (uid: number) => messages.filter((m) => m.senderId === uid && m.receiverId === user.id && !m.isRead).length

  const send = () => {
    if (!input.trim() || !selectedUserId) return
    const newMsg: Message = {
      id: Date.now(), senderId: user.id, receiverId: selectedUserId,
      message: input.trim(), isRead: false, createdAt: new Date().toLocaleString(),
    }
    setMessages((prev) => [...prev, newMsg])
    setInput('')
  }

  const selectUser = (uid: number) => {
    setSelectedUserId(uid)
    setMessages((prev) => prev.map((m) => m.senderId === uid && m.receiverId === user.id ? { ...m, isRead: true } : m))
  }

  const roleBadge: Record<string, string> = { admin: 'bg-amber-50 text-amber-700', professor: 'bg-emerald-50 text-emerald-700', student: 'bg-violet-50 text-violet-700' }

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Contact list */}
      <div className="w-64 border-r border-slate-200 flex flex-col shrink-0">
        <div className="px-4 py-3 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900 text-sm">Messages</h3>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {contacts.map((contact) => {
            const unread = unreadFrom(contact.id)
            const lastMsg = [...messages].reverse().find((m) => (m.senderId === contact.id && m.receiverId === user.id) || (m.senderId === user.id && m.receiverId === contact.id))
            return (
              <button
                key={contact.id}
                onClick={() => selectUser(contact.id)}
                className={`w-full px-4 py-3 flex items-start gap-3 text-left hover:bg-slate-50 transition-colors ${selectedUserId === contact.id ? 'bg-blue-50 border-r-2 border-blue-600' : ''}`}
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">
                  {contact.firstName[0]}{contact.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-sm font-medium text-slate-900 truncate">{contact.firstName} {contact.lastName}</span>
                    {unread > 0 && <span className="bg-blue-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shrink-0">{unread}</span>}
                  </div>
                  <div className="text-xs text-slate-400 truncate mt-0.5">{lastMsg?.message ?? ''}</div>
                </div>
              </button>
            )
          })}
          {contacts.length === 0 && (
            <div className="px-4 py-8 text-center text-slate-400 text-xs">No conversations yet</div>
          )}
        </div>
      </div>

      {/* Conversation */}
      {selectedUser ? (
        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-5 py-3 border-b border-slate-200 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
              {selectedUser.firstName[0]}{selectedUser.lastName[0]}
            </div>
            <div>
              <div className="font-semibold text-slate-900 text-sm">{selectedUser.firstName} {selectedUser.lastName}</div>
              <span className={`text-xs font-medium px-1.5 py-0.5 rounded capitalize ${roleBadge[selectedUser.role]}`}>{selectedUser.role}</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {conversation.map((msg) => {
              const isMe = msg.senderId === user.id
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${isMe ? 'bg-blue-700 text-white rounded-tr-sm' : 'bg-slate-100 text-slate-900 rounded-tl-sm'}`}>
                    <p>{msg.message}</p>
                    <div className={`text-xs mt-1 ${isMe ? 'text-blue-200' : 'text-slate-400'}`}>{msg.createdAt}</div>
                  </div>
                </div>
              )
            })}
            {conversation.length === 0 && (
              <div className="text-center text-slate-400 text-sm py-8">Start a conversation with {selectedUser.firstName}.</div>
            )}
          </div>

          <div className="px-5 py-4 border-t border-slate-200 flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder={`Message ${selectedUser.firstName}…`}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <button
              onClick={send}
              disabled={!input.trim()}
              className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <Send size={15} /> Send
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-400">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <Send size={20} className="text-slate-300" />
            </div>
            <p className="text-sm">Select a conversation to start messaging</p>
          </div>
        </div>
      )}
    </div>
  )
}
