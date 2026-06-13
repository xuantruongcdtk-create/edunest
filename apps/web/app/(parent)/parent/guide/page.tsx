import type { Metadata } from 'next'
import { FeatureGuide, type GuideSection } from '../../../../components/guide/FeatureGuide'

export const metadata: Metadata = {
  title: 'Hướng dẫn sử dụng — Phụ huynh | EduNest',
}

const SECTIONS: GuideSection[] = [
  {
    icon: '👦',
    title: 'Bước 1 — Thêm hồ sơ con',
    summary: 'Tạo hồ sơ cho từng con để bắt đầu theo dõi',
    steps: [
      'Vào mục "Hồ sơ con" trên thanh bên trái.',
      'Bấm "Thêm con", nhập họ tên, lớp (1–12), ngày sinh và trường của con.',
      'Bấm Lưu. Bạn có thể thêm nhiều con (số lượng tùy theo gói đang dùng).',
    ],
    tip: 'Mỗi con là một hồ sơ riêng. Dùng nút chuyển con ở đầu các trang để xem dữ liệu của từng bé.',
  },
  {
    icon: '🏫',
    title: 'Kết nối con với lớp của giáo viên',
    summary: 'Nhập mã lớp để con nhận bài kiểm tra được giao',
    steps: [
      'Xin giáo viên mã lớp gồm 6 ký tự.',
      'Vào mục "Tham gia lớp", nhập mã và chọn con muốn thêm vào lớp.',
      'Sau khi tham gia, con sẽ thấy các bài kiểm tra giáo viên giao cho lớp đó.',
    ],
    tip: 'Một con có thể tham gia nhiều lớp (ví dụ lớp Toán, lớp Anh) bằng các mã khác nhau.',
  },
  {
    icon: '📊',
    title: 'Nhập & theo dõi điểm số',
    summary: 'Ghi điểm các môn và xem biểu đồ xu hướng',
    steps: [
      'Vào "Bảng điểm", chọn con cần nhập điểm.',
      'Bấm "Thêm điểm": chọn môn, loại bài (15 phút / 45 phút / học kỳ), học kỳ và nhập điểm cùng thang điểm.',
      'Hệ thống vẽ biểu đồ xu hướng theo môn. Điểm quiz trên app được tính trung bình riêng, tách biệt với điểm bạn nhập tay.',
    ],
  },
  {
    icon: '📝',
    title: 'Bài kiểm tra của con',
    summary: 'Con làm bài trắc nghiệm & tự luận, chấm điểm tự động',
    steps: [
      'Vào "Bài kiểm tra" để xem các bài được giáo viên giao, nhóm theo môn.',
      'Mở một bài để con làm: gồm câu trắc nghiệm và/hoặc câu tự luận. Bấm nộp khi xong.',
      'Điểm được chấm tự động ngay: trắc nghiệm chấm theo đáp án, câu tự luận do AI chấm kèm nhận xét.',
    ],
    tip: 'Chú ý nhãn "Hết hạn" — hãy nhắc con làm bài trước hạn nộp giáo viên đặt.',
  },
  {
    icon: '🤖',
    title: 'Hỏi EduCoach AI',
    summary: 'Trợ lý AI tư vấn về việc học của con',
    steps: [
      'Vào "EduCoach AI" và đặt câu hỏi, ví dụ: "Con cần cải thiện môn nào?".',
      'AI dựa trên dữ liệu học tập của con để phân tích và gợi ý phương pháp học phù hợp.',
    ],
    tip: 'Gói miễn phí có giới hạn số tin nhắn mỗi tháng. Nâng cấp ở "Cài đặt" để chat không giới hạn.',
  },
  {
    icon: '📄',
    title: 'Báo cáo, Learning DNA & cảnh báo sớm',
    summary: 'Tổng hợp tuần và phát hiện vấn đề kịp thời',
    steps: [
      'Trang "Tổng quan" hiển thị thẻ Learning DNA: phong cách học, độ ổn định và nguy cơ kiệt sức của con.',
      'Vào "Báo cáo" để xem tổng hợp theo tuần và lịch sử cảnh báo theo từng con.',
      'Khi điểm giảm bất thường hoặc có nguy cơ kiệt sức, hệ thống tự tạo cảnh báo — bấm để đánh dấu đã đọc.',
    ],
  },
  {
    icon: '⚙',
    title: 'Quản lý gói & thanh toán',
    summary: 'Xem và nâng cấp gói dịch vụ',
    steps: [
      'Vào "Cài đặt" để xem gói hiện tại, ngày hết hạn và lịch sử thanh toán.',
      'Chọn nâng cấp và thanh toán qua MoMo hoặc VNPAY. Gói được kích hoạt ngay sau khi thanh toán thành công.',
    ],
  },
]

export default function ParentGuidePage() {
  return (
    <FeatureGuide
      title="Hướng dẫn sử dụng"
      subtitle="Dành cho phụ huynh — từng bước theo dõi việc học của con"
      intro="Chào mừng bạn đến với EduNest! Hướng dẫn này đi qua toàn bộ tính năng dành cho phụ huynh theo thứ tự nên làm. Bấm vào từng mục để xem chi tiết các bước."
      accent="primary"
      sections={SECTIONS}
    />
  )
}
