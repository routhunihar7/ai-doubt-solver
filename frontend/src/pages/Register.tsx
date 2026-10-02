import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { Sparkles, Mail, Lock, User, Target, ArrowRight, Loader2 } from 'lucide-react'

export const Register: React.FC = () => {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [targetExam, setTargetExam] = useState('Computer Science Degree')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { register } = useAuth()
  const { error: toastError, success: toastSuccess } = useToast()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName || !email || !password) {
      toastError('Please complete all required fields.')
      return
    }
    if (password.length < 6) {
      toastError('Password must be at least 6 characters long.')
      return
    }

    setIsSubmitting(true)
    try {
      await register(fullName, email, password, {
        target_exam: targetExam,
        favorite_subjects: ['Algorithms', 'System Design'],
        study_hours_target: 4,
        theme: 'dark',
      })
      toastSuccess('Account created successfully! Welcome aboard.')
      navigate('/')
    } catch (err: any) {
      console.error('Registration error details:', err)
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.response?.data?.error ||
        (err.code === 'ERR_NETWORK' || err.message === 'Network Error'
          ? 'Network Error: Cannot connect to the backend server. Please check backend deployment status.'
          : 'Registration failed. Please try again.')
      toastError(typeof msg === 'string' ? msg : 'Registration failed. Try a different email.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="ambient-glow bg-purple-600 w-96 h-96 top-1/4 right-1/4 translate-x-1/2 -translate-y-1/2" />
      <div className="ambient-glow bg-indigo-500 w-96 h-96 bottom-1/4 left-1/4 -translate-x-1/2 translate-y-1/2" />

      <div className="w-full max-w-md relative z-10">
        <div className="glass-panel-glow rounded-3xl p-8 sm:p-10 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 text-white shadow-xl shadow-purple-600/30 mb-4">
              <Sparkles className="w-7 h-7" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Create Your Account
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Unlock the full suite of AI academic tools
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Johnson"
                  required
                  className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-sm"
                />
              </div>
            </div>

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
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Target Exam / Academic Goal
              </label>
              <div className="relative">
                <Target className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={targetExam}
                  onChange={(e) => setTargetExam(e.target.value)}
                  placeholder="e.g. GRE, GATE, CS Finals, Tech Interviews"
                  className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
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
                  <span>Setting Up Workspace...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer link */}
          <div className="mt-8 pt-6 border-t border-white/5 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-purple-400 hover:text-purple-300 font-semibold transition">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
