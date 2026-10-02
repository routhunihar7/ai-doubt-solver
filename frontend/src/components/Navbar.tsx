import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Sparkles, LogOut, User, Menu, Cpu, BookOpen } from 'lucide-react'

interface NavbarProps {
  onToggleSidebar?: () => void
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-30 w-full glass-panel border-b border-white/5 px-4 lg:px-8 py-3 backdrop-blur-xl">
      <div className="flex items-center justify-between mx-auto max-w-7xl">
        {/* Left: Brand & Mobile Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 -ml-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 lg:hidden"
            aria-label="Toggle navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-purple-500/20 group-hover:scale-105 transition">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold text-base md:text-lg tracking-tight text-white">
                <span>AI Doubt Solver</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Academic
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">AI Academic Assistant</p>
            </div>
          </Link>
        </div>

        {/* Center/Right Status & User Info */}
        <div className="flex items-center gap-3 md:gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/60 border border-purple-500/20 text-xs text-purple-300">
            <Cpu className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Groq Ultra-Fast AI</span>
          </div>

          {isAuthenticated && user ? (
            <div className="flex items-center gap-2 md:gap-3">
              <Link
                to="/profile"
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-white/10 transition"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white uppercase">
                  {user.full_name?.charAt(0) || 'U'}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-semibold text-slate-200 leading-tight">
                    {user.full_name}
                  </p>
                  <p className="text-[10px] text-slate-400 leading-tight truncate max-w-[120px]">
                    {user.preferences?.target_exam || user.email}
                  </p>
                </div>
              </Link>

              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-rose-950/30 border border-transparent hover:border-rose-500/30 transition"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-purple-600/20 transition"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
