-- =============================================================================
-- Migration: Cho phép BGH/Admin tạo trường học (INSERT)
-- Chạy trong Supabase SQL Editor
-- =============================================================================
-- Bảng schools đang thiếu INSERT policy → không ai tạo được trường từ client.
-- Thêm policy cho user có role 'bgh'/'admin' (kiểm tra qua profiles.role,
-- không phụ thuộc school ownership vì trường chưa tồn tại lúc tạo).
-- =============================================================================

CREATE POLICY "schools: bgh/admin insert"
  ON public.schools FOR INSERT
  WITH CHECK (public.get_my_role() IN ('bgh', 'admin'));

-- ── Verify ───────────────────────────────────────────────────────────────────
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'schools' ORDER BY policyname;
