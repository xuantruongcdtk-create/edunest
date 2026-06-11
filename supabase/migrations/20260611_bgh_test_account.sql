-- =============================================================================
-- Tạo tài khoản BGH để test ngay — chạy trong Supabase SQL Editor
-- =============================================================================
-- Sửa email bên dưới thành email tài khoản bạn muốn biến thành Ban giám hiệu.
-- Lệnh này: (1) tạo 1 trường demo, (2) đổi role tài khoản thành 'bgh',
-- (3) liên kết tài khoản với trường đó.
-- =============================================================================

WITH new_school AS (
  INSERT INTO public.schools (name, province, district)
  VALUES ('Trường THPT Demo EduNest', 'Hà Nội', 'Cầu Giấy')
  RETURNING id
)
UPDATE public.profiles p
SET role      = 'bgh',
    school_id = (SELECT id FROM new_school)
WHERE p.email = 'xuantruongcdtk@gmail.com';   -- 👈 SỬA EMAIL Ở ĐÂY

-- ── Verify ───────────────────────────────────────────────────────────────────
-- SELECT email, role, school_id FROM public.profiles WHERE email = 'xuantruongcdtk@gmail.com';
-- Sau khi chạy: đăng xuất + đăng nhập lại (hoặc refresh), vào /dashboard
-- sẽ tự chuyển tới /bgh/dashboard.
