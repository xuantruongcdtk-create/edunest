-- =============================================================================
-- Migration: Câu hỏi tự luận (essay) — trộn chung với trắc nghiệm trong 1 bài
-- AI (Gemini) tự chấm câu tự luận theo đáp án mẫu
-- Chạy trong Supabase SQL Editor
-- =============================================================================

-- ── quiz_questions: thêm loại câu hỏi + đáp án mẫu cho tự luận ────────────────
ALTER TABLE public.quiz_questions
  ADD COLUMN IF NOT EXISTS question_type text NOT NULL DEFAULT 'mcq';   -- 'mcq' | 'essay'
ALTER TABLE public.quiz_questions
  ADD COLUMN IF NOT EXISTS sample_answer text;                          -- đáp án mẫu cho tự luận

-- Câu tự luận không có đáp án đúng dạng index → cho phép correct_index NULL
ALTER TABLE public.quiz_questions ALTER COLUMN correct_index DROP NOT NULL;
-- (CHECK correct_index >= 0 vẫn giữ — NULL không vi phạm CHECK)

-- ── quiz_attempts: lưu chi tiết chấm từng câu (điểm + nhận xét tự luận) ────────
ALTER TABLE public.quiz_attempts
  ADD COLUMN IF NOT EXISTS details jsonb NOT NULL DEFAULT '[]';

-- ── Verify ───────────────────────────────────────────────────────────────────
-- SELECT column_name, is_nullable FROM information_schema.columns
-- WHERE table_name = 'quiz_questions' AND column_name IN ('question_type','sample_answer','correct_index');
