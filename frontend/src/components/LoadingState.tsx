import React from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Brain } from 'lucide-react'

interface LoadingStateProps {
  message?: string
  subtitle?: string
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'AI is thinking & analyzing...',
  subtitle = 'Structuring response, verifying references, and formatting...',
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 my-6 glass-panel rounded-2xl text-center">
      <div className="relative mb-6">
        <motion.div
          animate={{
            scale: [1, 1.25, 1],
            rotate: [0, 180, 360],
            opacity: [0.5, 0.9, 0.5],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-400 blur-lg"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-xl bg-slate-900/90 border border-purple-500/50 flex items-center justify-center text-purple-400 shadow-lg">
            <Brain className="w-6 h-6 animate-pulse" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-2 text-slate-100 font-semibold text-base">
        <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
        <span>{message}</span>
      </div>
      <p className="text-xs text-slate-400 max-w-sm">{subtitle}</p>

      <div className="w-48 h-1.5 bg-slate-800 rounded-full mt-4 overflow-hidden">
        <motion.div
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="w-full h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full"
        />
      </div>
    </div>
  )
}
