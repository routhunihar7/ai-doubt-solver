import axios from 'axios'
import type {
  AuthResponse,
  User,
  ProfileData,
  Conversation,
  ConversationDetail,
  ChatResponse,
  QuizSession,
  QuizSubmitResult,
  CodeGeneration,
  NoteSummary,
  InterviewSession,
  InterviewFeedback,
  StudyPlan,
  AcademicDocument,
  DocumentAskResponse,
  HistoryListResponse,
} from '@/types'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor: inject stored JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ai_assistant_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor: handle 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('ai_assistant_token')
      localStorage.removeItem('ai_assistant_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Authentication API
export const authApi = {
  register: (data: { email: string; full_name: string; password: string; preferences?: any }) =>
    api.post<AuthResponse>('/auth/register', data).then((res) => res.data),

  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data).then((res) => res.data),

  getMe: () => api.get<User>('/auth/me').then((res) => res.data),

  logout: () => api.post('/auth/logout').then((res) => res.data),
}

// Chat API
export const chatApi = {
  sendMessage: (data: { message: string; conversation_id?: string; subject?: string }) =>
    api.post<ChatResponse>('/chat', data).then((res) => res.data),

  getConversations: () =>
    api.get<Conversation[]>('/chat/conversations').then((res) => res.data),

  getConversation: (conversationId: string) =>
    api.get<ConversationDetail>(`/chat/${conversationId}`).then((res) => res.data),

  deleteConversation: (conversationId: string) =>
    api.delete(`/chat/${conversationId}`).then((res) => res.data),
}

// Quiz API
export const quizApi = {
  generate: (data: { topic: string; subject?: string; difficulty: string; num_questions: number }) =>
    api.post<QuizSession>('/quiz/generate', data).then((res) => res.data),

  submit: (quizId: string, answers: Array<{ question_id: string; selected_option: string }>) =>
    api.post<QuizSubmitResult>(`/quiz/${quizId}/submit`, { answers }).then((res) => res.data),

  list: () => api.get<QuizSession[]>('/quiz').then((res) => res.data),

  get: (quizId: string) => api.get<QuizSession>(`/quiz/${quizId}`).then((res) => res.data),

  delete: (quizId: string) => api.delete(`/quiz/${quizId}`).then((res) => res.data),
}

// Code API
export const codeApi = {
  generate: (data: { problem_description: string; language: string; difficulty?: string }) =>
    api.post<CodeGeneration>('/code/generate', data).then((res) => res.data),

  list: () => api.get<CodeGeneration[]>('/code').then((res) => res.data),

  get: (codeId: string) => api.get<CodeGeneration>(`/code/${codeId}`).then((res) => res.data),

  delete: (codeId: string) => api.delete(`/code/${codeId}`).then((res) => res.data),
}

// Notes API
export const notesApi = {
  summarize: (data: { content: string; title?: string; format_style?: string }) =>
    api.post<NoteSummary>('/notes/summarize', data).then((res) => res.data),

  list: () => api.get<NoteSummary[]>('/notes').then((res) => res.data),

  get: (noteId: string) => api.get<NoteSummary>(`/notes/${noteId}`).then((res) => res.data),

  delete: (noteId: string) => api.delete(`/notes/${noteId}`).then((res) => res.data),
}

// Interview API
export const interviewApi = {
  generate: (data: { topic: string; difficulty: string; target_role?: string; num_questions: number }) =>
    api.post<InterviewSession>('/interview/generate', data).then((res) => res.data),

  submitAnswer: (sessionId: string, data: { question_id: string; user_answer: string }) =>
    api.post<InterviewFeedback>(`/interview/${sessionId}/answer`, data).then((res) => res.data),

  list: () => api.get<InterviewSession[]>('/interview').then((res) => res.data),

  get: (sessionId: string) => api.get<InterviewSession>(`/interview/${sessionId}`).then((res) => res.data),

  delete: (sessionId: string) => api.delete(`/interview/${sessionId}`).then((res) => res.data),
}

// Planner API
export const plannerApi = {
  generate: (data: {
    subjects: string[]
    exam_date: string
    available_hours_per_day: number
    current_level: string
    target_score?: string
  }) => api.post<StudyPlan>('/planner/generate', data).then((res) => res.data),

  list: () => api.get<StudyPlan[]>('/planner').then((res) => res.data),

  get: (planId: string) => api.get<StudyPlan>(`/planner/${planId}`).then((res) => res.data),

  delete: (planId: string) => api.delete(`/planner/${planId}`).then((res) => res.data),
}

// Documents / RAG API
export const documentsApi = {
  upload: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api
      .post<AcademicDocument>('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((res) => res.data)
  },

  list: () => api.get<AcademicDocument[]>('/documents').then((res) => res.data),

  get: (documentId: string) =>
    api.get<AcademicDocument>(`/documents/${documentId}`).then((res) => res.data),

  ask: (documentId: string, question: string, max_chunks: number = 4) =>
    api
      .post<DocumentAskResponse>(`/documents/${documentId}/ask`, { question, max_chunks })
      .then((res) => res.data),

  delete: (documentId: string) => api.delete(`/documents/${documentId}`).then((res) => res.data),
}

// History API
export const historyApi = {
  get: (params?: { type?: string; search?: string; skip?: number; limit?: number }) =>
    api.get<HistoryListResponse>('/history', { params }).then((res) => res.data),

  deleteItem: (itemId: string) => api.delete(`/history/${itemId}`).then((res) => res.data),
}

// Profile API
export const profileApi = {
  get: () => api.get<ProfileData>('/profile').then((res) => res.data),

  update: (data: {
    full_name?: string
    target_exam?: string
    study_hours_target?: number
    favorite_subjects?: string[]
    theme?: string
  }) => api.put<ProfileData>('/profile', data).then((res) => res.data),

  changePassword: (data: { current_password: string; new_password: string }) =>
    api.post('/profile/change-password', data).then((res) => res.data),
}
