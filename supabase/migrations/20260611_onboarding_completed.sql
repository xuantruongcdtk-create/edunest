-- =============================================================================
-- Migration: Cờ onboarding_completed — chặn vào dashboard khi chưa hoàn tất onboarding
-- Chạy trong Supabase SQL Editor
-- =============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

-- Backfill: coi các tài khoản hiện có là đã hoàn tất,
-- TRỪ BGH/Admin chưa gắn trường (đó là trường hợp onboarding dở dang cần làm lại).
UPDATE public.profiles
SET onboarding_completed = true
WHERE NOT (role IN ('bgh', 'admin') AND school_id IS NULL);

-- Lưu ý: trigger handle_new_user không set cột này → tài khoản mới mặc định false
-- → buộc phải đi qua onboarding. Cờ được set true ở bước hoàn tất (onboarding/step-4).

-- ── Verify ───────────────────────────────────────────────────────────────────
-- SELECT email, role, school_id, onboarding_completed FROM public.profiles ORDER BY created_at DESC;
