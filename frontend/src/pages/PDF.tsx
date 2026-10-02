import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { documentsApi } from '@/services/api'
import { LoadingState } from '@/components/LoadingState'
import { AIResponse } from '@/components/AIResponse'
import { useToast } from '@/contexts/ToastContext'
import type { AcademicDocument, DocumentAskResponse } from '@/types'
import {
  FileSearch,
  UploadCloud,
  FileText,
  Sparkles,
  Send,
  BookOpen,
  Trash2,
  HelpCircle,
  Layers,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { formatDate } from '@/lib/utils'

export const PDF: React.FC = () => {
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
  const [question, setQuestion] = useState('')
  const [qaHistory, setQaHistory] = useState<DocumentAskResponse[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const queryClient = useQueryClient()
  const { error: toastError, success: toastSuccess } = useToast()

  // Fetch user documents
  const { data: documents = [], isLoading: loadingDocs } = useQuery({
    queryKey: ['documents'],
    queryFn: documentsApi.list,
  })

  // Upload Mutation
  const uploadMutation = useMutation({
    mutationFn: (file: File) => documentsApi.upload(file),
    onSuccess: (newDoc) => {
      setSelectedDocId(newDoc.id)
      setQaHistory([])
      toastSuccess(`Document "${newDoc.filename}" uploaded and indexed!`)
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || err.response?.data?.error || err.message || 'Upload failed.'
      toastError(typeof msg === 'string' ? msg : 'Error processing PDF.')
    },
  })

  // Ask Question Mutation (Vector RAG)
  const askMutation = useMutation({
    mutationFn: (q: string) => {
      if (!selectedDocId) throw new Error('No document selected')
      return documentsApi.ask(selectedDocId, q, 4)
    },
    onSuccess: (response) => {
      setQaHistory((prev) => [response, ...prev])
      setQuestion('')
      toastSuccess('Answer generated from document context!')
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || err.response?.data?.error || err.message || 'Failed to query PDF.'
      toastError(typeof msg === 'string' ? msg : 'Error retrieving answer.')
    },
  })

  const handleFileUpload = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toastError('Please upload a valid PDF document.')
      return
    }
    if (file.size > 15 * 1024 * 1024) {
      toastError('File exceeds 15MB limit.')
      return
    }
    uploadMutation.mutate(file)
  }

  const handleDelete = async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await documentsApi.delete(docId)
      toastSuccess('Document deleted')
      if (selectedDocId === docId) {
        setSelectedDocId(null)
        setQaHistory([])
      }
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    } catch {
      toastError('Could not delete document.')
    }
  }

  const selectedDoc = documents.find((d) => d.id === selectedDocId)

  return (
    <div className="space-y-8 max-w-6xl mx-auto relative">
      <div className="ambient-glow bg-cyan-600/20 w-[450px] h-[450px] top-0 left-10" />
      <div className="ambient-glow bg-indigo-600/20 w-[450px] h-[450px] bottom-10 right-10" />

      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-xl shadow-cyan-500/20">
            <FileSearch className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white">
              PDF Assistant & Vector RAG Doubt Solver
            </h1>
            <p className="text-xs text-slate-400">
              Upload textbook chapters or lecture slides. Ask doubts grounded directly in your PDF with page citations.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        {/* Left Column: Upload Dropzone & Document List */}
        <div className="lg:col-span-5 space-y-6">
          {/* Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setIsDragging(false)
              if (e.dataTransfer.files?.[0]) {
                handleFileUpload(e.dataTransfer.files[0])
              }
            }}
            className={`glass-panel rounded-3xl p-8 text-center border-2 border-dashed transition cursor-pointer ${
              isDragging
                ? 'border-cyan-400 bg-cyan-950/30'
                : 'border-white/10 hover:border-cyan-500/40 hover:bg-slate-900/60'
            }`}
          >
            <input
              type="file"
              id="pdf-upload"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleFileUpload(e.target.files[0])
                }
              }}
            />
            <label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3 shadow-lg shadow-cyan-500/10">
                <UploadCloud className="w-7 h-7 animate-bounce" />
              </div>
              <span className="text-sm font-bold text-white block mb-1">
                Upload Academic PDF
              </span>
              <p className="text-xs text-slate-400 max-w-xs">
                Drag & drop or click to upload textbooks, research papers, or syllabus PDFs (Max 15MB)
              </p>
            </label>
          </div>

          {/* Document list */}
          <div className="glass-panel rounded-3xl p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>Your Uploaded Documents</span>
            </h3>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {documents.map((doc) => {
                const isSelected = doc.id === selectedDocId
                return (
                  <div
                    key={doc.id}
                    onClick={() => {
                      setSelectedDocId(doc.id)
                      setQaHistory([])
                    }}
                    className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer text-xs transition border ${
                      isSelected
                        ? 'bg-cyan-950/50 border-cyan-500/50 text-cyan-200'
                        : 'bg-slate-900/60 border-white/5 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate pr-2">
                      <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                      <div className="truncate">
                        <p className="font-semibold truncate">{doc.filename}</p>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {doc.page_count} Pages • {(doc.file_size_bytes / (1024 * 1024)).toFixed(1)} MB
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleDelete(doc.id, e)}
                      className="p-1 hover:text-rose-400 rounded transition shrink-0"
                      title="Delete document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              })}

              {documents.length === 0 && !loadingDocs && (
                <p className="text-xs text-slate-400 text-center py-6">
                  No documents uploaded yet. Upload a PDF above to start.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Q&A & Document Summary Area */}
        <div className="lg:col-span-7 space-y-6">
          {uploadMutation.isPending ? (
            <LoadingState
              message="Processing & indexing PDF document..."
              subtitle="Extracting text layers with PyMuPDF, generating recursive vector embeddings, and creating summary."
            />
          ) : selectedDoc ? (
            <div className="space-y-6">
              {/* Document Overview & Summary Card */}
              <div className="glass-panel rounded-3xl p-6 space-y-3 border border-cyan-500/30 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
                    <h2 className="text-base font-bold text-white">{selectedDoc.filename}</h2>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Indexed in Vector DB</span>
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 text-xs text-slate-300 leading-relaxed">
                  <strong className="text-cyan-300 block mb-1">Document Summary:</strong>
                  <p>{selectedDoc.summary || 'Summary generating...'}</p>
                </div>
              </div>

              {/* Doubt Input */}
              <div className="glass-panel rounded-3xl p-6 space-y-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Ask a Question about this PDF</span>
                </h3>

                <div className="relative">
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && question.trim()) {
                        askMutation.mutate(question.trim())
                      }
                    }}
                    placeholder={`e.g. "What are the main deadlock conditions mentioned on page 4?"`}
                    className="w-full glass-input rounded-2xl pl-4 pr-12 py-3 text-xs sm:text-sm"
                  />
                  <button
                    onClick={() => {
                      if (question.trim()) {
                        askMutation.mutate(question.trim())
                      }
                    }}
                    disabled={!question.trim() || askMutation.isPending}
                    className="absolute right-2.5 top-2.5 p-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white disabled:opacity-30 shadow-md shadow-cyan-600/30 transition"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Loading Question Answer */}
              {askMutation.isPending && (
                <LoadingState
                  message="Searching relevant chunks in vector storage..."
                  subtitle="Calculating cosine similarity and grounding response with cited pages."
                />
              )}

              {/* Q&A Stream */}
              <div className="space-y-4">
                {qaHistory.map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel rounded-3xl p-6 space-y-4 border border-white/10"
                  >
                    <div className="flex items-start gap-2.5 text-xs sm:text-sm font-semibold text-cyan-300">
                      <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{item.question}</span>
                    </div>

                    <div className="text-xs sm:text-sm text-slate-200 leading-relaxed border-t border-white/5 pt-3">
                      <AIResponse content={item.answer} showActions={false} />
                    </div>

                    {/* Cited Sources */}
                    {item.sources && item.sources.length > 0 && (
                      <div className="pt-3 border-t border-white/5 space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Retrieved Excerpts & Page Citations:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {item.sources.map((src, sIdx) => (
                            <div
                              key={sIdx}
                              className="p-2.5 rounded-xl bg-slate-900/80 border border-white/5 text-[11px] text-slate-300 space-y-1"
                            >
                              <div className="flex items-center justify-between text-cyan-400 font-mono text-[10px]">
                                <span>Page {src.page_number}</span>
                                {src.similarity_score && (
                                  <span>Score: {src.similarity_score}</span>
                                )}
                              </div>
                              <p className="text-slate-400 italic line-clamp-2">"{src.snippet}"</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <div className="glass-panel rounded-3xl p-12 text-center text-slate-400 flex flex-col items-center justify-center h-80">
              <FileSearch className="w-12 h-12 text-slate-600 mb-3" />
              <p className="text-sm font-medium text-slate-300">No document selected</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Upload a PDF or select an existing document from the list to start asking doubts with vector grounded context.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
