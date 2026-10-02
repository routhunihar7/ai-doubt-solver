import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notesApi } from '@/services/api'
import { LoadingState } from '@/components/LoadingState'
import { AIResponse } from '@/components/AIResponse'
import { useToast } from '@/contexts/ToastContext'
import type { NoteSummary } from '@/types'
import {
  FileText,
  Sparkles,
  BookOpen,
  ListOrdered,
  KeyRound,
  Zap,
  Tag,
  Copy,
  Check,
  History,
  ArrowRight,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { formatDate } from '@/lib/utils'

export const Notes: React.FC = () => {
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [activeTab, setActiveTab] = useState<'summary' | 'keypoints' | 'concepts' | 'quicknotes'>('summary')
  const [currentNote, setCurrentNote] = useState<NoteSummary | null>(null)
  const [copiedQuick, setCopiedQuick] = useState(false)

  const queryClient = useQueryClient()
  const { error: toastError, success: toastSuccess } = useToast()

  // Fetch notes history
  const { data: notesHistory = [], isLoading: loadingHistory } = useQuery({
    queryKey: ['notes'],
    queryFn: notesApi.list,
  })

  // Summarize Mutation
  const summarizeMutation = useMutation({
    mutationFn: () =>
      notesApi.summarize({
        content,
        title: title || undefined,
      }),
    onSuccess: (data) => {
      setCurrentNote(data)
      toastSuccess(`Summarized "${data.title}" successfully!`)
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.message || 'Failed to summarize notes.'
      toastError(typeof msg === 'string' ? msg : 'Error processing summary.')
    },
  })

  const handleCopyQuick = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedQuick(true)
    setTimeout(() => setCopiedQuick(false), 2000)
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto relative">
      <div className="ambient-glow bg-amber-600/20 w-[450px] h-[450px] top-0 left-10" />
      <div className="ambient-glow bg-purple-600/20 w-[450px] h-[450px] bottom-10 right-10" />

      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 via-orange-600 to-rose-400 flex items-center justify-center text-white shadow-xl shadow-amber-500/20">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white">
              AI Notes Summarizer & Revision Sheet Generator
            </h1>
            <p className="text-xs text-slate-400">
              Transform dense study materials into structured key points, conceptual glossaries, and 5-min review sheets.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        {/* Left Column: Input Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Input Notes Content</span>
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Note Title (Optional)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Distributed Systems & CAP Theorem"
                className="w-full glass-input rounded-xl px-4 py-2.5 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Raw Notes / Lecture Transcript
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                placeholder="Paste your lecture notes, textbook chapters, or meeting transcript here..."
                className="w-full glass-input rounded-xl p-3 text-xs leading-relaxed"
              />
            </div>

            <button
              onClick={() => summarizeMutation.mutate()}
              disabled={content.trim().length < 20 || summarizeMutation.isPending}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-semibold text-sm shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 disabled:opacity-40 transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Academic Summary</span>
            </button>
          </div>

          {/* History */}
          <div className="glass-panel rounded-3xl p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <History className="w-4 h-4 text-amber-400" />
              <span>Previous Summaries</span>
            </h3>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {notesHistory.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setCurrentNote(item)}
                  className="p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-white/5 hover:border-amber-500/30 cursor-pointer text-xs transition"
                >
                  <p className="font-semibold text-slate-200 truncate">{item.title}</p>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {formatDate(item.created_at)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Structured Output */}
        <div className="lg:col-span-7">
          {summarizeMutation.isPending ? (
            <LoadingState
              message="Extracting concepts & key points..."
              subtitle="Structuring executive summary, isolating key terms, and preparing high-yield review notes."
            />
          ) : currentNote ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-3xl overflow-hidden border border-amber-500/30 shadow-2xl"
            >
              {/* Note Header & Tab Navigation */}
              <div className="p-6 bg-slate-950/80 border-b border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white">{currentNote.title}</h2>
                  <span className="text-[10px] font-semibold uppercase px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Structured Notes
                  </span>
                </div>

                {/* Keywords Bar */}
                {currentNote.keywords && currentNote.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {currentNote.keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-800/80 text-purple-300 border border-white/5"
                      >
                        #{kw}
                      </span>
                    ))}
                  </div>
                )}

                {/* Navigation Tabs */}
                <div className="flex items-center gap-2 pt-2 border-t border-white/5 overflow-x-auto">
                  <button
                    onClick={() => setActiveTab('summary')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                      activeTab === 'summary'
                        ? 'bg-amber-600 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Executive Summary</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('keypoints')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                      activeTab === 'keypoints'
                        ? 'bg-amber-600 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <ListOrdered className="w-3.5 h-3.5" />
                    <span>Key Takeaways</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('concepts')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                      activeTab === 'concepts'
                        ? 'bg-amber-600 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Key Concepts</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('quicknotes')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                      activeTab === 'quicknotes'
                        ? 'bg-amber-600 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Quick Revision Sheet</span>
                  </button>
                </div>
              </div>

              {/* Tab Contents */}
              <div className="p-6">
                {activeTab === 'summary' && (
                  <div className="text-xs sm:text-sm text-slate-200 leading-relaxed space-y-3">
                    <AIResponse content={currentNote.summary} showActions={false} />
                  </div>
                )}

                {activeTab === 'keypoints' && (
                  <div className="space-y-2.5">
                    {currentNote.key_points.map((pt, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3 rounded-2xl bg-slate-900/60 border border-white/5 text-xs sm:text-sm text-slate-200"
                      >
                        <div className="w-5 h-5 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          {idx + 1}
                        </div>
                        <p className="leading-relaxed">{pt}</p>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'concepts' && (
                  <div className="space-y-3">
                    {currentNote.important_concepts.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-1 text-xs sm:text-sm"
                      >
                        <span className="font-bold text-amber-300 block">{item.concept}</span>
                        <p className="text-slate-300 leading-relaxed">{item.definition}</p>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'quicknotes' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Zap className="w-4 h-4" />
                        <span>High-Yield Revision Sheet</span>
                      </span>
                      {currentNote.quick_revision_notes && (
                        <button
                          onClick={() => handleCopyQuick(currentNote.quick_revision_notes!)}
                          className="flex items-center gap-1 text-xs text-slate-300 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800"
                        >
                          {copiedQuick ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Sheet</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-amber-500/20 text-xs sm:text-sm text-slate-200 leading-relaxed">
                      <AIResponse
                        content={currentNote.quick_revision_notes || 'No quick notes.'}
                        showActions={false}
                      />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="glass-panel rounded-3xl p-12 text-center text-slate-400 flex flex-col items-center justify-center h-80">
              <FileText className="w-12 h-12 text-slate-600 mb-3" />
              <p className="text-sm font-medium text-slate-300">No notes summarized yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Paste your lecture text on the left and click Generate to view executive summaries, key terms, and revision sheets.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
