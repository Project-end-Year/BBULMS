import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, csrfCookie } from '@/lib/axios'

export interface User {
  id: number
  name: string
  email: string
  phone?: string | null
  avatar?: string | null
  locale: string
  isActive: boolean
  roles: { id: number; name: string }[]
  department?: { id: number; code: string; name: string } | null
}

export interface LoginCredentials {
  email: string
  password: string
}

async function fetchUser(): Promise<User | null> {
  try {
    const { data } = await api.get('/user')
    return data?.data || null
  } catch (error: any) {
    if (error.status === 401) {
      return null
    }
    throw error
  }
}

async function login(credentials: LoginCredentials): Promise<User> {
  await csrfCookie()
  await api.post('/login', credentials)
  const user = await fetchUser()
  if (!user) throw new Error('Failed to retrieve user after login')
  return user
}

async function logout(): Promise<void> {
  await csrfCookie()
  await api.post('/logout')
}

export function useAuth() {
  const queryClient = useQueryClient()

  const userQuery = useQuery({
    queryKey: ['user'],
    queryFn: fetchUser,
    staleTime: Infinity,
  })

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (user) => {
      queryClient.setQueryData(['user'], user)
    },
  })

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(['user'], null)
    },
  })

  return {
    user: userQuery.data,
    isLoading: userQuery.isLoading,
    isAuthenticated: !!userQuery.data,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    loginError: loginMutation.error,
    loginPending: loginMutation.isPending,
  }
}
