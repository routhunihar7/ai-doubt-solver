import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/AuthContext'
import { ToastProvider } from '@/contexts/ToastContext'
import { Layout } from '@/components/Layout'
import { ProtectedRoute } from '@/routes/ProtectedRoute'

import { Login } from '@/pages/Login'
import { Register } from '@/pages/Register'
import { Dashboard } from '@/pages/Dashboard'
import { Chat } from '@/pages/Chat'
import { Quiz } from '@/pages/Quiz'
import { Code } from '@/pages/Code'
import { Notes } from '@/pages/Notes'
import { Interview } from '@/pages/Interview'
import { Planner } from '@/pages/Planner'
import { PDF } from '@/pages/PDF'
import { History } from '@/pages/History'
import { Profile } from '@/pages/Profile'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Routes enclosed in Layout */}
              <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/quiz" element={<Quiz />} />
                  <Route path="/code" element={<Code />} />
                  <Route path="/notes" element={<Notes />} />
                  <Route path="/interview" element={<Interview />} />
                  <Route path="/planner" element={<Planner />} />
                  <Route path="/pdf" element={<PDF />} />
                  <Route path="/history" element={<History />} />
                  <Route path="/profile" element={<Profile />} />
                </Route>
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
