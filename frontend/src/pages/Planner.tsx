import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { plannerApi } from '@/services/api'
import { LoadingState } from '@/components/LoadingState'
import { useToast } from '@/contexts/ToastContext'
import type { StudyPlan } from '@/types'
import {
  CalendarRange,
  Sparkles,
  CheckCircle2,
  Clock,
  Target,
  BookOpen,
  Calendar,
  Layers,
  Check,
  Plus,
  Trash2,
  History,
  Flag,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { formatDate } from '@/lib/utils'

export const Planner: React.FC = () => {
  const [subjectsText, setSubjectsText] = useState('Data Structures, Operating Systems, Computer Networks, SQL')
  const [examDate, setExamDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return d.toISOString().split('T')[0]
  })
  const [availableHours, setAvailableHours] = useState(4)
  const [currentLevel, setCurrentLevel] = useState('Intermediate')
  const [targetScore, setTargetScore] = useState('Grade A+ / 90%+')

  const [currentPlan, setCurrentPlan] = useState<StudyPlan | null>(null)
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({})

  const queryClient = useQueryClient()
  const { error: toastError, success: toastSuccess } = useToast()

  // Fetch previous plans
  const { data: previousPlans = [], isLoading: loadingPlans } = useQuery({
    queryKey: ['studyPlans'],
    queryFn: plannerApi.list,
  })

  // Generate Plan Mutation
  const generateMutation = useMutation({
    mutationFn: () => {
      const subjectsList = subjectsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      if (subjectsList.length === 0) {
        throw new Error('Please enter at least one subject.')
      }
      return plannerApi.generate({
        subjects: subjectsList,
        exam_date: examDate,
        available_hours_per_day: availableHours,
        current_level: currentLevel,
        target_score: targetScore,
      })
    },
    onSuccess: (data) => {
      setCurrentPlan(data)
      setCompletedTasks({})
      toastSuccess(`Generated customized roadmap: ${data.title}!`)
      queryClient.invalidateQueries({ queryKey: ['studyPlans'] })
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.message || 'Failed to create plan.'
      toastError(typeof msg === 'string' ? msg : 'Error generating study schedule.')
    },
  })

  const toggleTask = (taskId: string) => {
    setCompletedTasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }))
  }

  // Days list for week view
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  return (
    <div className="space-y-8 max-w-6xl mx-auto relative">
      <div className="ambient-glow bg-indigo-600/20 w-[450px] h-[450px] top-0 left-10" />
      <div className="ambient-glow bg-cyan-600/20 w-[450px] h-[450px] bottom-10 right-10" />

      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
            <CalendarRange className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white">
              AI Personalized Study Planner
            </h1>
            <p className="text-xs text-slate-400">
              Build spaced-repetition schedules, daily task matrices, and exam countdown roadmaps.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        {/* Left Form: Parameters & History */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-panel rounded-3xl p-6 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Target & Availability</span>
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Subjects (Comma-separated)
              </label>
              <textarea
                value={subjectsText}
                onChange={(e) => setSubjectsText(e.target.value)}
                rows={3}
                placeholder="e.g. Data Structures, OS, Calculus"
                className="w-full glass-input rounded-xl p-3 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Target Exam Date
              </label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full glass-input rounded-xl px-3 py-2 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Hours/Day
                </label>
                <input
                  type="number"
                  min={1}
                  max={16}
                  value={availableHours}
                  onChange={(e) => setAvailableHours(Number(e.target.value))}
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Level
                </label>
                <select
                  value={currentLevel}
                  onChange={(e) => setCurrentLevel(e.target.value)}
                  className="w-full glass-input rounded-xl px-2.5 py-2 text-xs bg-slate-900 border-white/10"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Target Score / Objective
              </label>
              <input
                type="text"
                value={targetScore}
                onChange={(e) => setTargetScore(e.target.value)}
                placeholder="e.g. 90%+, FAANG Placement"
                className="w-full glass-input rounded-xl px-3 py-2 text-xs"
              />
            </div>

            <button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition"
            >
              <CalendarRange className="w-4 h-4" />
              <span>Generate Personalized Plan</span>
            </button>
          </div>

          {/* History */}
          <div className="glass-panel rounded-3xl p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <History className="w-4 h-4 text-indigo-400" />
              <span>Previous Study Plans</span>
            </h3>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {previousPlans.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => setCurrentPlan(plan)}
                  className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-white/5 hover:border-indigo-500/30 cursor-pointer text-xs transition"
                >
                  <span className="font-semibold text-slate-200 block truncate">{plan.title}</span>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span>Exam: {plan.exam_date}</span>
                    <span>{plan.available_hours_per_day} hrs/day</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Area: Timetable & Matrix */}
        <div className="lg:col-span-8">
          {generateMutation.isPending ? (
            <LoadingState
              message="Calculating optimal cognitive learning roadmap..."
              subtitle="Structuring weekly subject distribution, spaced repetitions, and daily checklists."
            />
          ) : currentPlan ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Plan Header Card */}
              <div className="glass-panel-glow rounded-3xl p-6 space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white">{currentPlan.title}</h2>
                  <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    Exam Date: {currentPlan.exam_date}
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Daily Allocation: <span className="text-purple-300 font-bold">{currentPlan.available_hours_per_day} Hours</span> • Goal: <span className="text-emerald-400 font-bold">{currentPlan.target_score}</span>
                </p>
              </div>

              {/* Weekly Calendar / Timeline Schedule */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  <span>7-Day Weekly Schedule & Tasks</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {daysOfWeek.map((day) => {
                    const dayData = currentPlan.schedule?.[day] || {
                      focus_subject: 'Review & Practice',
                      hours: 2,
                      tasks: ['Review previous topics', 'Solve practice doubts'],
                    }

                    return (
                      <div
                        key={day}
                        className="glass-panel rounded-2xl p-4 space-y-3 border border-white/5 hover:border-purple-500/30 transition"
                      >
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                          <span className="font-bold text-sm text-purple-300">{day}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/80 text-purple-200 border border-purple-500/30">
                            {dayData.hours} Hours
                          </span>
                        </div>

                        <div>
                          <span className="text-[11px] font-semibold text-cyan-300 block mb-1">
                            Focus: {dayData.focus_subject}
                          </span>

                          <div className="space-y-1.5 mt-2">
                            {dayData.tasks?.map((task: string, tIdx: number) => {
                              const taskId = `${day}-${tIdx}`
                              const isChecked = !!completedTasks[taskId]
                              return (
                                <div
                                  key={tIdx}
                                  onClick={() => toggleTask(taskId)}
                                  className={`flex items-start gap-2 p-2 rounded-xl text-xs cursor-pointer transition ${
                                    isChecked
                                      ? 'bg-emerald-950/40 text-emerald-300 line-through'
                                      : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800'
                                  }`}
                                >
                                  <div
                                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                                      isChecked
                                        ? 'bg-emerald-600 border-emerald-400 text-white'
                                        : 'border-white/20 bg-slate-800'
                                    }`}
                                  >
                                    {isChecked && <Check className="w-3 h-3" />}
                                  </div>
                                  <span className="leading-snug">{task}</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Milestones & Tips */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Milestones */}
                {currentPlan.milestones && currentPlan.milestones.length > 0 && (
                  <div className="glass-panel rounded-2xl p-5 space-y-3">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Flag className="w-4 h-4 text-cyan-400" />
                      <span>Roadmap Milestones</span>
                    </h4>
                    <div className="space-y-2">
                      {currentPlan.milestones.map((m, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-xl bg-slate-900/60 border border-white/5 text-xs"
                        >
                          <span className="font-bold text-cyan-300">
                            Week {m.week}: {m.title}
                          </span>
                          <p className="text-slate-400 text-[11px] mt-0.5">{m.target}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Study Tips */}
                {currentPlan.tips && currentPlan.tips.length > 0 && (
                  <div className="glass-panel rounded-2xl p-5 space-y-3">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <span>Cognitive Learning Tips</span>
                    </h4>
                    <ul className="space-y-2 text-xs text-slate-300">
                      {currentPlan.tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="glass-panel rounded-3xl p-12 text-center text-slate-400 flex flex-col items-center justify-center h-80">
              <CalendarRange className="w-12 h-12 text-slate-600 mb-3" />
              <p className="text-sm font-medium text-slate-300">No study plan generated yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Fill in your exam date and daily study availability on the left to generate your custom timetable.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
