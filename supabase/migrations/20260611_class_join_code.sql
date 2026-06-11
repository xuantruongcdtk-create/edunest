-- =============================================================================
-- Migration: Thêm join_code cho classes, cho phép phụ huynh tự đăng ký con
-- Chạy trong Supabase SQL Editor
-- =============================================================================

-- ── 1. Thêm cột join_code vào classes ────────────────────────────────────────
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS join_code text UNIQUE;

-- Sinh mã cho các lớp đã tồn tại (nếu có)
UPDATE public.classes
SET join_code = upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8))
WHERE join_code IS NULL;

-- Đặt NOT NULL sau khi đã populate
ALTER TABLE public.classes ALTER COLUMN join_code SET NOT NULL;

-- ── 2. RLS: Phụ huynh được INSERT vào class_memberships (con của họ) ─────────
-- Validate join_code xảy ra ở tầng API, RLS chỉ đảm bảo parent_id đúng
CREATE POLICY "cm: parent enroll own child"
  ON public.class_memberships FOR INSERT
  WITH CHECK (public.is_parent_of(child_id));

-- ── Verify ───────────────────────────────────────────────────────────────────
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'join_code';
-- SELECT policyname FROM pg_policies WHERE tablename = 'class_memberships';
