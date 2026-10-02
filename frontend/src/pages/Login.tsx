import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { Sparkles, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react'

export const Login: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login } = useAuth()
  const { error: toastError, success: toastSuccess } = useToast()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toastError('Please fill in both email and password.')
      return
    }

    setIsSubmitting(true)
    try {
      await login(email, password)
      toastSuccess('Welcome back!')
      navigate('/')
    } catch (err: any) {
      console.error('Login error details:', err)
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.response?.data?.error ||
        (err.code === 'ERR_NETWORK' || err.message === 'Network Error'
          ? 'Network Error: Cannot connect to the backend server. Please check backend deployment status.'
          : 'Invalid email or password.')
      toastError(typeof msg === 'string' ? msg : 'Login failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background glow orbs */}
      <div className="ambient-glow bg-purple-600 w-96 h-96 top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2" />
      <div className="ambient-glow bg-cyan-500 w-96 h-96 bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2" />

      <div className="w-full max-w-md relative z-10">
        <div className="glass-panel-glow rounded-3xl p-8 sm:p-10 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 text-white shadow-xl shadow-purple-600/30 mb-4">
              <Sparkles className="w-7 h-7" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Welcome Back
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Sign in to your AI Academic Assistant workspace
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  required
                  className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-6 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-semibold text-sm shadow-lg shadow-purple-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer link */}
          <div className="mt-8 pt-6 border-t border-white/5 text-center text-xs text-slate-400">
            Don't have an account yet?{' '}
            <Link to="/register" className="text-purple-400 hover:text-purple-300 font-semibold transition">
              Create an Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
