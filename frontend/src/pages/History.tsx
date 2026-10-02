import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { historyApi } from '@/services/api'
import { useToast } from '@/contexts/ToastContext'
import type { HistoryItem } from '@/types'
import {
  History as HistoryIcon,
  Search,
  Filter,
  Trash2,
  ExternalLink,
  MessageSquareText,
  HelpCircle,
  Code2,
  FileText,
  UserCheck,
  CalendarRange,
  FileSearch,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatDate } from '@/lib/utils'

const FILTERS = [
  { label: 'All Activities', value: '' },
  { label: 'Chat Doubts', value: 'chat' },
  { label: 'Quizzes', value: 'quiz' },
  { label: 'Code Generations', value: 'code' },
  { label: 'Notes', value: 'notes' },
  { label: 'Interviews', value: 'interview' },
  { label: 'Study Plans', value: 'planner' },
  { label: 'PDF Sessions', value: 'document' },
]

export const History: React.FC = () => {
  const [selectedType, setSelectedType] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const queryClient = useQueryClient()
  const { error: toastError, success: toastSuccess } = useToast()

  const { data: historyData, isLoading } = useQuery({
    queryKey: ['history', selectedType, searchQuery],
    queryFn: () =>
      historyApi.get({
        type: selectedType || undefined,
        search: searchQuery || undefined,
      }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => historyApi.deleteItem(id),
    onSuccess: () => {
      toastSuccess('History item removed.')
      queryClient.invalidateQueries({ queryKey: ['history'] })
    },
    onError: () => {
      toastError('Failed to delete history item.')
    },
  })

  const getToolLink = (item: HistoryItem) => {
    switch (item.activity_type) {
      case 'chat':
        return '/chat'
      case 'quiz':
        return '/quiz'
      case 'code':
        return '/code'
      case 'notes':
        return '/notes'
      case 'interview':
        return '/interview'
      case 'planner':
        return '/planner'
      case 'document':
        return '/pdf'
      default:
        return '/'
    }
  }

  const getToolIcon = (type: string) => {
    switch (type) {
      case 'chat':
        return <MessageSquareText className="w-4 h-4 text-purple-400" />
      case 'quiz':
        return <HelpCircle className="w-4 h-4 text-blue-400" />
      case 'code':
        return <Code2 className="w-4 h-4 text-emerald-400" />
      case 'notes':
        return <FileText className="w-4 h-4 text-amber-400" />
      case 'interview':
        return <UserCheck className="w-4 h-4 text-rose-400" />
      case 'planner':
        return <CalendarRange className="w-4 h-4 text-indigo-400" />
      case 'document':
        return <FileSearch className="w-4 h-4 text-cyan-400" />
      default:
        return <HistoryIcon className="w-4 h-4 text-slate-400" />
    }
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto relative">
      <div className="ambient-glow bg-purple-600/20 w-[450px] h-[450px] top-0 left-10" />
      <div className="ambient-glow bg-blue-600/20 w-[450px] h-[450px] bottom-10 right-10" />

      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 flex items-center justify-center text-white shadow-xl shadow-purple-500/20">
            <HistoryIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white">
              Activity & Interaction History
            </h1>
            <p className="text-xs text-slate-400">
              Review, filter, search, and manage all your historical AI academic sessions.
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filter bar */}
      <div className="glass-panel rounded-3xl p-6 space-y-4 relative z-10">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search history by keyword or topic..."
              className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm"
            />
          </div>
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
          <span className="text-xs font-semibold text-slate-400 mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </span>
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setSelectedType(f.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                selectedType === f.value
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* History Items List */}
      <div className="space-y-3 relative z-10">
        {historyData?.items?.map((item) => (
          <div
            key={item.id}
            className="glass-panel rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-purple-500/30 transition group"
          >
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-white/10 shrink-0">
                {getToolIcon(item.activity_type)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white group-hover:text-purple-300 transition">
                    {item.title}
                  </span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-purple-950/80 text-purple-300 border border-purple-500/20">
                    {item.activity_type}
                  </span>
                </div>
                {item.description && (
                  <p className="text-xs text-slate-400 mt-1 line-clamp-1">{item.description}</p>
                )}
                <span className="text-[10px] text-slate-500 font-mono block mt-1">
                  {formatDate(item.created_at)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <Link
                to={getToolLink(item)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white border border-white/10 transition"
              >
                <span>Open Tool</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={() => deleteMutation.mutate(item.id)}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 border border-transparent hover:border-rose-500/20 transition"
                title="Delete history entry"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {historyData?.items?.length === 0 && !isLoading && (
          <div className="glass-panel rounded-3xl p-12 text-center text-slate-400">
            <HistoryIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-300">No interaction records found</p>
            <p className="text-xs text-slate-500 mt-1">
              Interactions across Chat, Quiz, Code, Notes, Interview, and PDF will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
