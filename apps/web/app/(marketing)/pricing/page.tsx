'use client'

import { useState } from 'react'
import Link         from 'next/link'

type Billing = 'monthly' | 'yearly'

const FEATURES_FREE = [
  '3 bộ quiz mỗi tháng',
  'Xem điểm số & biểu đồ cơ bản',
  '10 tin nhắn AI Coach / tháng',
  '1 hồ sơ con',
]
const FEATURES_PREMIUM = [
  'Không giới hạn quiz bằng AI',
  'AI Coach 24/7 (200 tin/tháng)',
  'Cảnh báo sớm — Early Warning',
  'Báo cáo tuần & phân tích sâu',
  'Learning DNA™ của con',
  'Lên tới 5 hồ sơ con',
  'Xuất PDF báo cáo',
]
const FEATURES_TEACHER = [
  'Tất cả tính năng Premium',
  'Portal quản lý lớp học',
  'Tạo quiz AI cho học sinh',
  'Thống kê lớp — điểm TB, xu hướng',
  'Cảnh báo học sinh có nguy cơ',
  'Chia sẻ quiz (link công khai)',
  'Hỗ trợ ưu tiên qua Zalo',
]

const CREDIT_PACKS = [
  { label: 'Gói nhỏ',   count: 10,  price: 50_000,  saving: null },
  { label: 'Gói vừa',   count: 30,  price: 120_000, saving: '-17%' },
  { label: 'Gói lớn',   count: 100, price: 350_000, saving: '-30%' },
]

function fmt(n: number) {
  return n.toLocaleString('vi-VN') + 'đ'
}

interface PlanCardProps {
  badge?:    string
  badgeColor?: string
  name:      string
  tagline:   string
  price:     React.ReactNode
  priceNote?: string
  features:  string[]
  cta:       string
  ctaHref:   string
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
        <p className={`text-xs font-semibold uppercase tracking-widest mb-1 ${highlight ? 'text-primary-light/70' : 'text-gray-400'}`}>{tagline}</p>
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
  const [billing, setBilling] = useState<Billing>('monthly')
  const yearlyDiscount = 0.2 // 20% off

  const premiumPrice = billing === 'monthly' ? 199_000 : Math.round(199_000 * 12 * (1 - yearlyDiscount) / 12)
  const teacherPrice = billing === 'monthly' ? 299_000 : Math.round(299_000 * 12 * (1 - yearlyDiscount) / 12)

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

