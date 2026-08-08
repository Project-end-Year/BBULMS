import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { GraduationCap, Loader2 } from 'lucide-react'

import { useAuth } from '@/hooks/useAuth'

function LoginPage() {
  const navigate = useNavigate()
  const { login, isAuthenticated, isLoading, loginPending, loginError } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, isLoading, navigate])

  useEffect(() => {
    if (loginError) {
      toast.error(loginError.message || 'Sign in failed')
    }
  }, [loginError])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      toast.error('Please enter both email and password')
      return
    }

    try {
      await login({ email, password })
      toast.success('Signed in successfully')
      navigate('/dashboard', { replace: true })
    } catch {
      // Error is already surfaced via loginError and toast; no need to throw.
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-6">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center justify-center gap-3">
          <GraduationCap className="h-10 w-10 text-bbu-blue" />
          <h1 className="text-2xl font-semibold text-text">BBU LMS</h1>
        </div>

        <p className="mb-6 text-center text-text-muted">Sign in to your account</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-text">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loginPending}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20 disabled:cursor-not-allowed disabled:bg-gray-50"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-text">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loginPending}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20 disabled:cursor-not-allowed disabled:bg-gray-50"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loginPending || isLoading}
            className="flex w-full items-center justify-center rounded-lg bg-bbu-blue px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-bbu-blue-dark disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loginPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in…
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default LoginPage
