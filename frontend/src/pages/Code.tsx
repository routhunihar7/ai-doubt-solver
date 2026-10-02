import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { codeApi } from '@/services/api'
import { LoadingState } from '@/components/LoadingState'
import { AIResponse } from '@/components/AIResponse'
import { useToast } from '@/contexts/ToastContext'
import type { CodeGeneration } from '@/types'
import {
  Code2,
  Sparkles,
  Terminal,
  Copy,
  Check,
  Cpu,
  Layers,
  FileCode,
  ArrowRight,
  Clock,
  History,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { formatDate } from '@/lib/utils'

const LANGUAGES = [
  'Python',
  'Java',
  'C++',
  'C',
  'JavaScript',
  'TypeScript',
  'SQL',
  'Go',
  'Rust',
]

const SAMPLE_PROMPTS = [
  'Implement LRU Cache with O(1) get and put operations',
  'Write a function to detect cycle in a directed graph using Kahn’s algorithm',
  'Find longest substring without repeating characters in Python',
  'Write a recursive algorithm for generating all permutations of an array',
]

export const Code: React.FC = () => {
  const [problemDescription, setProblemDescription] = useState('')
  const [language, setLanguage] = useState('Python')
  const [difficulty, setDifficulty] = useState('Medium')
  const [currentResult, setCurrentResult] = useState<CodeGeneration | null>(null)
  const [copiedCode, setCopiedCode] = useState(false)

  const queryClient = useQueryClient()
  const { error: toastError, success: toastSuccess } = useToast()

  // Fetch code history
  const { data: codeHistory = [], isLoading: loadingHistory } = useQuery({
    queryKey: ['codeGenerations'],
    queryFn: codeApi.list,
  })

  // Mutation for code generation
  const generateMutation = useMutation({
    mutationFn: () =>
      codeApi.generate({
        problem_description: problemDescription,
        language,
        difficulty,
      }),
    onSuccess: (data) => {
      setCurrentResult(data)
      toastSuccess(`Code generated successfully in ${data.language}!`)
      queryClient.invalidateQueries({ queryKey: ['codeGenerations'] })
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.message || 'Failed to generate code.'
      toastError(typeof msg === 'string' ? msg : 'Error generating code.')
    },
  })

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto relative">
      <div className="ambient-glow bg-emerald-600/20 w-[450px] h-[450px] top-0 left-10" />
      <div className="ambient-glow bg-indigo-600/20 w-[450px] h-[450px] bottom-10 right-10" />

      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-400 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
            <Code2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white">
              AI Code Generator & Complexity Analyst
            </h1>
            <p className="text-xs text-slate-400">
              Generate optimal, bug-free implementations with time & space complexity breakdowns.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        {/* Left Column: Input Form & History */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Problem Specification</span>
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Target Language
              </label>
              <div className="grid grid-cols-3 gap-2">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setLanguage(lang)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold transition ${
                      language === lang
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                        : 'bg-slate-900/80 text-slate-400 border border-white/5 hover:bg-slate-800'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs bg-slate-900 border-white/10"
                >
                  <option value="Easy">Easy (Optimal Basic)</option>
                  <option value="Medium">Medium (Standard)</option>
                  <option value="Hard">Hard (Production / Advanced)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Problem Description or Task
              </label>
              <textarea
                value={problemDescription}
                onChange={(e) => setProblemDescription(e.target.value)}
                rows={4}
                placeholder="e.g. Implement binary search on rotated sorted array in O(log n) time..."
                className="w-full glass-input rounded-xl p-3 text-xs leading-relaxed"
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400">Quick Prompt Templates:</span>
              <div className="space-y-1">
                {SAMPLE_PROMPTS.map((sample) => (
                  <button
                    key={sample}
                    onClick={() => setProblemDescription(sample)}
                    className="w-full text-left p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800 text-[11px] text-slate-300 truncate border border-white/5 transition"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => generateMutation.mutate()}
              disabled={!problemDescription.trim() || generateMutation.isPending}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 disabled:opacity-40 transition"
            >
              <FileCode className="w-4 h-4" />
              <span>Synthesize Code Solution</span>
            </button>
          </div>

          {/* History Sidebar */}
          <div className="glass-panel rounded-3xl p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <History className="w-4 h-4 text-emerald-400" />
              <span>Recent Code Generations</span>
            </h3>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {codeHistory.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setCurrentResult(item)}
                  className="p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-white/5 hover:border-emerald-500/30 cursor-pointer text-xs transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200 truncate">{item.title}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300">
                      {item.language}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Code Output & Analysis */}
        <div className="lg:col-span-7">
          {generateMutation.isPending ? (
            <LoadingState
              message={`Synthesizing optimal ${language} code...`}
              subtitle="Formulating algorithm logic, verifying Big-O complexities, and writing edge cases."
            />
          ) : currentResult ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Code Viewer Panel */}
              <div className="glass-panel rounded-3xl overflow-hidden border border-emerald-500/30 shadow-2xl">
                {/* Code Header bar */}
                <div className="flex items-center justify-between px-6 py-3 bg-slate-950/90 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                    <span className="font-mono text-xs font-semibold text-emerald-400 ml-2">
                      {currentResult.title}
                    </span>
                  </div>

                  <button
                    onClick={() => handleCopy(currentResult.generated_code)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Code editor snippet */}
                <pre className="p-6 overflow-x-auto text-xs sm:text-sm font-mono text-emerald-300 bg-slate-950/70 leading-relaxed max-h-[420px]">
                  <code>{currentResult.generated_code}</code>
                </pre>

                {/* Big-O Badges */}
                <div className="grid grid-cols-2 gap-px bg-white/5 border-t border-white/5">
                  <div className="p-3 bg-slate-900/90 text-xs">
                    <span className="text-slate-400 block text-[10px] uppercase tracking-wider">
                      Time Complexity
                    </span>
                    <span className="font-mono font-bold text-cyan-300">
                      {currentResult.time_complexity || 'O(N)'}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-900/90 text-xs">
                    <span className="text-slate-400 block text-[10px] uppercase tracking-wider">
                      Space Complexity
                    </span>
                    <span className="font-mono font-bold text-purple-300">
                      {currentResult.space_complexity || 'O(1)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Explanation Card */}
              <div className="glass-panel rounded-3xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <span>Algorithmic Explanation</span>
                </h3>
                <div className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  <AIResponse content={currentResult.explanation} showActions={false} />
                </div>

                {/* Test Cases */}
                {currentResult.test_cases && currentResult.test_cases.length > 0 && (
                  <div className="pt-4 border-t border-white/5">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                      Test Cases & Verification
                    </span>
                    <div className="space-y-2">
                      {currentResult.test_cases.map((tc, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-slate-900/80 border border-white/5 text-xs font-mono"
                        >
                          <p className="text-slate-300">
                            <span className="text-slate-500">Input:</span> {tc.input}
                          </p>
                          <p className="text-emerald-300 mt-1">
                            <span className="text-slate-500">Output:</span> {tc.expected_output}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="glass-panel rounded-3xl p-12 text-center text-slate-400 flex flex-col items-center justify-center h-80">
              <Code2 className="w-12 h-12 text-slate-600 mb-3" />
              <p className="text-sm font-medium text-slate-300">No code generated yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Enter your problem specifications on the left and click Synthesize to view the code, explanation, and Big-O complexity.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
