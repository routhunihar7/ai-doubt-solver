import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { profileApi } from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import {
  UserCircle,
  Mail,
  Target,
  Clock,
  BookOpen,
  Award,
  Brain,
  Code2,
  FileText,
  UserCheck,
  FileSearch,
  Lock,
  Save,
  CheckCircle2,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { formatDate } from '@/lib/utils'

export const Profile: React.FC = () => {
  const { user, refreshUser } = useAuth()
  const queryClient = useQueryClient()
  const { error: toastError, success: toastSuccess } = useToast()

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.get,
  })

  // Edit fields
  const [fullName, setFullName] = useState('')
  const [targetExam, setTargetExam] = useState('')
  const [studyHoursTarget, setStudyHoursTarget] = useState(4)
  const [favSubjectsText, setFavSubjectsText] = useState('')

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
      setTargetExam(profile.preferences?.target_exam || '')
      setStudyHoursTarget(profile.preferences?.study_hours_target || 4)
      setFavSubjectsText(profile.preferences?.favorite_subjects?.join(', ') || '')
    }
  }, [profile])

  // Update Profile Mutation
  const updateMutation = useMutation({
    mutationFn: () =>
      profileApi.update({
        full_name: fullName,
        target_exam: targetExam,
        study_hours_target: studyHoursTarget,
        favorite_subjects: favSubjectsText.split(',').map((s) => s.trim()).filter(Boolean),
      }),
    onSuccess: () => {
      toastSuccess('Profile updated successfully!')
      refreshUser()
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
    onError: () => {
      toastError('Failed to update profile.')
    },
  })

  // Change Password Mutation
  const passwordMutation = useMutation({
    mutationFn: () =>
      profileApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    onSuccess: () => {
      toastSuccess('Password changed successfully!')
      setCurrentPassword('')
      setNewPassword('')
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || 'Failed to update password.'
      toastError(typeof msg === 'string' ? msg : 'Error changing password.')
    },
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
    <div className="space-y-8 max-w-5xl mx-auto relative">
      <div className="ambient-glow bg-purple-600/20 w-[450px] h-[450px] top-0 left-10" />
      <div className="ambient-glow bg-cyan-600/20 w-[450px] h-[450px] bottom-10 right-10" />

      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 flex items-center justify-center text-white text-xl font-bold uppercase shadow-xl shadow-purple-500/20">
            {profile?.full_name?.charAt(0) || 'U'}
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white">{profile?.full_name}</h1>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <Mail className="w-3.5 h-3.5" />
              <span>{profile?.email}</span>
              <span>• Joined {formatDate(profile?.created_at)}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Aggregated Analytics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10">
        <div className="glass-card rounded-2xl p-4 border border-purple-500/20">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Doubts Asked</span>
            <Brain className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{stats.total_questions_asked}</div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-blue-500/20">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Quiz Avg</span>
            <Award className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-400 font-mono">{stats.average_quiz_score}%</div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-emerald-500/20">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Code Solved</span>
            <Code2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{stats.total_code_generations}</div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-cyan-500/20">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">PDFs & Notes</span>
            <FileSearch className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {stats.total_documents_uploaded + stats.total_notes_summarized}
          </div>
        </div>
      </div>

      {/* Edit Preferences & Password Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
        {/* Profile Settings */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-400" />
            <span>Learning Goals & Preferences</span>
          </h2>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full glass-input rounded-xl px-3.5 py-2 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Target Exam / Academic Milestone
              </label>
              <input
                type="text"
                value={targetExam}
                onChange={(e) => setTargetExam(e.target.value)}
                placeholder="e.g. GRE, GATE, CS Degree Finals"
                className="w-full glass-input rounded-xl px-3.5 py-2 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Daily Study Target (Hours)
              </label>
              <input
                type="number"
                min={1}
                max={18}
                value={studyHoursTarget}
                onChange={(e) => setStudyHoursTarget(Number(e.target.value))}
                className="w-full glass-input rounded-xl px-3.5 py-2 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Focus Subjects (Comma-separated)
              </label>
              <input
                type="text"
                value={favSubjectsText}
                onChange={(e) => setFavSubjectsText(e.target.value)}
                placeholder="e.g. Algorithms, Distributed Systems, Calculus"
                className="w-full glass-input rounded-xl px-3.5 py-2 text-xs"
              />
            </div>

            <button
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
              className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition"
            >
              <Save className="w-4 h-4" />
              <span>Save Preferences</span>
            </button>
          </div>
        </div>

        {/* Change Password */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Lock className="w-4 h-4 text-cyan-400" />
            <span>Security & Password</span>
          </h2>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full glass-input rounded-xl px-3.5 py-2 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                New Password (Min 6 chars)
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full glass-input rounded-xl px-3.5 py-2 text-xs"
              />
            </div>

            <button
              onClick={() => passwordMutation.mutate()}
              disabled={!currentPassword || newPassword.length < 6 || passwordMutation.isPending}
              className="w-full mt-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-white/10 flex items-center justify-center gap-2 disabled:opacity-40 transition"
            >
              <Lock className="w-4 h-4 text-cyan-400" />
              <span>Update Password</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
