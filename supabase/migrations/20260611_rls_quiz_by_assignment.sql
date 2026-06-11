-- =============================================================================
-- Migration: Siết RLS quiz — chỉ phụ huynh có con trong lớp được giao mới xem
-- Chạy trong Supabase SQL Editor (Project → SQL Editor → New query)
-- =============================================================================

-- ── 1. Helper function ────────────────────────────────────────────────────────
-- Kiểm tra phụ huynh hiện tại có con được giao bài quiz p_quiz_id không
-- (qua chuỗi: quiz_assignments → class_memberships → children)
CREATE OR REPLACE FUNCTION public.parent_can_access_quiz(p_quiz_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM   public.quiz_assignments qa
    JOIN   public.class_memberships cm ON cm.class_id = qa.class_id
    JOIN   public.children          c  ON c.id        = cm.child_id
    WHERE  qa.quiz_id   = p_quiz_id
    AND    c.parent_id  = auth.uid()
  )
$$;

-- ── 2. quizzes — thay thế policy rộng ─────────────────────────────────────────

-- Xoá policy cũ cho phép mọi user đọc bài published
DROP POLICY IF EXISTS "quizzes: read published" ON public.quizzes;

-- Phụ huynh chỉ đọc được bài đã giao cho lớp có con họ
CREATE POLICY "quizzes: parent via assignment"
  ON public.quizzes FOR SELECT
  USING (
    status = 'published'
    AND public.parent_can_access_quiz(id)
  );

-- BGH xem được tất cả bài của giáo viên trong trường mình
CREATE POLICY "quizzes: bgh read school"
  ON public.quizzes FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM   public.profiles  p
      JOIN   public.profiles  tp ON tp.id = quizzes.teacher_id
      WHERE  p.id             = auth.uid()
      AND    p.role           = 'bgh'
      AND    p.school_id      IS NOT NULL
      AND    p.school_id      = tp.school_id
    )
  );

-- ── 3. quiz_questions — thay thế policy rộng ──────────────────────────────────

DROP POLICY IF EXISTS "qq: read published quiz" ON public.quiz_questions;

-- Phụ huynh đọc câu hỏi khi đã có quyền truy cập bài
CREATE POLICY "qq: parent via assignment"
  ON public.quiz_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes
      WHERE  id     = quiz_id
      AND    status = 'published'
    )
    AND public.parent_can_access_quiz(quiz_id)
  );

-- BGH đọc câu hỏi của bài trong trường mình
CREATE POLICY "qq: bgh read school"
  ON public.quiz_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM   public.quizzes   q
      JOIN   public.profiles  p  ON p.id  = auth.uid()
      JOIN   public.profiles  tp ON tp.id = q.teacher_id
      WHERE  q.id         = quiz_id
      AND    p.role        = 'bgh'
      AND    p.school_id   IS NOT NULL
      AND    p.school_id   = tp.school_id
    )
  );

-- ── 4. quiz_assignments — thêm policy đọc cho phụ huynh ──────────────────────

-- Phụ huynh xem được assignment của lớp có con họ
-- (dùng để hiển thị hạn nộp, tên lớp trong parent quiz page)
CREATE POLICY "qassign: parent read"
  ON public.quiz_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM   public.class_memberships cm
      JOIN   public.children          c ON c.id = cm.child_id
      WHERE  cm.class_id = quiz_assignments.class_id
      AND    c.parent_id = auth.uid()
    )
  );

-- ── Kiểm tra sau khi chạy ────────────────────────────────────────────────────
-- Chạy câu này để verify policies đã được tạo:
-- SELECT policyname, cmd, qual FROM pg_policies WHERE tablename IN ('quizzes','quiz_questions','quiz_assignments') ORDER BY tablename, policyname;
