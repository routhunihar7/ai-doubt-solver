import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  MessageSquareText,
  HelpCircle,
  Code2,
  FileText,
  UserCheck,
  CalendarRange,
  FileSearch,
  History,
  UserCircle,
  Sparkles,
  Zap,
} from 'lucide-react'

interface SidebarProps {
  isOpen: boolean
  onClose?: () => void
}

const navItems = [
  {
    name: 'Dashboard',
    path: '/',
    icon: LayoutDashboard,
    badge: null,
  },
  {
    name: 'AI Doubt Chat',
    path: '/chat',
    icon: MessageSquareText,
    badge: 'Real-time',
  },
  {
    name: 'Quiz Generator',
    path: '/quiz',
    icon: HelpCircle,
    badge: 'MCQ',
  },
  {
    name: 'Code Generator',
    path: '/code',
    icon: Code2,
    badge: null,
  },
  {
    name: 'Notes Summarizer',
    path: '/notes',
    icon: FileText,
    badge: null,
  },
  {
    name: 'Interview Prep',
    path: '/interview',
    icon: UserCheck,
    badge: 'Mock',
  },
  {
    name: 'Study Planner',
    path: '/planner',
    icon: CalendarRange,
    badge: null,
  },
  {
    name: 'PDF Assistant',
    path: '/pdf',
    icon: FileSearch,
    badge: 'RAG',
  },
  {
    name: 'History',
    path: '/history',
    icon: History,
    badge: null,
  },
  {
    name: 'Profile',
    path: '/profile',
    icon: UserCircle,
    badge: null,
  },
]

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 glass-panel border-r border-white/5 pt-16 pb-6 px-3 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col gap-1 overflow-y-auto pt-2">
          <div className="px-3 pb-3 mb-2 border-b border-white/5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Academic Tools
            </span>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                      isActive
                        ? 'bg-gradient-to-r from-purple-600/30 to-indigo-600/20 text-purple-200 border border-purple-500/40 shadow-lg shadow-purple-500/10'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 border border-transparent'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-1.5 rounded-lg transition ${
                            isActive
                              ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30'
                              : 'bg-slate-800/60 text-slate-400 group-hover:text-purple-300 group-hover:bg-slate-800'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span>{item.name}</span>
                      </div>

                      {item.badge && (
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            isActive
                              ? 'bg-purple-500/30 text-purple-200 border border-purple-500/40'
                              : 'bg-slate-800 text-slate-400 group-hover:text-slate-300'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              )
            })}
          </nav>
        </div>

        {/* Bottom promo widget */}
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-purple-950/40 via-slate-900/60 to-cyan-950/30 border border-purple-500/20">
          <div className="flex items-center gap-2 mb-1.5">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold text-white">AI Academic Workspace</span>
          </div>
          <p className="text-[11px] text-slate-400 mb-2">
            Powered by Groq LLMs with pgvector RAG document search.
          </p>
          <div className="flex items-center gap-1.5 text-[10px] text-purple-300 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Operational & Ready</span>
          </div>
        </div>
      </aside>
    </>
  )
}
