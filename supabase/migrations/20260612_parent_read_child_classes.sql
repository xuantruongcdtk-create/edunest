-- =============================================================================
-- Fix: phụ huynh không đọc được lớp con mình đang học (RLS classes chỉ cho
-- teacher_id = auth.uid() hoặc cùng trường) → tên lớp không hiển thị bên phụ huynh.
-- Thêm policy cho phụ huynh đọc lớp mà CON của họ là thành viên.
-- Chạy trong Supabase SQL Editor
-- =============================================================================

CREATE POLICY "classes: parent of member read"
  ON public.classes FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM   public.class_memberships cm
      JOIN   public.children          c ON c.id = cm.child_id
      WHERE  cm.class_id  = classes.id
      AND    c.parent_id  = auth.uid()
    )
  );

-- ── Verify ───────────────────────────────────────────────────────────────────
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'classes' ORDER BY policyname;
