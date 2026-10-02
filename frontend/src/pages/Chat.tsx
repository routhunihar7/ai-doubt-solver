import React, { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { chatApi } from '@/services/api'
import { AIResponse } from '@/components/AIResponse'
import { LoadingState } from '@/components/LoadingState'
import { ErrorState } from '@/components/ErrorState'
import { useToast } from '@/contexts/ToastContext'
import type { Message, Conversation } from '@/types'
import {
  Send,
  Sparkles,
  Plus,
  Trash2,
  BookOpen,
  User as UserIcon,
  Bot,
  Layers,
  HelpCircle,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { formatDate } from '@/lib/utils'

const SUBJECTS = [
  'General Academics',
  'Computer Science',
  'Mathematics',
  'Data Structures & Algorithms',
  'Operating Systems',
  'Database Management (DBMS)',
  'Physics',
  'Electrical Engineering',
]

const SAMPLE_QUESTIONS = [
  'Explain Dijkstra’s shortest path algorithm with time complexity',
  'How does virtual memory and page faulting work in OS?',
  'Derive the quadratic formula and explain the discriminant',
  'Compare SQL vs NoSQL with real-world architectural tradeoffs',
]

export const Chat: React.FC = () => {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [inputMessage, setInputMessage] = useState('')
  const [subject, setSubject] = useState('Computer Science')
  const [messages, setMessages] = useState<Message[]>([])
  
  const queryClient = useQueryClient()
  const { error: toastError, success: toastSuccess } = useToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch previous conversations
  const { data: conversations = [], isLoading: loadingConvs } = useQuery({
    queryKey: ['conversations'],
    queryFn: chatApi.getConversations,
  })

  // Fetch active conversation messages when selected
  const {
    data: activeConvDetail,
    isLoading: loadingMessages,
  } = useQuery({
    queryKey: ['conversation', selectedConversationId],
    queryFn: () => (selectedConversationId ? chatApi.getConversation(selectedConversationId) : null),
    enabled: !!selectedConversationId,
  })

  useEffect(() => {
    if (activeConvDetail?.messages) {
      setMessages(activeConvDetail.messages)
    } else if (!selectedConversationId) {
      setMessages([])
    }
  }, [activeConvDetail, selectedConversationId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Mutation for sending doubt
  const sendMutation = useMutation({
    mutationFn: (msg: string) =>
      chatApi.sendMessage({
        message: msg,
        conversation_id: selectedConversationId || undefined,
        subject,
      }),
    onMutate: async (msg) => {
      // Optimistic user message update
      const tempUserMsg: Message = {
        id: `temp-${Date.now()}`,
        conversation_id: selectedConversationId || 'new',
        role: 'user',
        content: msg,
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, tempUserMsg])
    },
    onSuccess: (data) => {
      const assistantMsg: Message = {
        id: data.message_id,
        conversation_id: data.conversation_id,
        role: 'assistant',
        content: data.answer,
        created_at: data.created_at,
      }
      setMessages((prev) => [...prev, assistantMsg])
      if (!selectedConversationId) {
        setSelectedConversationId(data.conversation_id)
      }
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.message || 'Failed to send doubt.'
      toastError(typeof msg === 'string' ? msg : 'Error generating response.')
    },
  })

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = inputMessage.trim()
    if (!trimmed || sendMutation.isPending) return

    setInputMessage('')
    sendMutation.mutate(trimmed)
  }

  const handleStartNewChat = () => {
    setSelectedConversationId(null)
    setMessages([])
  }

  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await chatApi.deleteConversation(convId)
      toastSuccess('Conversation removed')
      if (selectedConversationId === convId) {
        handleStartNewChat()
      }
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    } catch {
      toastError('Could not delete conversation')
    }
  }

  const handleRegenerate = () => {
    if (messages.length === 0) return
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')
    if (lastUserMsg) {
      sendMutation.mutate(lastUserMsg.content)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8.5rem)] relative">
      {/* Sidebar Conversation List */}
      <div className="w-full lg:w-72 glass-panel rounded-2xl p-4 flex flex-col justify-between shrink-0 h-48 lg:h-full">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Discussions
            </h2>
            <button
              onClick={handleStartNewChat}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-xs font-semibold transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Chat</span>
            </button>
          </div>

          {/* Subject Context Selector */}
          <div className="mb-3">
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Subject Focus
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full glass-input rounded-xl px-2.5 py-1.5 text-xs bg-slate-900 border-white/10"
            >
              {SUBJECTS.map((s) => (
                <option key={s} value={s} className="bg-slate-900 text-white">
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-21rem)] pr-1">
            {conversations.map((conv) => {
              const isSelected = conv.id === selectedConversationId
              return (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConversationId(conv.id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl text-xs cursor-pointer group transition ${
                    isSelected
                      ? 'bg-purple-600/20 text-purple-200 border border-purple-500/40'
                      : 'text-slate-300 hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <div className="truncate pr-2">
                    <p className="font-medium truncate">{conv.title}</p>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formatDate(conv.created_at)}
                    </span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteConversation(conv.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 rounded transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })}

            {conversations.length === 0 && !loadingConvs && (
              <p className="text-center text-xs text-slate-400 py-6">
                No previous discussions.
              </p>
            )}
          </div>
        </div>

        <div className="hidden lg:block pt-3 border-t border-white/5 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <Sparkles className="w-3 h-3" />
            <span>AI Academic Tutor Active</span>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 glass-panel rounded-2xl flex flex-col justify-between overflow-hidden shadow-2xl">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {messages.length === 0 && !sendMutation.isPending && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto py-12">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 flex items-center justify-center text-white shadow-xl shadow-purple-600/30 mb-4">
                <Sparkles className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                Ask Any Academic Doubt
              </h2>
              <p className="text-xs md:text-sm text-slate-300 mb-6 leading-relaxed">
                Receive clear step-by-step breakdowns, LaTeX mathematical proofs, code examples with complexity analysis, and intuitive analogies.
              </p>

              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                {SAMPLE_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      setInputMessage(q)
                    }}
                    className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-white/5 hover:border-purple-500/30 text-xs text-slate-300 transition text-left"
                  >
                    "{q}"
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, index) => {
            const isUser = msg.role === 'user'
            return (
              <motion.div
                key={msg.id || index}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 md:gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-purple-600/20">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] md:max-w-[80%] rounded-2xl p-4 text-sm ${
                    isUser
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-tr-sm shadow-lg shadow-purple-600/20'
                      : 'glass-card border-white/10 rounded-tl-sm text-slate-100'
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <AIResponse
                      content={msg.content}
                      onRegenerate={index === messages.length - 1 ? handleRegenerate : undefined}
                    />
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center text-slate-300 shrink-0">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
              </motion.div>
            )
          })}

          {sendMutation.isPending && (
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-white shrink-0 animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex-1 max-w-[80%]">
                <LoadingState
                  message="Synthesizing academic answer..."
                  subtitle="Formulating step-by-step conceptual explanation and verifying math/code."
                />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div className="p-4 bg-slate-950/60 border-t border-white/5 backdrop-blur-md">
          <form onSubmit={handleSend} className="relative flex items-center gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={`Ask a doubt in ${subject}... (e.g. "Explain AVL rotation")`}
              disabled={sendMutation.isPending}
              className="w-full glass-input rounded-xl pl-4 pr-12 py-3 text-sm"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || sendMutation.isPending}
              className="absolute right-2 p-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white disabled:opacity-30 transition shadow-md shadow-purple-600/30"
              title="Send Doubt"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
