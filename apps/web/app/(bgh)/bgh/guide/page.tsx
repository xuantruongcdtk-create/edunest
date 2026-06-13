import type { Metadata } from 'next'
import { FeatureGuide, type GuideSection } from '../../../../components/guide/FeatureGuide'

export const metadata: Metadata = {
  title: 'Hướng dẫn sử dụng — Ban giám hiệu | EduNest',
}

const SECTIONS: GuideSection[] = [
  {
    icon: '🏛️',
    title: 'Bước 1 — Thiết lập trường',
    summary: 'Tạo thông tin trường khi đăng ký',
    steps: [
      'Khi đăng ký với vai trò Ban giám hiệu, ở bước thiết lập ban đầu bạn nhập thông tin trường.',
      'Hệ thống tạo hồ sơ trường và một mã trường để mời giáo viên tham gia.',
      'Sau khi hoàn tất, bạn vào được dashboard quản trị của trường.',
    ],
    tip: 'Nếu dashboard báo "chưa liên kết trường", hãy hoàn tất bước thiết lập trường trong phần đăng ký/onboarding.',
  },
  {
    icon: '🔗',
    title: 'Mời giáo viên vào trường',
    summary: 'Chia sẻ mã trường cho giáo viên',
    steps: [
      'Gửi mã trường cho các giáo viên.',
      'Giáo viên vào mục "Tham gia trường", nhập mã để liên kết tài khoản với trường.',
      'Sau khi liên kết, giáo viên sẽ xuất hiện trong danh sách để bạn phân công chủ nhiệm lớp.',
    ],
  },
  {
    icon: '🏫',
    title: 'Quản lý lớp học',
    summary: 'Tạo lớp và phân công giáo viên chủ nhiệm',
    steps: [
      'Vào "Lớp học", tạo các lớp của trường.',
      'Với mỗi lớp, chọn giáo viên chủ nhiệm từ danh sách giáo viên đã tham gia trường.',
      'Lớp mới sẽ được tính ngay vào các chỉ số tổng quan của trường.',
    ],
  },
  {
    icon: '⊞',
    title: 'Tổng quan KPI toàn trường',
    summary: 'Nắm bức tranh chất lượng học tập của trường',
    steps: [
      'Vào "Tổng quan" để xem các chỉ số: tổng số học sinh, điểm trung bình, số lớp.',
      'Xem bảng xếp hạng và so sánh kết quả giữa các lớp.',
    ],
  },
  {
    icon: '📄',
    title: 'Báo cáo & theo dõi tiến độ',
    summary: 'Theo dõi tiến độ học tập của trường',
    steps: [
      'Vào "Báo cáo" để theo dõi tình hình học tập tổng thể của trường.',
      'Kết hợp với cảnh báo sớm của giáo viên để nắm các lớp/nhóm học sinh cần quan tâm.',
    ],
  },
]

export default function BghGuidePage() {
  return (
    <FeatureGuide
      title="Hướng dẫn sử dụng"
      subtitle="Dành cho Ban giám hiệu — quản trị trường và theo dõi toàn cảnh"
      intro="Hướng dẫn này đi qua quy trình quản trị của Ban giám hiệu trên EduNest: thiết lập trường, mời giáo viên, quản lý lớp và theo dõi KPI toàn trường. Bấm vào từng mục để xem chi tiết."
      accent="bgh"
      sections={SECTIONS}
    />
  )
}
