import type { Metadata } from 'next'
import { FeatureGuide, type GuideSection } from '../../../../components/guide/FeatureGuide'

export const metadata: Metadata = {
  title: 'Hướng dẫn sử dụng — Giáo viên | EduNest',
}

const SECTIONS: GuideSection[] = [
  {
    icon: '🔗',
    title: 'Bước 1 — Tham gia trường',
    summary: 'Liên kết tài khoản với trường của bạn',
    steps: [
      'Xin Ban giám hiệu mã trường.',
      'Vào mục "Tham gia trường", nhập mã.',
      'Sau khi liên kết, tài khoản của bạn thuộc về trường và BGH có thể phân công bạn làm chủ nhiệm lớp.',
    ],
    tip: 'Nếu bạn dạy tự do (không thuộc trường nào), có thể bỏ qua bước này và vẫn tạo lớp, giao bài bình thường.',
  },
  {
    icon: '🏫',
    title: 'Tạo lớp & chia sẻ mã tham gia',
    summary: 'Tạo lớp và mời phụ huynh kết nối con vào lớp',
    steps: [
      'Vào "Lớp học", bấm "Tạo lớp" và đặt tên lớp (ví dụ: Toán 9A).',
      'Hệ thống sinh một mã lớp gồm 6 ký tự.',
      'Gửi mã này cho phụ huynh. Họ vào "Tham gia lớp" nhập mã để kết nối con vào lớp của bạn.',
    ],
    tip: 'Sĩ số lớp tự cập nhật khi phụ huynh thêm con. Học sinh trong lớp sẽ nhận mọi bài bạn giao cho lớp đó.',
  },
  {
    icon: '🤖',
    title: 'Tạo bài kiểm tra bằng AI',
    summary: 'AI sinh đề trắc nghiệm và tự luận trong vài giây',
    steps: [
      'Vào "Bài kiểm tra", bấm "Tạo bằng AI".',
      'Chọn môn, lớp, độ khó, số câu trắc nghiệm và số câu tự luận, thời gian làm bài, và chủ đề (tùy chọn).',
      'AI sinh đề tự động. Xem lại, chỉnh nếu cần rồi lưu.',
    ],
    tip: 'Mỗi giờ có giới hạn số lần tạo quiz bằng AI để đảm bảo chất lượng — hãy gộp nhu cầu trong một lần tạo.',
  },
  {
    icon: '📤',
    title: 'Tải đề lên từ Word / Excel / PDF',
    summary: 'Đưa đề có sẵn vào hệ thống',
    steps: [
      'Trong "Bài kiểm tra", chọn "Tải lên" và chọn file (.docx, .xlsx, .pdf, tối đa 10MB).',
      'Với Excel: hệ thống đọc các cột (Câu hỏi, A/B/C/D, Đáp án, Giải thích).',
      'Với Word/PDF: AI tự trích xuất câu hỏi và nhận diện câu trắc nghiệm hay tự luận.',
    ],
  },
  {
    icon: '🎯',
    title: 'Giao bài cho lớp & đặt hạn nộp',
    summary: 'Chọn lớp nhận bài và thời hạn',
    steps: [
      'Mở chi tiết một bài kiểm tra.',
      'Chọn lớp để giao bài và đặt hạn nộp (định dạng ngày/tháng/năm).',
      'Học sinh và phụ huynh trong lớp sẽ thấy bài ngay. Hạn nộp không được đặt vào quá khứ.',
    ],
  },
  {
    icon: '✅',
    title: 'Xem bài đã nộp & kết quả chấm',
    summary: 'Theo dõi từng học sinh, đúng/sai từng câu',
    steps: [
      'Trong chi tiết bài, mở mục "Bài đã nộp" để xem danh sách học sinh đã làm.',
      'Mở chi tiết một bài để xem từng câu đúng/sai và đáp án học sinh chọn.',
      'Câu tự luận được AI chấm điểm kèm nhận xét, giúp bạn rà soát nhanh.',
    ],
  },
  {
    icon: '👥',
    title: 'Quản lý học sinh',
    summary: 'Xem danh sách và kết quả học sinh các lớp',
    steps: [
      'Vào "Học sinh" để xem toàn bộ học sinh trong các lớp của bạn.',
      'Bảng hiển thị tên, lớp, điểm trung bình và số bài kiểm tra đã làm của từng em.',
    ],
  },
  {
    icon: '🔔',
    title: 'Cảnh báo học tập',
    summary: 'Phát hiện sớm học sinh cần quan tâm',
    steps: [
      'Vào "Cảnh báo" để xem các cảnh báo tự động cho học sinh của bạn (điểm giảm, bỏ nhiều bài, nguy cơ kiệt sức...).',
      'Lọc theo mức độ (cảnh báo / nguy hiểm) và đánh dấu đã đọc sau khi xử lý.',
    ],
  },
]

export default function TeacherGuidePage() {
  return (
    <FeatureGuide
      title="Hướng dẫn sử dụng"
      subtitle="Dành cho giáo viên — tạo lớp, ra đề và theo dõi học sinh"
      intro="Hướng dẫn này đi qua quy trình của giáo viên trên EduNest: liên kết trường, tạo lớp, ra đề bằng AI, giao bài và chấm điểm. Bấm vào từng mục để xem chi tiết."
      accent="primary"
      sections={SECTIONS}
    />
  )
}
