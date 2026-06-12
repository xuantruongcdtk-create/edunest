-- =============================================================================
-- Fix: policy "classes: parent of member read" gây ĐỆ QUY RLS vô hạn (lỗi 500)
-- Vì subquery đọc class_memberships, mà policy của class_memberships lại đọc
-- classes → vòng lặp. Dùng SECURITY DEFINER function (bỏ qua RLS trong thân hàm)
-- để cắt vòng lặp.
-- Chạy trong Supabase SQL Editor
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_parent_in_class(p_class_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM   public.class_memberships cm
    JOIN   public.children          c ON c.id = cm.child_id
    WHERE  cm.class_id  = p_class_id
    AND    c.parent_id  = auth.uid()
  )
$$;

-- Thay policy đệ quy bằng policy gọi function (không còn subquery đọc class_memberships)
DROP POLICY IF EXISTS "classes: parent of member read" ON public.classes;
CREATE POLICY "classes: parent of member read"
  ON public.classes FOR SELECT
  USING (public.is_parent_in_class(id));

-- ── Verify ───────────────────────────────────────────────────────────────────
-- SELECT policyname FROM pg_policies WHERE tablename = 'classes';
