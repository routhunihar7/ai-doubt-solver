import React, { createContext, useContext, useState, useEffect } from 'react'
import type { User } from '@/types'
import { authApi } from '@/services/api'

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (fullName: string, email: string, password: string, preferences?: any) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('ai_assistant_user')
    return saved ? JSON.parse(saved) : null
  })
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('ai_assistant_token')
  })
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('ai_assistant_token')
      if (storedToken) {
        try {
          const freshUser = await authApi.getMe()
          setUser(freshUser)
          localStorage.setItem('ai_assistant_user', JSON.stringify(freshUser))
        } catch (err) {
          console.error('Failed to verify token', err)
          localStorage.removeItem('ai_assistant_token')
          localStorage.removeItem('ai_assistant_user')
          setUser(null)
          setToken(null)
        }
      }
      setIsLoading(false)
    }

    initAuth()
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const res = await authApi.login({ email, password })
      localStorage.setItem('ai_assistant_token', res.access_token)
      localStorage.setItem('ai_assistant_user', JSON.stringify(res.user))
      setToken(res.access_token)
      setUser(res.user)
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (fullName: string, email: string, password: string, preferences?: any) => {
    setIsLoading(true)
    try {
      const res = await authApi.register({ full_name: fullName, email, password, preferences })
      localStorage.setItem('ai_assistant_token', res.access_token)
      localStorage.setItem('ai_assistant_user', JSON.stringify(res.user))
      setToken(res.access_token)
      setUser(res.user)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('ai_assistant_token')
    localStorage.removeItem('ai_assistant_user')
    setUser(null)
    setToken(null)
  }

  const refreshUser = async () => {
    try {
      const updated = await authApi.getMe()
      setUser(updated)
      localStorage.setItem('ai_assistant_user', JSON.stringify(updated))
    } catch (e) {
      console.error('Could not refresh user', e)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
