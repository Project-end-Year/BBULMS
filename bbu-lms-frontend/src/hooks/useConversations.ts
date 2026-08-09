import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/axios'
import { useEcho } from '@/contexts/EchoContext'

export interface ConversationUser {
  id: number
  name: string
  email: string
  avatarUrl?: string | null
}

export interface ConversationParticipant {
  id: number
  role: 'admin' | 'member'
  lastReadAt: string | null
  user: ConversationUser
}

export interface LatestMessage {
  id: number
  content: string | null
  type: string
  sender: ConversationUser | null
  createdAt: string
}

export interface Conversation {
  id: number
  type: 'direct' | 'group' | 'course'
  title: string | null
  description: string | null
  isActive: boolean
  createdBy?: ConversationUser | null
  participants: ConversationParticipant[]
  latestMessage: LatestMessage | null
  lastReadAt: string | null
  createdAt: string
}

export interface ConversationsData {
  conversations: Conversation[]
}

export interface SingleConversationData {
  conversation: Conversation
}

export interface Message {
  id: number
  conversationId: number
  content: string | null
  type: string
  sender: ConversationUser | null
  replyTo: Message | null
  attachments: {
    id: number
    fileName: string
    originalName: string
    mimeType: string
    size: number
  }[]
  createdAt: string
  editedAt: string | null
}

export interface MessagesData {
  messages: Message[]
  pagination: {
    currentPage: number
    lastPage: number
    perPage: number
    total: number
    from: number | null
    to: number | null
  }
}

export function useConversations() {
  return useQuery<ConversationsData, Error>({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data } = await api.get('/conversations')
      return data.data as ConversationsData
    },
  })
}

export function useConversation(conversationId: number | undefined) {
  return useQuery<SingleConversationData, Error>({
    queryKey: ['conversation', conversationId],
    queryFn: async () => {
      const { data } = await api.get(`/conversations/${conversationId}`)
      return data.data as SingleConversationData
    },
    enabled: !!conversationId,
  })
}

export function useMessages(conversationId: number | undefined, page: number = 1, perPage: number = 25) {
  return useQuery<MessagesData, Error>({
    queryKey: ['conversation-messages', conversationId, page, perPage],
    queryFn: async () => {
      const { data } = await api.get(`/conversations/${conversationId}/messages`, {
        params: { page, perPage },
      })
      return data.data as MessagesData
    },
    enabled: !!conversationId,
  })
}

export function useSendMessage(conversationId: number | undefined) {
  const queryClient = useQueryClient()

  return useMutation<
    { message: Message },
    Error,
    { content?: string; replyToId?: number; attachments?: File[] }
  >({
    mutationFn: async ({ content = '', replyToId, attachments }) => {
      const formData = new FormData()
      formData.append('content', content)
      if (replyToId) {
        formData.append('replyToId', String(replyToId))
      }
      if (attachments && attachments.length > 0) {
        attachments.forEach((file) => {
          formData.append('attachments[]', file)
        })
      }

      const { data } = await api.post(`/conversations/${conversationId}/messages`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return data.data as { message: Message }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation-messages', conversationId] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

export function useListenMessages(conversationId: number | undefined) {
  const { echo } = useEcho()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!echo || !conversationId) return

    const channel = echo.private(`conversation.${conversationId}`)

    channel.listen('.message.sent', (event: { message: Message }) => {
      queryClient.setQueryData<MessagesData>(
        ['conversation-messages', conversationId],
        (old) => {
          if (!old) return old
          const exists = old.messages.some((m) => m.id === event.message.id)
          if (exists) return old
          return { ...old, messages: [event.message, ...old.messages] }
        }
      )
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    })

    return () => {
      channel.stopListening('.message.sent')
      echo.leave(`private-conversation.${conversationId}`)
    }
  }, [echo, conversationId, queryClient])
}
