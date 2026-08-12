import { useCallback, useEffect, useRef, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  CornerUpLeft,
  FileIcon,
  Loader2,
  MessageSquare,
  MoreVertical,
  Paperclip,
  Pencil,
  Phone,
  Search,
  Send,
  Trash2,
  Video,
  X,
} from 'lucide-react'

import { useAuth } from '@/hooks/useAuth'
import {
  useConversations,
  useConversation,
  useMessages,
  useSendMessage,
  useListenMessages,
  useTypingIndicator,
  useEditMessage,
  useDeleteMessage,
  useMarkRead,
  type Message,
} from '@/hooks/useConversations'

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`
}

function formatTime(iso: string | null | undefined): string {
  if (!iso) return ''
  const date = new Date(iso)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  return isToday
    ? date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function isImage(file: File): boolean {
  return file.type.startsWith('image/')
}

export default function ChatPage() {
  const { user } = useAuth()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const { data, isLoading } = useConversations()

  const conversations = data?.conversations ?? []

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <aside className="flex w-80 flex-col border-r border-gray-200 bg-gray-50/50">
        <div className="border-b border-gray-200 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-text">Chat</h2>
            <div className="flex gap-1">
              <button
                type="button"
                className="rounded-md p-1.5 text-text-muted hover:bg-gray-100 hover:text-text"
                title="New chat"
              >
                <MessageSquare className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search chats"
              className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-text outline-none placeholder:text-text-muted focus:border-bbu-blue focus:ring-1 focus:ring-bbu-blue"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-text-muted">
              No conversations yet.
            </div>
          ) : (
            conversations.map((conversation) => {
              const other = conversation.participants.find(
                (p) => p.user.id !== user?.id
              )?.user
              const title =
                conversation.title ??
                other?.name ??
                conversation.participants.map((p) => p.user.name).join(', ')
              const unread = conversation.lastReadAt
                ? conversation.latestMessage &&
                  new Date(conversation.latestMessage.createdAt) >
                    new Date(conversation.lastReadAt)
                : !!conversation.latestMessage

              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => setSelectedId(conversation.id)}
                  className={`flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors ${
                    selectedId === conversation.id
                      ? 'bg-bbu-blue/10'
                      : 'hover:bg-white'
                  }`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-bbu-blue text-sm font-semibold text-white">
                    {title.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium text-text">
                        {title}
                      </span>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {unread && (
                          <span className="h-2 w-2 rounded-full bg-bbu-blue" />
                        )}
                        <span className="text-xs text-text-muted">
                          {formatTime(conversation.latestMessage?.createdAt)}
                        </span>
                      </div>
                    </div>
                    <p
                      className={`truncate text-sm ${
                        unread ? 'font-medium text-text' : 'text-text-muted'
                      }`}
                    >
                      {conversation.latestMessage
                        ? `${conversation.latestMessage.sender?.name ?? ''}: ${
                            conversation.latestMessage.content ??
                            (conversation.latestMessage.type === 'attachment'
                              ? 'Sent an attachment'
                              : '')
                          }`
                        : 'No messages yet'}
                    </p>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </aside>

      {selectedId ? (
        <ActiveThread conversationId={selectedId} currentUserId={user?.id} />
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center bg-white p-6 text-center">
          <MessageSquare className="mb-3 h-12 w-12 text-text-muted/40" />
          <h3 className="text-lg font-medium text-text">
            Select a conversation
          </h3>
          <p className="mt-1 max-w-xs text-sm text-text-muted">
            Choose a chat from the list to start messaging.
          </p>
        </div>
      )}
    </div>
  )
}

interface ActiveThreadProps {
  conversationId: number
  currentUserId?: number
}

function ActiveThread({ conversationId, currentUserId }: ActiveThreadProps) {
  const { data: conversationData, isLoading: conversationLoading } =
    useConversation(conversationId)
  const { data: messagesData, isLoading: messagesLoading } = useMessages(
    conversationId,
    1,
    50
  )
  const { mutate: sendMessage, isPending: isSending } =
    useSendMessage(conversationId)
  const { mutate: editMessage, isPending: isEditingPending } =
    useEditMessage(conversationId)
  const { mutate: deleteMessage } = useDeleteMessage(conversationId)
  const { mutate: markRead } = useMarkRead(conversationId)
  const { typingUsers, sendTyping } = useTypingIndicator(
    conversationId,
    currentUserId
  )

  const [draft, setDraft] = useState('')
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageRefs = useRef<Record<number, HTMLDivElement | null>>({})

  useListenMessages(conversationId)

  const conversation = conversationData?.conversation
  const messages = messagesData?.messages ?? []

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!conversationId || messagesLoading) return
    const hasUnread = messages.some(
      (m) => m.sender?.id !== currentUserId &&
        (!conversation?.lastReadAt ||
          new Date(m.createdAt) > new Date(conversation.lastReadAt))
    )
    if (hasUnread) {
      markRead()
    }
  }, [
    conversationId,
    messagesLoading,
    messages,
    currentUserId,
    conversation?.lastReadAt,
    markRead,
  ])

  const otherParticipant = conversation?.participants.find(
    (p) => p.user.id !== currentUserId
  )?.user
  const title =
    conversation?.title ??
    otherParticipant?.name ??
    conversation?.participants.map((p) => p.user.name).join(', ') ??
    'Chat'

  function scrollToMessage(messageId: number) {
    const el = messageRefs.current[messageId]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('ring-2', 'ring-bbu-blue', 'ring-offset-2')
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-bbu-blue', 'ring-offset-2')
      }, 1500)
    }
  }

  function handleSend(content: string, attachments: File[]) {
    if (!content.trim() && attachments.length === 0) return
    sendMessage({ content, replyToId: replyTo?.id, attachments })
    setDraft('')
    setReplyTo(null)
  }

  function startEdit(message: Message) {
    if (!message.content) return
    setEditingId(message.id)
    setEditDraft(message.content)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditDraft('')
  }

  function saveEdit(messageId: number) {
    if (!editDraft.trim()) return
    editMessage(
      { messageId, content: editDraft.trim() },
      { onSuccess: () => cancelEdit() }
    )
  }

  function handleDelete(messageId: number) {
    if (window.confirm('Delete this message?')) {
      deleteMessage({ messageId })
    }
  }

  return (
    <div className="flex flex-1 flex-col bg-white">
      <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-bbu-blue text-sm font-semibold text-white">
            {title.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-medium text-text">{title}</h3>
            <p className="text-xs text-text-muted">
              {conversation?.participants.length ?? 0} participants
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="rounded-md p-2 text-text-muted hover:bg-gray-100 hover:text-text"
          >
            <Phone className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded-md p-2 text-text-muted hover:bg-gray-100 hover:text-text"
          >
            <Video className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded-md p-2 text-text-muted hover:bg-gray-100 hover:text-text"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {conversationLoading || messagesLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-sm text-text-muted">
            <MessageSquare className="mb-2 h-8 w-8 opacity-40" />
            <p>No messages yet.</p>
            <p>Send the first message to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {[...messages].reverse().map((message, index) => {
              const isMe = message.sender?.id === currentUserId
              const showAvatar =
                index === 0 ||
                messages[index - 1]?.sender?.id !== message.sender?.id
              const isEditing = editingId === message.id

              return (
                <div
                  key={message.id}
                  ref={(el) => {
                    messageRefs.current[message.id] = el
                  }}
                  className={`group flex gap-3 ${
                    isMe ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div className="flex w-8 flex-col items-center">
                    {showAvatar ? (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-text">
                        {(message.sender?.name ?? '?').charAt(0).toUpperCase()}
                      </div>
                    ) : (
                      <div className="h-8 w-8" />
                    )}
                  </div>
                  <div className="flex max-w-[70%] flex-col">
                    {isEditing ? (
                      <div
                        className={`rounded-2xl px-3 py-2 text-sm ${
                          isMe
                            ? 'rounded-br-none bg-bbu-blue text-white'
                            : 'rounded-bl-none bg-gray-100 text-text'
                        }`}
                      >
                        <textarea
                          rows={2}
                          value={editDraft}
                          onChange={(e) => setEditDraft(e.target.value)}
                          className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-text outline-none focus:border-bbu-blue"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              saveEdit(message.id)
                            }
                            if (e.key === 'Escape') {
                              e.preventDefault()
                              cancelEdit()
                            }
                          }}
                          autoFocus
                        />
                        <div className="mt-2 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="rounded-md px-2 py-1 text-xs text-text-muted hover:bg-white/20 hover:text-text"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={!editDraft.trim() || isEditingPending}
                            onClick={() => saveEdit(message.id)}
                            className="flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-medium text-bbu-blue hover:bg-gray-50 disabled:opacity-50"
                          >
                            {isEditingPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Send className="h-3 w-3" />
                            )}
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`relative rounded-2xl px-4 py-2 text-sm ${
                          isMe
                            ? 'rounded-br-none bg-bbu-blue text-white'
                            : 'rounded-bl-none bg-gray-100 text-text'
                        }`}
                      >
                        {message.replyTo && (
                          <button
                            type="button"
                            onClick={() => scrollToMessage(message.replyTo!.id)}
                            className={`mb-2 flex w-full items-start gap-1 border-l-2 pl-2 text-left text-xs ${
                              isMe
                                ? 'border-white/40 text-white/80'
                                : 'border-bbu-blue text-text-muted'
                            }`}
                          >
                            <CornerUpLeft className="mt-0.5 h-3 w-3 shrink-0" />
                            <div className="min-w-0">
                              <span className="font-medium">
                                {message.replyTo.sender?.name ?? 'Unknown'}
                              </span>
                              <p className="truncate">
                                {message.replyTo.content ?? 'Attachment'}
                              </p>
                            </div>
                          </button>
                        )}
                        {message.content && <p>{message.content}</p>}
                        {message.attachments.length > 0 && (
                          <div className="mt-2 grid gap-2">
                            {message.attachments.map((attachment) => (
                              <div
                                key={attachment.id}
                                className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
                                  isMe
                                    ? 'border-white/20 bg-white/10'
                                    : 'border-gray-300 bg-white'
                                }`}
                              >
                                <FileIcon className="h-4 w-4 shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-xs font-medium">
                                    {attachment.originalName}
                                  </p>
                                  <p className="text-[10px] opacity-80">
                                    {formatBytes(attachment.size)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <span
                          className={`mt-1 block text-right text-xs ${
                            isMe ? 'text-white/80' : 'text-text-muted'
                          }`}
                        >
                          {formatTime(message.createdAt)}
                          {message.editedAt && (
                            <span className="ml-1 opacity-70">(edited)</span>
                          )}
                        </span>
                      </div>
                    )}
                    {!isEditing && (
                      <div
                        className={`mt-1 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 ${
                          isMe ? 'self-end' : 'self-start'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setReplyTo(message)}
                          className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-text-muted hover:bg-gray-100 hover:text-text"
                          title="Reply"
                        >
                          <CornerUpLeft className="h-3 w-3" />
                          Reply
                        </button>
                        {isMe && message.content && (
                          <button
                            type="button"
                            onClick={() => startEdit(message)}
                            className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-text-muted hover:bg-gray-100 hover:text-text"
                            title="Edit"
                          >
                            <Pencil className="h-3 w-3" />
                            Edit
                          </button>
                        )}
                        {isMe && (
                          <button
                            type="button"
                            onClick={() => handleDelete(message.id)}
                            className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-red-600 hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <Composer
        draft={draft}
        onDraftChange={(value) => {
          setDraft(value)
          if (value.trim()) {
            sendTyping()
          }
        }}
        onSend={handleSend}
        isSending={isSending}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        typingUsers={typingUsers}
      />
    </div>
  )
}

interface ComposerProps {
  draft: string
  onDraftChange: (value: string) => void
  onSend: (content: string, attachments: File[]) => void
  isSending: boolean
  replyTo?: Message | null
  onCancelReply?: () => void
  typingUsers?: { id: number; name: string }[]
}

function Composer({
  draft,
  onDraftChange,
  onSend,
  isSending,
  replyTo,
  onCancelReply,
  typingUsers = [],
}: ComposerProps) {
  const [files, setFiles] = useState<File[]>([])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles].slice(0, 10))
  }, [])

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
    accept: {
      'image/*': [],
      'application/pdf': [],
      'application/vnd.openxmlformats-officedocument.*': [],
      'application/msword': [],
      'application/vnd.ms-excel': [],
      'application/vnd.ms-powerpoint': [],
      'text/plain': [],
      'application/zip': [],
    },
    maxSize: 10 * 1024 * 1024,
  })

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  function handleSend() {
    onSend(draft, files)
    setFiles([])
    onCancelReply?.()
  }

  const canSend = draft.trim() || files.length > 0

  const typingLabel = (() => {
    if (typingUsers.length === 0) return null
    const names = typingUsers.map((u) => u.name.split(' ')[0])
    if (names.length === 1) return `${names[0]} is typing...`
    if (names.length === 2) return `${names.join(' and ')} are typing...`
    return `${names.slice(0, 2).join(', ')} and ${names.length - 2} others are typing...`
  })()

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      {typingLabel && (
        <div className="mb-2 flex items-center gap-2 text-xs text-text-muted">
          <span className="flex gap-0.5">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-muted/60" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-muted/60 [animation-delay:120ms]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-muted/60 [animation-delay:240ms]" />
          </span>
          {typingLabel}
        </div>
      )}
      {replyTo && (
        <div className="mb-2 flex items-start justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2">
          <div className="min-w-0">
            <p className="text-xs font-medium text-text">
              Replying to {replyTo.sender?.name ?? 'Unknown'}
            </p>
            <p className="truncate text-xs text-text-muted">
              {replyTo.content ?? 'Attachment'}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="shrink-0 rounded-full p-1 text-text-muted hover:bg-gray-200 hover:text-text"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      {files.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="relative flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2 pr-7"
            >
              {isImage(file) ? (
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="h-10 w-10 rounded-md object-cover"
                />
              ) : (
                <FileIcon className="h-6 w-6 text-text-muted" />
              )}
              <div className="min-w-0">
                <p className="max-w-[120px] truncate text-xs font-medium text-text">
                  {file.name}
                </p>
                <p className="text-[10px] text-text-muted">
                  {formatBytes(file.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="absolute right-1 top-1 rounded-full p-0.5 text-text-muted hover:bg-gray-200 hover:text-text"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div
        {...getRootProps()}
        className={`flex items-end gap-2 rounded-2xl border bg-gray-50 p-2 ${
          isDragActive
            ? 'border-bbu-blue bg-bbu-blue/5'
            : 'border-gray-200'
        }`}
      >
        <input {...getInputProps()} />
        <button
          type="button"
          onClick={open}
          className="rounded-md p-2 text-text-muted hover:bg-gray-100 hover:text-text"
          title="Attach file"
        >
          <Paperclip className="h-4 w-4" />
        </button>
        <textarea
          rows={1}
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          placeholder="Type a message..."
          className="max-h-32 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-text outline-none placeholder:text-text-muted"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
        />
        <button
          type="button"
          disabled={!canSend || isSending}
          onClick={handleSend}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bbu-blue text-white hover:bg-bbu-blue/90 disabled:opacity-50"
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
      {isDragActive && (
        <p className="mt-1 text-center text-xs text-bbu-blue">
          Drop files here to attach
        </p>
      )}
    </div>
  )
}
