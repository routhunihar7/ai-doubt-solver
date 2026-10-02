import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { quizApi } from '@/services/api'
import { LoadingState } from '@/components/LoadingState'
import { ErrorState } from '@/components/ErrorState'
import { useToast } from '@/contexts/ToastContext'
import type { QuizSession, QuizSubmitResult } from '@/types'
import confetti from 'canvas-confetti'
import {
  HelpCircle,
  Award,
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Clock,
  Check,
  ChevronRight,
  Layers,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDate } from '@/lib/utils'

export const Quiz: React.FC = () => {
  const [topic, setTopic] = useState('')
  const [subject, setSubject] = useState('Computer Science')
  const [difficulty, setDifficulty] = useState('Medium')
  const [numQuestions, setNumQuestions] = useState(5)

  const [activeQuiz, setActiveQuiz] = useState<QuizSession | null>(null)
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({})
  const [quizResult, setQuizResult] = useState<QuizSubmitResult | null>(null)

  const queryClient = useQueryClient()
  const { error: toastError, success: toastSuccess } = useToast()

  // Fetch previous quiz history
  const { data: quizHistory = [], isLoading: loadingHistory } = useQuery({
    queryKey: ['quizzes'],
    queryFn: quizApi.list,
  })

  // Generate Mutation
  const generateMutation = useMutation({
    mutationFn: () =>
      quizApi.generate({
        topic,
        subject,
        difficulty,
        num_questions: numQuestions,
      }),
    onSuccess: (data) => {
      setActiveQuiz(data)
      setCurrentQuestionIdx(0)
      setUserAnswers({})
      setQuizResult(null)
      toastSuccess(`Generated ${data.questions.length} questions on ${data.topic}!`)
      queryClient.invalidateQueries({ queryKey: ['quizzes'] })
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.message || 'Failed to generate quiz.'
      toastError(typeof msg === 'string' ? msg : 'Error generating quiz.')
    },
  })

  // Submit Mutation
  const submitMutation = useMutation({
    mutationFn: () => {
      if (!activeQuiz) throw new Error('No active quiz')
      const answersArray = activeQuiz.questions.map((q) => ({
        question_id: q.id,
        selected_option: userAnswers[q.id] || '',
      }))
      return quizApi.submit(activeQuiz.id, answersArray)
    },
    onSuccess: (result) => {
      setQuizResult(result)
      if (result.percentage >= 70) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        })
      }
      toastSuccess(`Quiz complete! Score: ${result.score}%`)
      queryClient.invalidateQueries({ queryKey: ['quizzes'] })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
    onError: (err: any) => {
      toastError('Failed to evaluate quiz submission.')
    },
  })

  const handleSelectOption = (questionId: string, option: string) => {
    if (quizResult) return // Read-only once submitted
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }))
  }

  const handleReset = () => {
    setActiveQuiz(null)
    setQuizResult(null)
    setUserAnswers({})
    setCurrentQuestionIdx(0)
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto relative">
      {/* Ambience */}
      <div className="ambient-glow bg-blue-600/20 w-[400px] h-[400px] top-0 left-1/4" />
      <div className="ambient-glow bg-purple-600/20 w-[400px] h-[400px] bottom-10 right-10" />

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 glass-panel p-6 rounded-3xl relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white">
              AI Academic Quiz Generator
            </h1>
            <p className="text-xs text-slate-400">
              Generate dynamic MCQs, test your mastery, and receive instant pedagogical explanations.
            </p>
          </div>
        </div>

        {activeQuiz && (
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-white/10 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Quiz</span>
          </button>
        )}
      </div>

      {/* Quiz Creation Form (when no active quiz) */}
      {!activeQuiz && !generateMutation.isPending && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
          <div className="lg:col-span-2 glass-panel rounded-3xl p-6 sm:p-8">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Configure Quiz Parameters</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Academic Topic
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Graph Traversals (BFS/DFS), React Hook Lifecycle, Quantum Mechanics"
                  className="w-full glass-input rounded-xl px-4 py-2.5 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Subject Area
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-sm bg-slate-900 border-white/10"
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Data Structures & Algorithms">Algorithms & DSA</option>
                    <option value="Operating Systems">Operating Systems</option>
                    <option value="Databases & SQL">Databases & SQL</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Difficulty Level
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full glass-input rounded-xl px-3 py-2 text-sm bg-slate-900 border-white/10"
                  >
                    <option value="Easy">Easy (Fundamentals)</option>
                    <option value="Medium">Medium (Conceptual)</option>
                    <option value="Hard">Hard (Deep Analytical)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Questions Count
                  </label>
                  <select
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(Number(e.target.value))}
                    className="w-full glass-input rounded-xl px-3 py-2 text-sm bg-slate-900 border-white/10"
                  >
                    <option value={3}>3 Questions</option>
                    <option value={5}>5 Questions</option>
                    <option value={10}>10 Questions</option>
                  </select>
                </div>
              </div>

              <button
                onClick={() => generateMutation.mutate()}
                disabled={!topic.trim() || generateMutation.isPending}
                className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-40 transition"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate Quiz with AI</span>
              </button>
            </div>
          </div>

          {/* Quick Quiz History sidebar */}
          <div className="glass-panel rounded-3xl p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-cyan-400" />
              <span>Previous Quizzes</span>
            </h3>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {quizHistory.map((q) => (
                <div
                  key={q.id}
                  onClick={() => {
                    setActiveQuiz(q)
                    if (q.score !== null && q.score !== undefined) {
                      setQuizResult({
                        quiz_id: q.id,
                        topic: q.topic,
                        score: q.score,
                        total_questions: q.total_questions,
                        correct_count: q.questions.filter((item) => item.is_correct).length,
                        percentage: q.score,
                        questions: q.questions,
                      })
                    }
                  }}
                  className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-white/5 hover:border-blue-500/30 cursor-pointer text-xs transition"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-200 truncate">{q.topic}</span>
                    {q.score !== null && q.score !== undefined && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 font-bold border border-emerald-500/20 text-[10px]">
                        {q.score}%
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>{q.difficulty} • {q.total_questions} Qs</span>
                    <span>{formatDate(q.created_at)}</span>
                  </div>
                </div>
              ))}

              {quizHistory.length === 0 && !loadingHistory && (
                <p className="text-xs text-slate-400 text-center py-6">
                  No completed quizzes yet.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {generateMutation.isPending && (
        <LoadingState
          message={`Crafting ${numQuestions} custom questions on "${topic}"...`}
          subtitle="Formulating distinct options, verified answers, and pedagogical rationales."
        />
      )}

      {/* Interactive Quiz Runner */}
      {activeQuiz && (
        <div className="space-y-6 relative z-10">
          {/* Result Banner if submitted */}
          {quizResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-panel-glow rounded-3xl p-6 sm:p-8 text-center border-purple-500/40"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-cyan-400 text-white shadow-xl shadow-purple-600/30 mb-3">
                <Award className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">
                Quiz Evaluation: {quizResult.score}%
              </h2>
              <p className="text-xs text-slate-300">
                You got <span className="text-emerald-400 font-bold">{quizResult.correct_count}</span> out of{' '}
                <span className="text-white font-bold">{quizResult.total_questions}</span> questions correct.
              </p>
            </motion.div>
          )}

          {/* Question Navigator */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
            <div className="flex items-center gap-2">
              {activeQuiz.questions.map((q, idx) => {
                const isAnswered = !!userAnswers[q.id]
                const isCurrent = idx === currentQuestionIdx
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIdx(idx)}
                    className={`w-9 h-9 rounded-xl text-xs font-bold font-mono transition flex items-center justify-center ${
                      isCurrent
                        ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                        : isAnswered
                        ? 'bg-purple-900/60 text-purple-300 border border-purple-500/40'
                        : 'bg-slate-900/80 text-slate-400 border border-white/5 hover:bg-slate-800'
                    }`}
                  >
                    {idx + 1}
                  </button>
                )
              })}
            </div>

            <div className="text-xs font-mono text-slate-400">
              Question {currentQuestionIdx + 1} of {activeQuiz.questions.length}
            </div>
          </div>

          {/* Current Question Card */}
          {activeQuiz.questions[currentQuestionIdx] && (
            <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-base sm:text-lg font-semibold text-white leading-snug">
                  {activeQuiz.questions[currentQuestionIdx].question}
                </h3>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {activeQuiz.questions[currentQuestionIdx].options.map((opt, oIdx) => {
                  const qId = activeQuiz.questions[currentQuestionIdx].id
                  const isSelected = userAnswers[qId] === opt
                  const isSubmitted = !!quizResult
                  const correctAnswer = activeQuiz.questions[currentQuestionIdx].correct_answer

                  let optionStyle = 'bg-slate-900/60 hover:bg-slate-800/80 border-white/10 text-slate-200'
                  if (isSelected && !isSubmitted) {
                    optionStyle = 'bg-blue-600/30 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                  }
                  if (isSubmitted) {
                    if (opt.toLowerCase().trim() === correctAnswer?.toLowerCase().trim()) {
                      optionStyle = 'bg-emerald-950/60 border-emerald-500/70 text-emerald-200'
                    } else if (isSelected && opt.toLowerCase().trim() !== correctAnswer?.toLowerCase().trim()) {
                      optionStyle = 'bg-rose-950/60 border-rose-500/70 text-rose-200'
                    }
                  }

                  return (
                    <div
                      key={oIdx}
                      onClick={() => handleSelectOption(qId, opt)}
                      className={`flex items-center gap-3 p-4 rounded-2xl border text-sm font-medium cursor-pointer transition ${optionStyle}`}
                    >
                      <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xs font-mono shrink-0">
                        {String.fromCharCode(65 + oIdx)}
                      </div>
                      <span className="flex-1">{opt}</span>
                    </div>
                  )
                })}
              </div>

              {/* Explanation (if submitted) */}
              {quizResult && activeQuiz.questions[currentQuestionIdx].explanation && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 text-xs sm:text-sm text-purple-200 space-y-1"
                >
                  <div className="font-semibold text-purple-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>Explanation & Rationale:</span>
                  </div>
                  <p>{activeQuiz.questions[currentQuestionIdx].explanation}</p>
                </motion.div>
              )}

              {/* Navigation & Submit Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <button
                  onClick={() => setCurrentQuestionIdx((p) => Math.max(0, p - 1))}
                  disabled={currentQuestionIdx === 0}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white disabled:opacity-30 transition flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                {!quizResult && currentQuestionIdx === activeQuiz.questions.length - 1 ? (
                  <button
                    onClick={() => submitMutation.mutate()}
                    disabled={submitMutation.isPending}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Submit Quiz</span>
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      setCurrentQuestionIdx((p) => Math.min(activeQuiz.questions.length - 1, p + 1))
                    }
                    disabled={currentQuestionIdx === activeQuiz.questions.length - 1}
                    className="px-4 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white disabled:opacity-30 transition flex items-center gap-2"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
