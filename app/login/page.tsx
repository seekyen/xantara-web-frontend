'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export default function LoginPage() {
  const router               = useRouter()
  const { user, hydrated, login } = useAuth()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  useEffect(() => {
    if (hydrated && user) router.replace('/dashboard')
  }, [hydrated, user, router])

  if (!hydrated || user) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await login(email, password)
    if (result.success) {
      router.push('/dashboard')
    } else {
      setError(result.error ?? 'Login failed.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/images/xantara-logo.png" alt="Xantara" className="h-12 w-auto mx-auto mb-3" />
          <p className="text-sm text-neutral-400 mt-0.5">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="block text-xs font-semibold text-neutral-600
                uppercase tracking-wide mb-1.5">
                Email
              </label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ck@xantara.com"
                required
                className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-brand-600
                  placeholder:text-neutral-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-600
                uppercase tracking-wide mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3 py-2.5 pr-10 text-sm border border-neutral-200
                    rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600
                    placeholder:text-neutral-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                    text-neutral-400 hover:text-neutral-600"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-danger-50 rounded-lg">
                <AlertCircle className="w-4 h-4 text-danger-600 flex-shrink-0" />
                <span className="text-xs text-danger-600">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-brand-600 text-white text-sm font-semibold
                rounded-lg hover:bg-brand-800 transition-colors mt-2
                disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>

          </form>
        </div>

      </div>
    </div>
  )
}
