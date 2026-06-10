// ─── User & Auth ──────────────────────────────────────────────────────────────
export type UserRole   = 'parent' | 'teacher' | 'bgh' | 'admin'
export type PlanTier   = 'free' | 'basic' | 'pro' | 'school'
export type PlanStatus = 'active' | 'expired' | 'trial' | 'cancelled'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  avatar_url?: string
  phone?: string
  school_id?: string
  plan_tier: PlanTier
  plan_status: PlanStatus
  plan_expires_at?: string
  referral_code: string
  referred_by?: string
  created_at: string
  updated_at: string
}

// ─── Child / Student ──────────────────────────────────────────────────────────
export type GradeLevel = 1|2|3|4|5|6|7|8|9|10|11|12

export interface Child {
  id: string
  parent_id: string
  full_name: string
  grade: GradeLevel
  school_id?: string
  avatar_url?: string
  created_at: string
}

// ─── Scores ───────────────────────────────────────────────────────────────────
export type Subject =
  | 'math' | 'literature' | 'english' | 'physics'
  | 'chemistry' | 'biology' | 'history' | 'geography'
  | 'civics' | 'informatics'

export type PeriodType     = 'weekly' | 'monthly' | 'semester'
export type SemesterNumber = 1 | 2

export interface ScoreRecord {
  id: string
  child_id: string
  subject: Subject
  score: number
  max_score: number
  period_type: PeriodType
  semester: SemesterNumber
  academic_year: string
  exam_date: string
  source: 'manual' | 'ocr'
  pdf_url?: string
  created_at: string
}

// ─── Quiz ─────────────────────────────────────────────────────────────────────
export type QuizDifficulty = 'easy' | 'medium' | 'hard'
export type QuizStatus     = 'draft' | 'published' | 'archived'

export interface Quiz {
  id: string
  teacher_id: string
  title: string
  subject: Subject
  grade: GradeLevel
  difficulty: QuizDifficulty
  status: QuizStatus
  question_count: number
  time_limit_minutes: number
  due_date?: string
  class_id?: string
  created_at: string
}

export interface QuizQuestion {
  id: string
  quiz_id: string
  question_text: string
  options: string[]
  correct_index: number
  explanation?: string
  order_index: number
}

export interface QuizAttempt {
  id: string
  quiz_id: string
  student_id: string
  answers: number[]
  score: number
  max_score: number
  time_taken_seconds: number
  completed_at: string
}

// ─── AI Coach ─────────────────────────────────────────────────────────────────
export interface CoachMessage {
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface CoachConversation {
  id: string
  user_id: string
  child_id?: string
  messages: CoachMessage[]
  updated_at: string
}

// ─── Payments ─────────────────────────────────────────────────────────────────
export type PaymentProvider = 'momo' | 'vnpay' | 'payos'
export type PaymentStatus   = 'pending' | 'success' | 'failed' | 'refunded'

export interface PaymentTransaction {
  id: string
  user_id: string
  provider: PaymentProvider
  provider_tx_id: string
  amount_vnd: number
  plan_tier: PlanTier
  status: PaymentStatus
  metadata?: Record<string, unknown>
  created_at: string
}

// ─── Schools ──────────────────────────────────────────────────────────────────
export interface School {
  id: string
  name: string
  address?: string
  district?: string
  province: string
  plan_tier: PlanTier
  plan_expires_at?: string
  created_at: string
}

// ─── Alerts ───────────────────────────────────────────────────────────────────
export type AlertSeverity = 'info' | 'warning' | 'danger'
export type AlertType =
  | 'score_drop' | 'missed_quiz' | 'burnout_risk'
  | 'improvement' | 'goal_reached'

export interface Alert {
  id: string
  user_id: string
  child_id?: string
  type: AlertType
  severity: AlertSeverity
  title: string
  body: string
  is_read: boolean
  created_at: string
}

// ─── Learning DNA ─────────────────────────────────────────────────────────────
export type LearningStyle = 'visual' | 'auditory' | 'reading' | 'kinesthetic'
export type BurnoutRisk   = 'low' | 'medium' | 'high'

export interface LearningDNA {
  child_id: string
  dominant_style: LearningStyle
  burnout_risk: BurnoutRisk
  strengths: Subject[]
  weaknesses: Subject[]
  consistency_score: number  // 0–100
  improvement_rate: number   // % delta vs previous period
  computed_at: string
}

// ─── Analytics ────────────────────────────────────────────────────────────────
export interface SubjectScore {
  subject: Subject
  average: number
  trend: number          // positive = improving
  attempt_count: number
}

export interface WeeklySummary {
  id: string
  child_id: string
  week_start: string
  subject_scores: SubjectScore[]
  quiz_completion_rate: number
  study_time_minutes: number
  learning_dna: LearningDNA
  ai_insight?: string
  created_at: string
}

// ─── BGH KPI ──────────────────────────────────────────────────────────────────
export interface ClassKPI {
  class_id: string
  class_name: string
  teacher_name: string
  student_count: number
  avg_score: number
  quiz_completion_rate: number
  alert_count: number
  rank: number
}

export interface SchoolKPI {
  school_id: string
  total_students: number
  total_teachers: number
  avg_score: number
  quiz_completion_rate: number
  active_alerts: number
  classes: ClassKPI[]
}

// ─── Referral ─────────────────────────────────────────────────────────────────
export interface Referral {
  id: string
  referrer_id: string
  referred_id: string
  status: 'pending' | 'converted'
  reward_granted: boolean
  created_at: string
}

// ─── API response envelope ────────────────────────────────────────────────────
export interface PaginationMeta {
  page: number
  per_page: number
  total: number
  total_pages: number
}

export interface ApiOk<T> {
  ok: true
  data: T
  meta?: PaginationMeta
}

export interface ApiErr {
  ok: false
  error: { code: string; message: string; details?: unknown }
}

export type ApiResult<T> = ApiOk<T> | ApiErr
