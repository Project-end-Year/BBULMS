import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { GraduationCap, Loader2, Mail, ArrowLeft } from 'lucide-react'

import { api, csrfCookie } from '@/lib/axios'

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSent, setIsSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast.error('Please enter your email')
      return
    }

    setIsSubmitting(true)

    try {
      await csrfCookie()
      await api.post('/forgot-password', { email })
      setIsSent(true)
      toast.success('Reset link sent')
    } catch (error: any) {
      toast.error(error?.message || 'Failed to send reset link')
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

        {!isSent ? (
          <>
            <p className="mb-6 text-center text-text-muted">
              Enter your email and we will send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-text">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-4 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20 disabled:cursor-not-allowed disabled:bg-gray-50"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center rounded-lg bg-bbu-blue px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-bbu-blue-dark disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  'Send reset link'
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Mail className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="mb-2 text-lg font-semibold text-text">Check your email</h2>
            <p className="mb-6 text-sm text-text-muted">
              If an account exists for {email}, a password reset link has been sent.
              In local development the link is written to the Laravel log file.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center text-sm font-medium text-bbu-blue hover:text-bbu-blue-dark"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to sign in
            </Link>
          </div>
        )}

        {!isSent && (
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

export default ForgotPasswordPage