          {/* Billing toggle */}
          <div className="inline-flex items-center bg-gray-100 rounded-btn p-1 gap-1">
            <button onClick={() => setBilling('monthly')}
              className={`px-4 py-1.5 rounded-btn text-sm font-medium transition-colors ${
                billing === 'monthly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}>
              Hằng tháng
            </button>
            <button onClick={() => setBilling('yearly')}
              className={`px-4 py-1.5 rounded-btn text-sm font-medium transition-colors flex items-center gap-1.5 ${
                billing === 'yearly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}>
              Hằng năm
              <span className="bg-success text-white text-xs px-1.5 py-0.5 rounded-full font-bold">-20%</span>
            </button>
          </div>
        </div>

        {/* Main plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            name="Premium"
            tagline="Dành cho phụ huynh"
            price={
              <span>
                {fmt(premiumPrice)}
                <span className="text-base font-semibold opacity-70"> / tháng</span>
              </span>
            }
            priceNote={billing === 'yearly' ? `Thanh toán ${fmt(premiumPrice * 12)}/năm — tiết kiệm ${fmt(199_000 * 12 * yearlyDiscount)}` : 'Huỷ bất cứ lúc nào'}
            features={FEATURES_PREMIUM}
            cta="Dùng thử 7 ngày miễn phí"
            ctaHref="/register?plan=premium"
            highlight
          />
          <PlanCard
            name="Teacher Pro"
            tagline="Dành cho giáo viên"
            price={
              <span>
                {fmt(teacherPrice)}
                <span className="text-base font-semibold text-gray-400"> / tháng</span>
              </span>
            }
            priceNote={billing === 'yearly' ? `Thanh toán ${fmt(teacherPrice * 12)}/năm` : 'Huỷ bất cứ lúc nào'}
            features={FEATURES_TEACHER}
            cta="Đăng ký Teacher Pro"
            ctaHref="/register?plan=teacher"
          />
        </div>

        {/* Credit packs */}
        <div>
          <div className="text-center mb-8">
            <h2 className="font-display font-extrabold text-2xl text-gray-900 mb-2">Gói quiz lẻ</h2>
            <p className="text-gray-500 text-sm">Không muốn đăng ký? Mua theo số lượng, không hết hạn.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {CREDIT_PACKS.map((pack) => (
              <div key={pack.label} className="bg-white rounded-card shadow-card p-5 flex items-center justify-between ring-1 ring-gray-100 hover:ring-primary/40 transition-all hover:shadow-card-hover">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-display font-bold text-gray-900">{pack.label}</p>
                    {pack.saving && (
                      <span className="text-xs bg-success/10 text-success font-bold px-1.5 py-0.5 rounded-full">{pack.saving}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{pack.count} bộ quiz AI</p>
                </div>
                <div className="text-right">
                  <p className="font-display font-extrabold text-gray-900">{fmt(pack.price)}</p>
                  <p className="text-xs text-gray-400">{fmt(Math.round(pack.price / pack.count))} / bộ</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-400 mt-4">
            Mua credit sau khi đăng nhập tại Dashboard → Tài khoản
          </p>
        </div>

        {/* B2B teaser */}
        <div className="bg-gradient-to-br from-[#185FA5] to-[#0e4a85] rounded-card p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-white/60 mb-2">Dành cho trường học</p>
            <h3 className="font-display font-extrabold text-2xl mb-2">Gói B2B trường học</h3>
            <p className="text-white/80 text-sm max-w-md">
              Dashboard cho Ban giám hiệu, báo cáo toàn trường, tích hợp lớp học, hỗ trợ triển khai.
              Từ <strong className="text-white">5M/năm</strong> cho 300 học sinh.
            </p>
          </div>
          <div className="flex-shrink-0 flex flex-col gap-3 text-center">
            <a href="mailto:contact@edunest.vn"
              className="bg-white text-[#185FA5] text-sm font-bold px-6 py-2.5 rounded-btn hover:bg-gray-50 transition-colors whitespace-nowrap">
              Liên hệ tư vấn →
            </a>
            <p className="text-xs text-white/50">Phản hồi trong 24 giờ</p>
          </div>
        </div>

        {/* FAQ / trust */}
        <div>
          <h2 className="font-display font-extrabold text-2xl text-gray-900 text-center mb-8">Câu hỏi thường gặp</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              {
                q: 'Có thể huỷ bất cứ lúc nào không?',
                a: 'Có. Không có phí huỷ, không ràng buộc. Huỷ từ Settings → Tài khoản, có hiệu lực từ chu kỳ tiếp theo.',
              },
              {
                q: 'Thanh toán qua phương thức nào?',
                a: 'MoMo, VNPAY và thẻ nội địa ATM. Phương thức quốc tế (Visa/Mastercard) sẽ có sớm.',
              },
              {
                q: '7 ngày dùng thử là như thế nào?',
                a: 'Bạn có toàn quyền dùng Premium trong 7 ngày, không bị tính tiền. Nhắc trước 24 giờ trước khi hết trial.',
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
        </div>

        {/* Final CTA */}
        <div className="text-center py-4">
          <h3 className="font-display font-extrabold text-2xl text-gray-900 mb-3">
            Sẵn sàng theo dõi con thông minh hơn?
          </h3>
          <p className="text-gray-500 mb-6">Bắt đầu miễn phí, nâng cấp khi bạn cần.</p>
          <Link href="/register"
            className="inline-block bg-primary text-white font-bold text-base px-8 py-3 rounded-btn hover:bg-primary-dark transition-colors">
            Đăng ký miễn phí →
          </Link>
        </div>
      </div>
    </div>
  )
}
