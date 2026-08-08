import { createContext, useCallback, useContext, useMemo } from 'react'
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

interface AuthContextValue {
  user: User | null | undefined
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<User>
  logout: () => Promise<void>
  loginError: Error | null
  loginPending: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()

  const {
    data: user,
    isLoading,
  } = useQuery({
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

  const handleLogin = useCallback(
    (credentials: LoginCredentials) => loginMutation.mutateAsync(credentials),
    [loginMutation]
  )

  const handleLogout = useCallback(
    () => logoutMutation.mutateAsync(),
    [logoutMutation]
  )

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login: handleLogin,
      logout: handleLogout,
      loginError: loginMutation.error as Error | null,
      loginPending: loginMutation.isPending,
    }),
    [user, isLoading, handleLogin, handleLogout, loginMutation.error, loginMutation.isPending]
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
