-- =============================================================================
-- Migration: Mã trường (schools.join_code) + BGH quản lý lớp trong trường
-- Cho phép giáo viên tham gia trường bằng mã, và BGH gán GV chủ nhiệm cho lớp
-- Chạy trong Supabase SQL Editor
-- =============================================================================

-- ── 1. Mã trường ─────────────────────────────────────────────────────────────
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS join_code text UNIQUE;

-- Sinh mã cho các trường đã có (6 ký tự, tránh ký tự dễ nhầm)
UPDATE public.schools
SET join_code = upper(translate(substring(replace(gen_random_uuid()::text, '-', ''), 1, 6), 'OIL01', 'PQRST'))
WHERE join_code IS NULL;

ALTER TABLE public.schools ALTER COLUMN join_code SET NOT NULL;

-- ── 2. RLS: BGH/Admin được quản lý (kể cả gán GV) các lớp trong trường mình ────
-- Policy "classes: teacher manage own" chỉ cho phép GV sửa lớp của chính họ
-- → BGH không đổi được teacher_id sang GV khác. Thêm policy theo trường.
CREATE POLICY "classes: bgh manage school"
  ON public.classes FOR ALL
  USING (
    school_id = public.get_my_school_id()
    AND public.get_my_role() IN ('bgh', 'admin')
  )
  WITH CHECK (
    school_id = public.get_my_school_id()
    AND public.get_my_role() IN ('bgh', 'admin')
  );

-- ── Verify ───────────────────────────────────────────────────────────────────
-- SELECT name, join_code FROM public.schools;
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'classes' ORDER BY policyname;
