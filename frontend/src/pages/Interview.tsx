import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { interviewApi } from '@/services/api'
import { LoadingState } from '@/components/LoadingState'
import { AIResponse } from '@/components/AIResponse'
import { useToast } from '@/contexts/ToastContext'
import type { InterviewSession, InterviewFeedback } from '@/types'
import {
  UserCheck,
  Sparkles,
  Award,
  Send,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  RotateCcw,
  MessageSquare,
  History,
  ShieldAlert,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { formatDate } from '@/lib/utils'

const TOPICS = [
  'Data Structures & Algorithms',
  'Operating Systems',
  'Database Management (DBMS)',
  'Object-Oriented Programming (OOP)',
  'Computer Networking',
  'Java Core & Multithreading',
  'Python & Concurrency',
  'SQL & Query Optimization',
  'Machine Learning & AI',
]

export const Interview: React.FC = () => {
  const [topic, setTopic] = useState('Data Structures & Algorithms')
  const [difficulty, setDifficulty] = useState('Medium')
  const [targetRole, setTargetRole] = useState('Software Engineer')
  const [numQuestions, setNumQuestions] = useState(3)

  const [activeSession, setActiveSession] = useState<InterviewSession | null>(null)
  const [currentQIndex, setCurrentQIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [feedbacks, setFeedbacks] = useState<Record<string, InterviewFeedback>>({})

  const queryClient = useQueryClient()
  const { error: toastError, success: toastSuccess } = useToast()

  // Fetch interview history
  const { data: interviewHistory = [] } = useQuery({
    queryKey: ['interviews'],
    queryFn: interviewApi.list,
  })

  // Generate Interview Session Mutation
  const generateMutation = useMutation({
    mutationFn: () =>
      interviewApi.generate({
        topic,
        difficulty,
        target_role: targetRole,
        num_questions: numQuestions,
      }),
    onSuccess: (data) => {
      setActiveSession(data)
      setCurrentQIndex(0)
      setUserAnswer('')
      setFeedbacks({})
      toastSuccess(`Generated technical interview for ${data.topic}!`)
      queryClient.invalidateQueries({ queryKey: ['interviews'] })
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.message || 'Failed to start interview.'
      toastError(typeof msg === 'string' ? msg : 'Error generating interview session.')
    },
  })

  // Submit Answer Mutation
  const answerMutation = useMutation({
    mutationFn: (data: { questionId: string; answer: string }) => {
      if (!activeSession) throw new Error('No active session')
      return interviewApi.submitAnswer(activeSession.id, {
        question_id: data.questionId,
        user_answer: data.answer,
      })
    },
    onSuccess: (feedback, variables) => {
      setFeedbacks((prev) => ({
        ...prev,
        [variables.questionId]: feedback,
      }))
      toastSuccess(`Evaluated! Score: ${feedback.score}/10`)
      queryClient.invalidateQueries({ queryKey: ['interviews'] })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
    onError: (err: any) => {
      toastError('Failed to evaluate candidate answer.')
    },
  })

  const handleEvaluate = (questionId: string) => {
    if (!userAnswer.trim()) {
      toastError('Please provide your technical explanation.')
      return
    }
    answerMutation.mutate({ questionId, answer: userAnswer })
  }

  const currentQ = activeSession?.questions[currentQIndex]
  const currentFeedback = currentQ ? feedbacks[currentQ.id || ''] : null

  return (
    <div className="space-y-8 max-w-5xl mx-auto relative">
      <div className="ambient-glow bg-rose-600/20 w-[450px] h-[450px] top-0 left-10" />
      <div className="ambient-glow bg-purple-600/20 w-[450px] h-[450px] bottom-10 right-10" />

      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 via-pink-600 to-purple-500 flex items-center justify-center text-white shadow-xl shadow-rose-500/20">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white">
              AI Technical Interview Simulator
            </h1>
            <p className="text-xs text-slate-400">
              Practice real interview questions, receive gold-standard evaluations, and answer probing follow-ups.
            </p>
          </div>
        </div>

        {activeSession && (
          <button
            onClick={() => {
              setActiveSession(null)
              setUserAnswer('')
              setFeedbacks({})
            }}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-white/10 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Session</span>
          </button>
        )}
      </div>

      {/* Setup Form (when no active session) */}
      {!activeSession && !generateMutation.isPending && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
          <div className="lg:col-span-2 glass-panel rounded-3xl p-6 sm:p-8 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-rose-400" />
              <span>Configure Technical Interview</span>
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Technical Focus Area
              </label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full glass-input rounded-xl px-3.5 py-2.5 text-sm bg-slate-900 border-white/10"
              >
                {TOPICS.map((t) => (
                  <option key={t} value={t} className="bg-slate-900 text-white">
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs bg-slate-900 border-white/10"
                >
                  <option value="Easy">Easy (Fundamentals & Definitions)</option>
                  <option value="Medium">Medium (System & Implementation)</option>
                  <option value="Hard">Hard (Deep Edge-Cases & Architecture)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Target Role
                </label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Backend Engineer, Systems Dev"
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                />
              </div>
            </div>

            <button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-semibold text-sm shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition"
            >
              <UserCheck className="w-4 h-4" />
              <span>Start Mock Technical Interview</span>
            </button>
          </div>

          {/* Previous sessions */}
          <div className="glass-panel rounded-3xl p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <History className="w-4 h-4 text-rose-400" />
              <span>Previous Interview History</span>
            </h3>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {interviewHistory.map((s) => (
                <div
                  key={s.id}
                  onClick={() => {
                    setActiveSession(s)
                    setCurrentQIndex(0)
                  }}
                  className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-white/5 hover:border-rose-500/30 cursor-pointer text-xs transition"
                >
                  <span className="font-semibold text-slate-200 block truncate">{s.topic}</span>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span>{s.difficulty} • {s.target_role}</span>
                    <span>{formatDate(s.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {generateMutation.isPending && (
        <LoadingState
          message="Simulating FAANG/Tier-1 Interviewer..."
          subtitle={`Formulating rigorous technical questions, benchmark answers, and probes for ${topic}.`}
        />
      )}

      {/* Active Interview Session */}
      {activeSession && currentQ && (
        <div className="space-y-6 relative z-10">
          {/* Question Stepper */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {activeSession.questions.map((q, idx) => {
                const isCurrent = idx === currentQIndex
                const hasFeedback = !!feedbacks[q.id || ''] || !!q.feedback
                return (
                  <button
                    key={q.id || idx}
                    onClick={() => {
                      setCurrentQIndex(idx)
                      setUserAnswer(q.user_answer || '')
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      isCurrent
                        ? 'bg-rose-600 text-white'
                        : hasFeedback
                        ? 'bg-purple-900/50 text-purple-300 border border-purple-500/30'
                        : 'bg-slate-900/80 text-slate-400 border border-white/5'
                    }`}
                  >
                    <span>Q{idx + 1}</span>
                    {hasFeedback && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                  </button>
                )
              })}
            </div>

            <span className="text-xs font-mono text-slate-400">
              {activeSession.topic} • {activeSession.difficulty}
            </span>
          </div>

          {/* Question Card */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 bg-rose-950/60 border border-rose-500/20 px-2.5 py-1 rounded-full inline-block">
                Interviewer Question #{currentQIndex + 1}
              </span>
              <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed">
                {currentQ.question}
              </h3>
            </div>

            {/* Answer Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Your Technical Answer
              </label>
              <textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                rows={5}
                placeholder="Structure your answer with core principles, algorithmic approach, and practical engineering trade-offs..."
                className="w-full glass-input rounded-2xl p-4 text-xs sm:text-sm leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => handleEvaluate(currentQ.id || '')}
                disabled={!userAnswer.trim() || answerMutation.isPending}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-semibold text-xs shadow-lg shadow-rose-600/30 flex items-center gap-2 disabled:opacity-40 transition"
              >
                <Sparkles className="w-4 h-4" />
                <span>Evaluate Answer with AI</span>
              </button>
            </div>

            {/* AI Evaluation & Feedback */}
            {currentFeedback && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-2xl bg-purple-950/30 border border-purple-500/30 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-2">
                    <Award className="w-4 h-4 text-cyan-400" />
                    <span>Technical Evaluation Result</span>
                  </span>
                  <div className="px-3 py-1 rounded-xl bg-purple-900/80 border border-purple-400/40 text-purple-200 font-mono font-bold text-sm">
                    Score: {currentFeedback.score} / 10
                  </div>
                </div>

                <div className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  <strong className="text-purple-300 block mb-1">Interviewer Feedback:</strong>
                  <p>{currentFeedback.feedback}</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
                  <strong className="text-cyan-300 text-xs block">Benchmark Ideal Model Answer:</strong>
                  <div className="text-xs sm:text-sm text-slate-300">
                    <AIResponse content={currentFeedback.ideal_answer} showActions={false} />
                  </div>
                </div>

                {currentFeedback.follow_up_question && (
                  <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-xs sm:text-sm text-indigo-200">
                    <strong className="text-indigo-300 block mb-1 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Probing Follow-Up Question:</span>
                    </strong>
                    <p>{currentFeedback.follow_up_question}</p>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
