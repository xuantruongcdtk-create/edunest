-- =============================================================================
-- Migration: Hàm tra cứu lớp theo mã tham gia (cho phụ huynh chưa là thành viên)
-- RLS bảng classes chặn phụ huynh đọc lớp họ chưa tham gia → không tra được mã.
-- Dùng SECURITY DEFINER để tra cứu an toàn (chỉ trả thông tin tối thiểu theo mã).
-- Chạy trong Supabase SQL Editor
-- =============================================================================

CREATE OR REPLACE FUNCTION public.find_class_by_join_code(p_code text)
RETURNS TABLE (id uuid, name text, grade smallint, teacher_name text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.name, c.grade, COALESCE(p.full_name, 'Giáo viên')
  FROM   public.classes  c
  LEFT JOIN public.profiles p ON p.id = c.teacher_id
  WHERE  c.join_code = upper(trim(p_code))
  LIMIT  1
$$;

-- Cho phép user đã đăng nhập gọi hàm này
GRANT EXECUTE ON FUNCTION public.find_class_by_join_code(text) TO authenticated;

-- ── Verify ───────────────────────────────────────────────────────────────────
-- SELECT * FROM public.find_class_by_join_code('YLRC9L');
