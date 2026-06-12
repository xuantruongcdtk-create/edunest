import Link from 'next/link'
import { Reveal } from '../../../components/Reveal'

const FEATURES_FREE = [
  '3 bộ quiz mỗi tháng',
  'Xem điểm số & biểu đồ cơ bản',
  '10 tin nhắn AI Coach / tháng',
  '1 hồ sơ con',
]
const FEATURES_BASIC = [
  'Quiz bằng AI không giới hạn',
  'Phân tích điểm số & biểu đồ đầy đủ',
  'Cảnh báo học tập sớm',
  'Lên tới 3 hồ sơ con',
]
const FEATURES_PRO = [
  'Mọi tính năng gói Cơ bản',
  'AI Coach 24/7 không giới hạn',
  'Learning DNA™ của con',
  'Báo cáo tuần chi tiết',
  'Lên tới 5 hồ sơ con',
]

function fmt(n: number) {
  return n.toLocaleString('vi-VN') + 'đ'
}

interface PlanCardProps {
  badge?:     string
  badgeColor?: string
  name:       string
  tagline:    string
  price:      React.ReactNode
  priceNote?: string
  features:   string[]
  cta:        string
  ctaHref:    string
  highlight?: boolean
}

function PlanCard({ badge, badgeColor, name, tagline, price, priceNote, features, cta, ctaHref, highlight }: PlanCardProps) {
  return (
    <div className={`relative flex flex-col rounded-card shadow-card overflow-hidden transition-shadow hover:shadow-card-hover ${
      highlight ? 'ring-2 ring-primary' : 'ring-1 ring-gray-100'
    }`}>
      {badge && (
        <div className={`absolute top-4 right-4 text-xs font-bold px-2.5 py-1 rounded-full ${badgeColor ?? 'bg-primary text-white'}`}>
          {badge}
        </div>
      )}

      <div className={`px-6 pt-6 pb-5 ${highlight ? 'bg-primary text-white' : 'bg-white'}`}>
        <p className={`text-xs font-semibold uppercase tracking-widest mb-1 ${highlight ? 'text-white/70' : 'text-gray-400'}`}>{tagline}</p>
        <h3 className={`font-display font-extrabold text-xl mb-3 ${highlight ? 'text-white' : 'text-gray-900'}`}>{name}</h3>
        <div className={`font-display font-extrabold text-3xl ${highlight ? 'text-white' : 'text-gray-900'}`}>{price}</div>
        {priceNote && <p className={`text-xs mt-1 ${highlight ? 'text-white/70' : 'text-gray-400'}`}>{priceNote}</p>}
      </div>

      <div className="px-6 pt-5 pb-6 bg-white flex flex-col flex-1">
        <ul className="space-y-2.5 flex-1 mb-6">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700">
              <span className="text-success flex-shrink-0 mt-0.5">✓</span>
              {f}
            </li>
          ))}
        </ul>

        <Link href={ctaHref}
          className={`block text-center text-sm font-bold py-2.5 rounded-btn transition-colors ${
            highlight
              ? 'bg-primary text-white hover:bg-primary-dark'
              : 'bg-gray-50 text-gray-800 border border-gray-200 hover:bg-gray-100'
          }`}>
          {cta}
        </Link>
      </div>
    </div>
  )
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-display font-extrabold text-xl text-primary">EduNest</Link>
          <div className="flex items-center gap-4">
            <Link href="/login"   className="text-sm text-gray-600 hover:text-primary transition-colors">Đăng nhập</Link>
            <Link href="/register" className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-btn hover:bg-primary-dark transition-colors">
              Dùng miễn phí
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-14 space-y-16">
        {/* Hero */}
        <div className="text-center space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Bảng giá</p>
          <h1 className="font-display font-extrabold text-4xl text-gray-900">
            Theo dõi con học thông minh hơn,<br className="hidden sm:block" />
            <span className="text-primary"> không cần đoán mò</span>
          </h1>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Bắt đầu miễn phí. Nâng cấp khi bạn cần thêm insight và AI coaching.
          </p>
        </div>

        {/* Main plans */}
        <Reveal><div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PlanCard
            name="Miễn phí"
            tagline="Khởi đầu"
            price="0đ"
            priceNote="Không cần thẻ tín dụng"
            features={FEATURES_FREE}
            cta="Đăng ký ngay"
            ctaHref="/register"
          />
          <PlanCard
            badge="Phổ biến nhất"
            badgeColor="bg-white text-primary border border-primary/30"
            name="Cơ bản"
            tagline="Dành cho phụ huynh"
            price={<span>{fmt(99_000)}<span className="text-base font-semibold opacity-70"> / tháng</span></span>}
            priceNote="Huỷ bất cứ lúc nào"
            features={FEATURES_BASIC}
            cta="Dùng thử 7 ngày miễn phí"
            ctaHref="/register?plan=basic"
            highlight
          />
          <PlanCard
            name="Nâng cao"
            tagline="Cho phụ huynh & giáo viên"
            price={<span>{fmt(199_000)}<span className="text-base font-semibold text-gray-400"> / tháng</span></span>}
            priceNote="Đầy đủ AI Coach & Learning DNA"
            features={FEATURES_PRO}
            cta="Đăng ký gói Nâng cao"
            ctaHref="/register?plan=pro"
          />
        </div></Reveal>

        {/* B2B teaser */}
        <Reveal><div className="bg-gradient-to-br from-[#185FA5] to-[#0e4a85] rounded-card p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-white/60 mb-2">Dành cho trường học</p>
            <h3 className="font-display font-extrabold text-2xl mb-2">Gói Trường học</h3>
            <p className="text-white/80 text-sm max-w-md">
              Dashboard cho Ban giám hiệu, báo cáo toàn trường, quản lý lớp & giáo viên, hỗ trợ triển khai.
              Chỉ <strong className="text-white">990.000đ / năm</strong>.
            </p>
          </div>
          <div className="flex-shrink-0 flex flex-col gap-3 text-center">
            <Link href="/register?plan=school"
              className="bg-white text-[#185FA5] text-sm font-bold px-6 py-2.5 rounded-btn hover:bg-gray-50 transition-colors whitespace-nowrap">
              Đăng ký cho trường →
            </Link>
            <a href="mailto:contact@edunest.vn" className="text-xs text-white/60 hover:text-white">Hoặc liên hệ tư vấn</a>
          </div>
        </div></Reveal>

        {/* FAQ / trust */}
        <Reveal><div>
          <h2 className="font-display font-extrabold text-2xl text-gray-900 text-center mb-8">Câu hỏi thường gặp</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              {
                q: 'Có thể huỷ bất cứ lúc nào không?',
                a: 'Có. Không có phí huỷ, không ràng buộc. Gói có hiệu lực đến hết hạn đã thanh toán.',
              },
              {
                q: 'Thanh toán qua phương thức nào?',
                a: 'MoMo, VNPAY và thẻ nội địa ATM. Phương thức quốc tế (Visa/Mastercard) sẽ có sớm.',
              },
              {
                q: 'Gói Cơ bản và Nâng cao khác nhau thế nào?',
                a: 'Cơ bản (99k/tháng) mở khoá quiz không giới hạn + phân tích + cảnh báo sớm. Nâng cao (199k/tháng) có thêm AI Coach không giới hạn, Learning DNA và báo cáo tuần.',
              },
              {
                q: 'Dữ liệu của con có được bảo mật không?',
                a: 'Có. Toàn bộ dữ liệu mã hóa AES-256, lưu trên Supabase tại Singapore, tuân thủ Nghị định 13/2023.',
              },
            ].map(({ q, a }) => (
              <div key={q} className="bg-white rounded-card shadow-card p-5 ring-1 ring-gray-100">
                <p className="font-semibold text-gray-900 mb-2 text-sm">{q}</p>
                <p className="text-gray-500 text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div></Reveal>

        {/* Final CTA */}
        <Reveal><div className="text-center py-4">
          <h3 className="font-display font-extrabold text-2xl text-gray-900 mb-3">
            Sẵn sàng theo dõi con thông minh hơn?
          </h3>
          <p className="text-gray-500 mb-6">Bắt đầu miễn phí, nâng cấp khi bạn cần.</p>
          <Link href="/register"
            className="inline-block bg-primary text-white font-bold text-base px-8 py-3 rounded-btn hover:bg-primary-dark transition-colors">
            Đăng ký miễn phí →
          </Link>
        </div></Reveal>
      </div>
    </div>
  )
}
