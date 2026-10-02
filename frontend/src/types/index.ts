export interface User {
  id: string
  email: string
  full_name: string
  is_active: boolean
  is_superuser: boolean
  preferences: {
    target_exam?: string
    study_hours_target?: number
    favorite_subjects?: string[]
    theme?: string
    [key: string]: any
  }
  created_at: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

export interface UserStats {
  total_questions_asked: number
  total_quizzes_completed: number
  average_quiz_score: number
  total_code_generations: number
  total_notes_summarized: number
  total_interviews_taken: number
  total_documents_uploaded: number
  total_study_plans: number
}

export interface ProfileData extends User {
  stats: UserStats
}

// Chat
export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  metadata_info?: Record<string, any>
  created_at: string
}

export interface Conversation {
  id: string
  user_id: string
  title: string
  subject?: string
  created_at: string
  updated_at: string
}

export interface ConversationDetail extends Conversation {
  messages: Message[]
}

export interface ChatResponse {
  answer: string
  conversation_id: string
  message_id: string
  created_at: string
}

// Quiz
export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correct_answer?: string
  explanation?: string
  user_answer?: string
  is_correct?: boolean
}

export interface QuizSession {
  id: string
  topic: string
  subject?: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  total_questions: number
  score?: number
  completed_at?: string
  created_at: string
  questions: QuizQuestion[]
}

export interface QuizSubmitResult {
  quiz_id: string
  topic: string
  score: number
  total_questions: number
  correct_count: number
  percentage: number
  questions: QuizQuestion[]
}

// Code
export interface TestCase {
  input: string
  expected_output: string
  explanation?: string
}

export interface CodeGeneration {
  id?: string
  title: string
  language: string
  problem_description: string
  difficulty: string
  generated_code: string
  explanation: string
  time_complexity?: string
  space_complexity?: string
  example_input?: string
  example_output?: string
  test_cases: TestCase[]
  created_at?: string
}

// Notes
export interface ImportantConcept {
  concept: string
  definition: string
}

export interface NoteSummary {
  id?: string
  title: string
  source_type: string
  original_content?: string
  summary: string
  key_points: string[]
  important_concepts: ImportantConcept[]
  keywords: string[]
  quick_revision_notes?: string
  created_at?: string
}

// Interview
export interface InterviewQuestion {
  id?: string
  question: string
  user_answer?: string
  feedback?: string
  score?: number
  ideal_answer?: string
  follow_up_question?: string
}

export interface InterviewSession {
  id: string
  topic: string
  difficulty: string
  target_role?: string
  overall_score?: number
  feedback_summary?: string
  completed_at?: string
  created_at: string
  questions: InterviewQuestion[]
}

export interface InterviewFeedback {
  question_id: string
  score: number
  feedback: string
  ideal_answer: string
  follow_up_question?: string
}

// Planner
export interface DayTaskPlan {
  focus_subject: string
  hours: number
  tasks: string[]
}

export interface StudyPlan {
  id?: string
  title: string
  subjects: string[]
  exam_date: string
  available_hours_per_day: number
  current_level: string
  target_score?: string
  schedule: Record<string, DayTaskPlan>
  milestones: Array<{ week: number; title: string; target: string }>
  tips: string[]
  created_at?: string
}

// Document / RAG
export interface DocumentChunk {
  id: string
  chunk_index: number
  page_number: number
  content: string
  metadata_info?: Record<string, any>
}

export interface AcademicDocument {
  id: string
  filename: string
  file_size_bytes: number
  page_count: number
  summary?: string
  status: string
  created_at: string
  chunks?: DocumentChunk[]
}

export interface DocumentSourceChunk {
  chunk_index: number
  page_number: number
  snippet: string
  similarity_score?: number
}

export interface DocumentAskResponse {
  question: string
  answer: string
  document_id: string
  document_name: string
  sources: DocumentSourceChunk[]
}

// History
export interface HistoryItem {
  id: string
  activity_type: 'chat' | 'quiz' | 'code' | 'notes' | 'interview' | 'planner' | 'document'
  title: string
  description?: string
  reference_id?: string
  metadata_info?: Record<string, any>
  created_at: string
}

export interface HistoryListResponse {
  total: number
  items: HistoryItem[]
}
