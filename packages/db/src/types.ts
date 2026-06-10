/**
 * Auto-generated Supabase Database type.
 * Regenerate with: npx supabase gen types typescript --project-id <id> > packages/db/src/types.ts
 *
 * Placeholder until the Supabase project is provisioned.
 */
export type Database = {
  public: {
    Tables: {
      profiles:             { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }
      children:             { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }
      score_records:        { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }
      quizzes:              { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }
      quiz_questions:       { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }
      quiz_attempts:        { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }
      coach_conversations:  { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }
      payment_transactions: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }
      schools:              { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }
      referrals:            { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }
      alerts:               { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }
      notifications:        { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }
      audit_logs:           { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }
      weekly_summaries:     { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }
    }
    Views:   Record<string, never>
    Functions: Record<string, never>
    Enums:   Record<string, never>
  }
}
