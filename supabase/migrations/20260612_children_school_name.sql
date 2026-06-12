-- =============================================================================
-- Fix: trang "Hồ sơ con" SELECT cột children.school_name nhưng cột này không tồn tại
-- (bảng children chỉ có school_id FK) → PostgREST trả 400 → danh sách con rỗng.
-- Thêm cột school_name (text tự do) để khớp với UI nhập/sửa hồ sơ con.
-- Chạy trong Supabase SQL Editor
-- =============================================================================

ALTER TABLE public.children
  ADD COLUMN IF NOT EXISTS school_name text;

-- ── Verify ───────────────────────────────────────────────────────────────────
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'children' AND column_name = 'school_name';
