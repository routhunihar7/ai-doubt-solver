import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { profileApi, historyApi } from '@/services/api'
import {
  MessageSquareText,
  HelpCircle,
  Code2,
  FileText,
  UserCheck,
  CalendarRange,
  FileSearch,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Brain,
  Clock,
  Award,
  Zap,
  BookOpen,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { formatDate } from '@/lib/utils'

const toolCards = [
  {
    title: 'AI Doubt Chat',
    description: 'Ask deep academic questions with step-by-step explanations, formulas, and LaTeX math.',
    path: '/chat',
    icon: MessageSquareText,
    gradient: 'from-purple-500/20 to-indigo-500/20',
    border: 'border-purple-500/30',
    iconColor: 'text-purple-400',
    tag: 'Tutor',
  },
  {
    title: 'Quiz Generator',
    description: 'Generate customized MCQs on any topic with instant grading and detailed answer rationales.',
    path: '/quiz',
    icon: HelpCircle,
    gradient: 'from-blue-500/20 to-cyan-500/20',
    border: 'border-blue-500/30',
    iconColor: 'text-blue-400',
    tag: 'Practice',
  },
  {
    title: 'Code Generator',
    description: 'Synthesize optimal code in Python, Java, C++, JS, SQL with Big-O complexity & test cases.',
    path: '/code',
    icon: Code2,
    gradient: 'from-emerald-500/20 to-teal-500/20',
    border: 'border-emerald-500/30',
    iconColor: 'text-emerald-400',
    tag: 'Engineering',
  },
  {
    title: 'Notes Summarizer',
    description: 'Condense lectures and textbook notes into bulleted summaries, concepts & 5-min cheat sheets.',
    path: '/notes',
    icon: FileText,
    gradient: 'from-amber-500/20 to-orange-500/20',
    border: 'border-amber-500/30',
    iconColor: 'text-amber-400',
    tag: 'Revision',
  },
  {
    title: 'Interview Preparation',
    description: 'Simulate technical mock interviews (OOP, DSA, OS, DBMS) with AI answer grading & follow-ups.',
    path: '/interview',
    icon: UserCheck,
    gradient: 'from-rose-500/20 to-pink-500/20',
    border: 'border-rose-500/30',
    iconColor: 'text-rose-400',
    tag: 'Career',
  },
  {
    title: 'Study Planner',
    description: 'Build a personalized daily study roadmap and timetable based on your exam date and hours.',
    path: '/planner',
    icon: CalendarRange,
    gradient: 'from-indigo-500/20 to-purple-500/20',
    border: 'border-indigo-500/30',
    iconColor: 'text-indigo-400',
    tag: 'Strategy',
  },
  {
    title: 'PDF Assistant (RAG)',
    description: 'Upload textbooks & lecture PDFs to search context, ask doubts, and cite exact page sources.',
    path: '/pdf',
    icon: FileSearch,
    gradient: 'from-cyan-500/20 to-sky-500/20',
    border: 'border-cyan-500/30',
    iconColor: 'text-cyan-400',
    tag: 'Vector RAG',
  },
]

export const Dashboard: React.FC = () => {
  const { user } = useAuth()

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.get,
    staleTime: 30000,
  })

  const { data: historyData } = useQuery({
    queryKey: ['recentHistory'],
    queryFn: () => historyApi.get({ limit: 5 }),
    staleTime: 30000,
  })

  const stats = profile?.stats || {
    total_questions_asked: 0,
    total_quizzes_completed: 0,
    average_quiz_score: 0,
    total_code_generations: 0,
    total_notes_summarized: 0,
    total_interviews_taken: 0,
    total_documents_uploaded: 0,
    total_study_plans: 0,
  }

  return (
    <div className="space-y-8 relative">
      {/* Background Ambience */}
      <div className="ambient-glow bg-purple-600/30 w-[500px] h-[500px] -top-32 -left-32" />
      <div className="ambient-glow bg-cyan-500/20 w-[450px] h-[450px] top-1/2 -right-32" />

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 glass-panel-glow rounded-3xl p-6 md:p-10 overflow-hidden"
      >
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            <span>Next-Generation Academic AI Platform</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Your AI Academic <span className="gradient-text-purple-cyan">Workspace</span>
          </h1>

          <p className="text-sm md:text-base text-slate-300 mt-3 max-w-2xl leading-relaxed">
            Welcome back, <span className="text-white font-semibold">{user?.full_name || 'Scholar'}</span>.
            Solve complex doubts, generate quizzes, write code, summarize lectures, and chat with your academic documents powered by Groq ultra-fast AI.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <Link
              to="/chat"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-purple-600/30 flex items-center gap-2 transition"
            >
              <MessageSquareText className="w-4 h-4" />
              <span>Ask a Doubt</span>
            </Link>
            <Link
              to="/pdf"
              className="px-5 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-200 font-semibold text-sm flex items-center gap-2 transition"
            >
              <FileSearch className="w-4 h-4 text-cyan-400" />
              <span>Upload PDF (RAG)</span>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Stats Counter Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
        <motion.div
          whileHover={{ y: -3 }}
          className="glass-card rounded-2xl p-4 sm:p-5 border border-purple-500/20"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Doubts Asked</span>
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <Brain className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white font-mono">
            {stats.total_questions_asked}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span>Interactive discussions</span>
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="glass-card rounded-2xl p-4 sm:p-5 border border-blue-500/20"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Quizzes Taken</span>
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white font-mono">
            {stats.total_quizzes_completed}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Avg Score: <span className="text-cyan-400 font-bold">{stats.average_quiz_score}%</span>
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="glass-card rounded-2xl p-4 sm:p-5 border border-emerald-500/20"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Code & Notes</span>
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Code2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white font-mono">
            {stats.total_code_generations + stats.total_notes_summarized}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Synthesized algorithms & summaries
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="glass-card rounded-2xl p-4 sm:p-5 border border-amber-500/20"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Target Exam</span>
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold text-white truncate">
            {user?.preferences?.target_exam || 'General Prep'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Goal: {user?.preferences?.study_hours_target || 4} hrs/day
          </p>
        </motion.div>
      </div>

      {/* Feature Cards Grid */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">AI Academic Tools</h2>
            <p className="text-xs text-slate-400">Select an intelligent assistant to begin</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {toolCards.map((tool) => {
            const Icon = tool.icon
            return (
              <Link
                key={tool.path}
                to={tool.path}
                className={`glass-card rounded-2xl p-5 flex flex-col justify-between border ${tool.border} group`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${tool.gradient} ${tool.iconColor}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-white/5 text-slate-300 border border-white/10">
                      {tool.tag}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition">
                    {tool.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    {tool.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-medium text-slate-300 group-hover:text-cyan-300 transition">
                  <span>Open Tool</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Recent Activity Feed */}
      {historyData?.items && historyData.items.length > 0 && (
        <div className="relative z-10 glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Recent Academic Interactions</span>
            </h3>
            <Link to="/history" className="text-xs font-semibold text-purple-400 hover:text-purple-300">
              View All
            </Link>
          </div>

          <div className="space-y-2.5">
            {historyData.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-white/5 text-xs hover:border-purple-500/30 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="uppercase font-mono text-[10px] px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-500/20">
                    {item.activity_type}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-200">{item.title}</p>
                    {item.description && (
                      <p className="text-[11px] text-slate-400 truncate max-w-md">{item.description}</p>
                    )}
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {formatDate(item.created_at)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
