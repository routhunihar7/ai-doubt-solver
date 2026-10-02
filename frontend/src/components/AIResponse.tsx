import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { Copy, Check, Terminal, Sparkles } from 'lucide-react'

interface AIResponseProps {
  content: string
  className?: string
  showActions?: boolean
  onRegenerate?: () => void
}

export const AIResponse: React.FC<AIResponseProps> = ({
  content,
  className = '',
  showActions = true,
  onRegenerate,
}) => {
  const [copiedAll, setCopiedAll] = useState(false)

  const handleCopyAll = () => {
    navigator.clipboard.writeText(content)
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 2000)
  }

  return (
    <div className={`relative group ${className}`}>
      {showActions && (
        <div className="absolute top-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-purple-300 bg-purple-950/70 hover:bg-purple-900 border border-purple-500/30 rounded-lg backdrop-blur-md transition"
              title="Regenerate response"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Regenerate</span>
            </button>
          )}
          <button
            onClick={handleCopyAll}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 rounded-lg backdrop-blur-md transition"
            title="Copy answer"
          >
            {copiedAll ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      )}

      <div className="prose prose-invert max-w-none text-slate-200 text-sm md:text-base leading-relaxed break-words">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={{
            code({ node, inline, className: codeClassName, children, ...props }: any) {
              const match = /language-(\w+)/.exec(codeClassName || '')
              const language = match ? match[1] : ''
              const codeString = String(children).replace(/\n$/, '')

              if (!inline && language) {
                return (
                  <CodeBlock language={language} code={codeString} />
                )
              }

              return (
                <code
                  className="px-1.5 py-0.5 rounded bg-slate-800/80 text-purple-300 font-mono text-xs border border-slate-700/50"
                  {...props}
                >
                  {children}
                </code>
              )
            },
            h1: ({ children }) => (
              <h1 className="text-xl md:text-2xl font-bold text-white mt-4 mb-2 pb-1 border-b border-slate-800">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-lg md:text-xl font-semibold text-purple-200 mt-3 mb-2">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-base font-semibold text-cyan-300 mt-3 mb-1">
                {children}
              </h3>
            ),
            p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
            ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
            li: ({ children }) => <li className="text-slate-300">{children}</li>,
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-purple-500 pl-4 py-1 italic bg-purple-950/20 rounded-r-lg my-3 text-slate-300">
                {children}
              </blockquote>
            ),
            table: ({ children }) => (
              <div className="overflow-x-auto my-4 rounded-lg border border-slate-800">
                <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
                  {children}
                </table>
              </div>
            ),
            thead: ({ children }) => <thead className="bg-slate-900/80">{children}</thead>,
            th: ({ children }) => (
              <th className="px-4 py-2 font-semibold text-purple-300">{children}</th>
            ),
            td: ({ children }) => (
              <td className="px-4 py-2 border-t border-slate-800/60 text-slate-300">{children}</td>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  )
}

const CodeBlock: React.FC<{ language: string; code: string }> = ({ language, code }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-slate-800/90 bg-slate-950/90 shadow-xl">
      <div className="flex items-center justify-between px-4 py-1.5 bg-slate-900/90 border-b border-slate-800 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-purple-400" />
          <span className="font-mono uppercase tracking-wider text-purple-300 font-semibold">
            {language}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-white px-2 py-0.5 rounded hover:bg-slate-800 transition"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-xs md:text-sm font-mono text-emerald-300 bg-slate-950/60">
        <code>{code}</code>
      </pre>
    </div>
  )
}
