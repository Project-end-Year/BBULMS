import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { GraduationCap, Loader2, Lock, ArrowLeft, CheckCircle2 } from 'lucide-react'

import { api, csrfCookie } from '@/lib/axios'

function ResetPasswordPage() {
  const [searchParams] = useSearchParams()

  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  useEffect(() => {
    const tokenParam = searchParams.get('token')
    const emailParam = searchParams.get('email')

    if (!tokenParam || !emailParam) {
      toast.error('Invalid or expired reset link')
      return
    }

    setToken(tokenParam)
    setEmail(emailParam)
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!password || !passwordConfirmation) {
      toast.error('Please enter and confirm your new password')
      return
    }

    if (password !== passwordConfirmation) {
      toast.error('Passwords do not match')
      return
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    setIsSubmitting(true)

    try {
      await csrfCookie()
      await api.post('/reset-password', {
        token,
        email,
        password,
        password_confirmation: passwordConfirmation,
      })
      setIsSuccess(true)
      toast.success('Password reset successfully')
    } catch (error: any) {
      const message = error?.message || 'Failed to reset password'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-6">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center justify-center gap-3">
          <GraduationCap className="h-10 w-10 text-bbu-blue" />
          <h1 className="text-2xl font-semibold text-text">BBU LMS</h1>
        </div>

        {!isSuccess ? (
          <>
            <p className="mb-6 text-center text-text-muted">Create a new password for {email || 'your account'}.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="mb-1 block text-sm font-medium text-text">
                  New password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting || !token}
                    className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-4 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20 disabled:cursor-not-allowed disabled:bg-gray-50"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="passwordConfirmation"
                  className="mb-1 block text-sm font-medium text-text"
                >
                  Confirm new password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  <input
                    id="passwordConfirmation"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    disabled={isSubmitting || !token}
                    className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-4 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20 disabled:cursor-not-allowed disabled:bg-gray-50"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !token}
                className="flex w-full items-center justify-center rounded-lg bg-bbu-blue px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-bbu-blue-dark disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting…
                  </>
                ) : (
                  'Reset password'
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="mb-2 text-lg font-semibold text-text">Password reset</h2>
            <p className="mb-6 text-sm text-text-muted">
              Your password has been updated. You can now sign in with your new password.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center rounded-lg bg-bbu-blue px-4 py-2 text-sm font-medium text-white hover:bg-bbu-blue-dark"
            >
              Sign in
            </Link>
          </div>
        )}

        {!isSuccess && (
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center text-sm font-medium text-bbu-blue hover:text-bbu-blue-dark"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default ResetPasswordPage
