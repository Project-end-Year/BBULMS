import { useState } from 'react'
import { GraduationCap, Eye, EyeOff } from 'lucide-react'
import { User, users } from '../lib/mock'

interface LoginProps {
  onLogin: (user: User) => void
}

const demoRoles = [
  { label: 'Admin', email: 'admin@bbu.edu.kh', password: 'password', color: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  { label: 'Professor', email: 's.kimheng@bbu.edu.kh', password: 'password', color: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { label: 'Student', email: 'pich.pisey@student.bbu.edu.kh', password: 'password', color: 'bg-violet-500', badge: 'bg-violet-50 text-violet-700 border-violet-200' },
]

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const user = users.find((u) => u.email === email)
    if (!user || password !== 'password') {
      setError('Invalid credentials. Use any demo account below.')
      return
    }
    onLogin(user)
  }

  const fillDemo = (e: string) => {
    setEmail(e)
    setPassword('password')
    setError('')
  }

  return (
    <div className="min-h-screen bg-[#F0F5FF] flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-96 bg-blue-900 p-10 text-white">
        <div>
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
              <span className="text-blue-900 font-black text-base">BB</span>
            </div>
            <div>
              <div className="font-bold text-lg leading-tight">Build Bright</div>
              <div className="text-blue-300 text-sm">University</div>
            </div>
          </div>
          <h2 className="text-3xl font-bold leading-snug mb-4">
            Learning<br />Management<br />System
          </h2>
          <p className="text-blue-300 text-sm leading-relaxed">
            Siem Reap Campus — 6 Faculties · Multiple Degree Levels · Morning, Afternoon, Evening & Weekend Sessions
          </p>
        </div>

        <div className="space-y-4">
          <div className="text-blue-400 text-xs uppercase tracking-wider font-medium">Faculties</div>
          {['Business Management', 'Tourism & Hospitality', 'Science & Technology', 'Education & Languages', 'Law & Social Science', 'Engineering & Architecture'].map((f) => (
            <div key={f} className="flex items-center gap-2 text-blue-200 text-sm">
              <div className="w-1 h-1 rounded-full bg-blue-500" />
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 lg:hidden">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-700 rounded-xl mb-3">
              <GraduationCap className="text-white" size={24} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">BBU LMS</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-1">Sign in</h2>
            <p className="text-slate-500 text-sm mb-6">Access your Build Bright University portal</p>

            {/* Demo quick-fill */}
            <div className="mb-6">
              <p className="text-xs text-slate-500 mb-2 font-medium">Quick demo access:</p>
              <div className="flex gap-2">
                {demoRoles.map((r) => (
                  <button
                    key={r.label}
                    onClick={() => fillDemo(r.email)}
                    className={`flex-1 py-2 px-3 rounded-lg border text-xs font-semibold transition-all hover:shadow-sm ${r.badge} ${email === r.email ? 'ring-2 ring-offset-1 ring-blue-500' : ''}`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError('') }}
                  placeholder="you@bbu.edu.kh"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError('') }}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-xl">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
              >
                Sign In
              </button>
            </form>

            <p className="text-center text-xs text-slate-400 mt-6">
              Demo password for all accounts: <span className="font-mono bg-slate-100 px-1 rounded">password</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
