-- =============================================================================
-- Fix: classes.student_count không tăng khi phụ huynh cho con vào lớp
-- Nguyên nhân: trigger sync_class_student_count chạy bằng quyền người insert
-- (phụ huynh) → RLS chặn UPDATE bảng classes → cột không tăng.
-- Khắc phục: SECURITY DEFINER để trigger bỏ qua RLS, + backfill số liệu cũ.
-- Chạy trong Supabase SQL Editor
-- =============================================================================

CREATE OR REPLACE FUNCTION public.sync_class_student_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.classes
    SET student_count = student_count + 1
    WHERE id = NEW.class_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.classes
    SET student_count = GREATEST(0, student_count - 1)
    WHERE id = OLD.class_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Đảm bảo trigger tồn tại (idempotent)
DROP TRIGGER IF EXISTS trg_cm_sync_student_count ON public.class_memberships;
CREATE TRIGGER trg_cm_sync_student_count
  AFTER INSERT OR DELETE ON public.class_memberships
  FOR EACH ROW EXECUTE FUNCTION public.sync_class_student_count();

-- Backfill: đặt lại student_count = số membership thực tế của mỗi lớp
UPDATE public.classes c
SET student_count = COALESCE(
  (SELECT count(*) FROM public.class_memberships cm WHERE cm.class_id = c.id),
  0
);

-- ── Verify ───────────────────────────────────────────────────────────────────
-- SELECT name, student_count FROM public.classes;
