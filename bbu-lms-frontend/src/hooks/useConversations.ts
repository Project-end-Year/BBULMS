import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/axios'

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

export function useCreateDirectConversation() {
  const queryClient = useQueryClient()

  return useMutation<SingleConversationData, Error, { userId: number }>({
    mutationFn: async ({ userId }) => {
      const { data } = await api.post('/conversations/direct', { userId })
      return data.data as SingleConversationData
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}
