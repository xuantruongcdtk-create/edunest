import type { Metadata } from 'next'
import Link from 'next/link'
import { Reveal } from '../../components/Reveal'

export const metadata: Metadata = {
  title: 'EduNest — Nền tảng học tập thông minh cho gia đình Việt',
  description:
    'Theo dõi kết quả học tập, nhận tư vấn AI và kết nối với giáo viên của con. Dành cho phụ huynh K-12 Việt Nam.',
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎓</span>
          <span className="font-display font-extrabold text-xl text-primary">EduNest</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          <a href="#features" className="hover:text-primary transition-colors">Tính năng</a>
          <a href="#pricing"  className="hover:text-primary transition-colors">Bảng giá</a>
          <a href="#about"    className="hover:text-primary transition-colors">Về chúng tôi</a>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-gray-600 hover:text-primary transition-colors"
          >
            Đăng nhập
          </Link>
          <Link
            href="/register"
            className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-btn hover:bg-primary-dark transition-colors"
          >
            Dùng thử miễn phí
          </Link>
        </div>
      </div>
    </nav>
  )
}

// ─── Hero ──────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-white to-accent/5 pt-20 pb-28">
      {/* Background blobs */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/8 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-accent/8 rounded-full blur-3xl" />

      <div className="relative max-w-6xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <span>✨</span> Ra mắt tháng 7/2026 — Đặt chỗ miễn phí ngay
        </div>

        <h1 className="font-display font-extrabold text-5xl md:text-6xl text-gray-900 leading-tight mb-6">
          Theo dõi việc học của con<br />
          <span className="text-primary">thông minh hơn</span> với AI
        </h1>

        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          EduNest giúp phụ huynh nắm bắt kết quả học tập, phát hiện sớm nguy cơ kiệt sức
          và nhận tư vấn từ AI Coach — mọi lúc, mọi nơi.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
          <Link
            href="/register"
            className="w-full sm:w-auto bg-primary text-white font-bold text-base px-8 py-3.5 rounded-btn hover:bg-primary-dark transition-colors shadow-lg shadow-primary/25"
          >
            Bắt đầu miễn phí →
          </Link>
          <a
            href="#features"
            className="w-full sm:w-auto border border-gray-200 text-gray-700 font-semibold text-base px-8 py-3.5 rounded-btn hover:border-primary hover:text-primary transition-colors"
          >
            Xem tính năng
          </a>
        </div>

        {/* Mock dashboard preview */}
        <div className="relative mx-auto max-w-4xl">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            {/* Window chrome */}
            <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <div className="flex-1 bg-white rounded mx-12 py-1 px-3 text-xs text-gray-400 border border-gray-200">
                edunest.vn/dashboard
              </div>
            </div>
            {/* Mock content */}
            <div className="p-6 bg-gray-50">
              <div className="flex gap-4 mb-4">
                {[
                  { label: 'Điểm TB',   value: '8.4', color: 'text-primary',  bg: 'bg-primary/8' },
                  { label: 'Môn học',   value: '10',   color: 'text-accent',   bg: 'bg-accent/8' },
                  { label: 'Quiz đã làm', value: '24', color: 'text-success',  bg: 'bg-success/8' },
                  { label: 'Cảnh báo', value: '0',    color: 'text-warning',  bg: 'bg-warning/8' },
                ].map((stat) => (
                  <div key={stat.label} className={`flex-1 rounded-xl ${stat.bg} p-4`}>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                    <p className={`font-display font-extrabold text-2xl ${stat.color}`}>{stat.value}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-sm font-semibold text-gray-700 mb-3">Điểm theo môn học</p>
                <div className="space-y-2">
                  {[
                    { name: 'Toán',   score: 9.0, color: 'bg-primary' },
                    { name: 'Văn',    score: 7.5, color: 'bg-accent' },
                    { name: 'Anh',    score: 8.2, color: 'bg-success' },
                    { name: 'Lý',     score: 8.8, color: 'bg-primary' },
                  ].map((s) => (
                    <div key={s.name} className="flex items-center gap-3">
                      <span className="text-xs text-gray-600 w-8">{s.name}</span>
                      <div className="flex-1 h-2 rounded-full bg-gray-100">
                        <div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.score * 10}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-gray-700 w-8 text-right">{s.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Floating AI bubble */}
          <div className="absolute -bottom-5 -right-4 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 max-w-xs hidden md:block animate-slide-up">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-white text-sm flex-shrink-0">🤖</div>
              <div>
                <p className="text-xs font-semibold text-gray-800">EduCoach AI</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  Bé Minh tiến bộ tốt môn Toán! Gợi ý ôn thêm Văn học tuần này nhé.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Social Proof ──────────────────────────────────────────────────────────────
function SocialProof() {
  const stats = [
    { value: '10.000+', label: 'Phụ huynh tin dùng' },
    { value: '500+',    label: 'Giáo viên tham gia' },
    { value: '50+',     label: 'Trường học đối tác' },
    { value: '98%',     label: 'Hài lòng sau 1 tháng' },
  ]
  return (
    <section className="bg-white border-y border-gray-100 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="font-display font-extrabold text-3xl text-primary">{s.value}</p>
              <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Features ─────────────────────────────────────────────────────────────────
function Features() {
  const features = [
    {
      icon:  '📊',
      title: 'Theo dõi điểm số thông minh',
      desc:  'Nhập điểm thủ công hoặc scan PDF bằng AI. Biểu đồ xu hướng theo tuần, tháng, học kỳ.',
      tag:   'Phụ huynh',
      color: 'bg-primary/8 text-primary',
    },
    {
      icon:  '🤖',
      title: 'EduCoach AI cá nhân hóa',
      desc:  'AI coach phân tích từng con, gợi ý phương pháp học phù hợp, cảnh báo nguy cơ kiệt sức sớm.',
      tag:   'AI',
      color: 'bg-accent/8 text-accent',
    },
    {
      icon:  '🧬',
      title: 'Learning DNA',
      desc:  'Hệ thống phân tích phong cách học (thị giác, thính giác, vận động) và điểm mạnh/yếu của từng học sinh.',
      tag:   'Độc quyền',
      color: 'bg-success/8 text-success',
    },
    {
      icon:  '📝',
      title: 'Hệ thống quiz AI',
      desc:  'Giáo viên tạo bài kiểm tra tự động bằng AI theo chương trình BGDĐT. Học sinh làm trực tiếp trên app.',
      tag:   'Giáo viên',
      color: 'bg-warning/8 text-warning',
    },
    {
      icon:  '🏫',
      title: 'Quản trị trường học',
      desc:  'Ban giám hiệu theo dõi KPI toàn trường, xếp hạng lớp học, báo cáo học kỳ PDF tự động.',
      tag:   'BGH',
      color: 'bg-bgh-blue/8 text-bgh-blue',
    },
    {
      icon:  '🔔',
      title: 'Cảnh báo sớm thông minh',
      desc:  'Hệ thống phát hiện điểm giảm bất thường, bỏ quiz nhiều, nguy cơ kiệt sức và thông báo ngay.',
      tag:   'Tự động',
      color: 'bg-danger/8 text-danger',
    },
  ]

  return (
    <section id="features" className="py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <span className="text-primary text-sm font-semibold uppercase tracking-wide">Tính năng</span>
          <h2 className="font-display font-extrabold text-4xl text-gray-900 mt-2 mb-4">
            Tất cả trong một nền tảng
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Từ phụ huynh, giáo viên đến ban giám hiệu — EduNest phục vụ toàn bộ hệ sinh thái giáo dục.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-card p-6 shadow-card hover:shadow-card-hover transition-shadow group"
            >
              <div className="flex items-start justify-between mb-4">
                <span className="text-3xl">{f.icon}</span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${f.color}`}>{f.tag}</span>
              </div>
              <h3 className="font-display font-bold text-gray-900 text-lg mb-2 group-hover:text-primary transition-colors">
                {f.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── How it works ──────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    { n: '01', title: 'Đăng ký tài khoản',   desc: 'Tạo tài khoản miễn phí trong 2 phút, thêm thông tin của con.' },
    { n: '02', title: 'Nhập dữ liệu học tập', desc: 'Nhập điểm thủ công hoặc scan phiếu điểm PDF bằng tính năng OCR.' },
    { n: '03', title: 'AI phân tích',          desc: 'Hệ thống tự động tạo Learning DNA, gửi báo cáo hàng tuần.' },
    { n: '04', title: 'Hành động kịp thời',   desc: 'Nhận cảnh báo sớm, chat với EduCoach AI để có kế hoạch học phù hợp.' },
  ]

  return (
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <span className="text-primary text-sm font-semibold uppercase tracking-wide">Quy trình</span>
          <h2 className="font-display font-extrabold text-4xl text-gray-900 mt-2">Bắt đầu chỉ trong 4 bước</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {steps.map((s, i) => (
            <div key={s.n} className="relative text-center">
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary/30 to-transparent" />
              )}
              <div className="relative z-10 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white font-display font-extrabold text-xl mb-4 shadow-lg shadow-primary/25">
                {s.n}
              </div>
              <h3 className="font-display font-bold text-gray-900 mb-2">{s.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Pricing ──────────────────────────────────────────────────────────────────
function Pricing() {
  const plans = [
    {
      name:     'Miễn phí',
      price:    '0',
      period:   '/tháng',
      highlight: false,
      features: [
        '1 học sinh',
        'Theo dõi điểm cơ bản',
        '5 lần/tuần chat với AI Coach',
        'Báo cáo hàng tháng',
      ],
      cta: 'Bắt đầu ngay',
      href: '/register',
    },
    {
      name:     'Cơ bản',
      price:    '99.000',
      period:   '/tháng',
      highlight: false,
      features: [
        'Tối đa 3 học sinh',
        'Theo dõi toàn bộ môn học',
        '20 lần/ngày chat AI Coach',
        'Learning DNA đầy đủ',
        'Cảnh báo thông minh',
        'Báo cáo PDF hàng tuần',
      ],
      cta: 'Dùng thử 14 ngày',
      href: '/register?plan=basic',
    },
    {
      name:     'Nâng cao',
      price:    '199.000',
      period:   '/tháng',
      highlight: true,
      badge:    'Phổ biến nhất',
      features: [
        'Không giới hạn học sinh',
        'Tất cả tính năng Cơ bản',
        'Chat AI Coach không giới hạn',
        'OCR scan phiếu điểm PDF',
        'Kết nối giáo viên & trường',
        'Hỗ trợ ưu tiên 24/7',
      ],
      cta: 'Dùng thử 14 ngày',
      href: '/register?plan=pro',
    },
    {
      name:     'Trường học',
      price:    'Liên hệ',
      period:   '',
      highlight: false,
      features: [
        'Tất cả tính năng Nâng cao',
        'Dashboard BGH & giáo viên',
        'Quản lý lớp học, học sinh',
        'Báo cáo toàn trường',
        'Tích hợp hệ thống trường',
        'Account manager riêng',
      ],
      cta: 'Liên hệ tư vấn',
      href: 'mailto:school@edunest.vn',
    },
  ]

  return (
    <section id="pricing" className="py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <span className="text-primary text-sm font-semibold uppercase tracking-wide">Bảng giá</span>
          <h2 className="font-display font-extrabold text-4xl text-gray-900 mt-2 mb-4">
            Phù hợp với mọi gia đình
          </h2>
          <p className="text-gray-500 max-w-lg mx-auto">
            Dùng thử miễn phí 14 ngày, không cần thẻ tín dụng. Hủy bất cứ lúc nào.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-card p-6 ${
                plan.highlight
                  ? 'bg-primary text-white shadow-2xl shadow-primary/30 scale-105'
                  : 'bg-white shadow-card'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-warning text-white text-xs font-bold px-3 py-1 rounded-full">
                  {plan.badge}
                </div>
              )}

              <p className={`text-sm font-semibold mb-1 ${plan.highlight ? 'text-white/80' : 'text-gray-500'}`}>
                {plan.name}
              </p>
              <div className="flex items-end gap-1 mb-1">
                <span className={`font-display font-extrabold text-3xl ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                  {plan.price === '0' ? 'Miễn phí' : plan.price === 'Liên hệ' ? 'Liên hệ' : `₫${plan.price}`}
                </span>
              </div>
              {plan.period && (
                <p className={`text-sm mb-5 ${plan.highlight ? 'text-white/70' : 'text-gray-400'}`}>{plan.period}</p>
              )}

              <Link
                href={plan.href}
                className={`block text-center text-sm font-bold py-2.5 rounded-btn transition-colors mb-6 ${
                  plan.highlight
                    ? 'bg-white text-primary hover:bg-white/90'
                    : 'bg-primary text-white hover:bg-primary-dark'
                }`}
              >
                {plan.cta}
              </Link>

              <ul className="space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className={`flex items-start gap-2 text-sm ${plan.highlight ? 'text-white/90' : 'text-gray-600'}`}>
                    <span className={`mt-0.5 text-xs ${plan.highlight ? 'text-white' : 'text-primary'}`}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
function Testimonials() {
  const items = [
    {
      avatar: 'N',
      name:   'Chị Nguyễn Thị Lan',
      role:   'Phụ huynh · Hà Nội',
      text:   'Trước đây tôi không biết con học thế nào cho đến khi nhận phiếu điểm. Giờ với EduNest, tôi biết ngay khi con gặp khó khăn và có thể hỗ trợ kịp thời.',
    },
    {
      avatar: 'T',
      name:   'Thầy Trần Văn Hùng',
      role:   'Giáo viên Toán · THPT Chu Văn An',
      text:   'Tính năng tạo quiz AI giúp tôi tiết kiệm 2 tiếng mỗi tuần. Học sinh cũng hứng thú hơn vì bài tập đa dạng và phù hợp với từng em.',
    },
    {
      avatar: 'M',
      name:   'Cô Phạm Thị Mai',
      role:   'Hiệu phó · Trường TH Đống Đa',
      text:   'Dashboard trường học cho tôi cái nhìn tổng quan về toàn trường chỉ trong 5 phút. Báo cáo học kỳ giờ làm xong trong 1 ngày thay vì 1 tuần.',
    },
  ]

  return (
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <span className="text-primary text-sm font-semibold uppercase tracking-wide">Đánh giá</span>
          <h2 className="font-display font-extrabold text-4xl text-gray-900 mt-2">
            Được tin dùng bởi hàng nghìn gia đình
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((t) => (
            <div key={t.name} className="bg-gray-50 rounded-card p-6 shadow-card">
              <div className="flex mb-3">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-warning text-sm">★</span>
                ))}
              </div>
              <p className="text-gray-700 text-sm leading-relaxed mb-5">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── CTA ──────────────────────────────────────────────────────────────────────
function CTA() {
  return (
    <section className="py-24 bg-gradient-to-br from-primary to-primary-dark text-white">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <h2 className="font-display font-extrabold text-4xl md:text-5xl mb-6 leading-tight">
          Sẵn sàng đồng hành cùng con?
        </h2>
        <p className="text-white/80 text-lg mb-10 leading-relaxed">
          Tham gia cùng hơn 10.000 phụ huynh đang dùng EduNest để theo dõi và hỗ trợ
          con học tập hiệu quả hơn mỗi ngày.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="w-full sm:w-auto bg-white text-primary font-bold text-base px-8 py-3.5 rounded-btn hover:bg-white/90 transition-colors shadow-lg"
          >
            Đăng ký miễn phí ngay →
          </Link>
          <a
            href="mailto:hello@edunest.vn"
            className="w-full sm:w-auto border border-white/40 text-white font-semibold text-base px-8 py-3.5 rounded-btn hover:bg-white/10 transition-colors"
          >
            Liên hệ đội ngũ
          </a>
        </div>
        <p className="text-white/50 text-sm mt-6">Miễn phí 14 ngày · Không cần thẻ tín dụng · Hủy bất cứ lúc nào</p>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer id="about" className="bg-gray-900 text-gray-400 py-14">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🎓</span>
              <span className="font-display font-extrabold text-xl text-white">EduNest</span>
            </div>
            <p className="text-sm leading-relaxed max-w-sm">
              Nền tảng theo dõi học tập AI-powered cho gia đình K-12 Việt Nam.
              Kết nối phụ huynh, giáo viên và nhà trường trong một hệ sinh thái số.
            </p>
            <p className="text-xs mt-4 text-gray-600">
              © 2026 EduNest Vietnam. Bảo lưu mọi quyền.
            </p>
          </div>

          <div>
            <p className="text-white font-semibold text-sm mb-4">Sản phẩm</p>
            <ul className="space-y-2 text-sm">
              {['PID Dashboard', 'Học Vị', 'EduCoach AI', 'Tính năng', 'Bảng giá'].map((item) => (
                <li key={item}><a href="#" className="hover:text-white transition-colors">{item}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-white font-semibold text-sm mb-4">Công ty</p>
            <ul className="space-y-2 text-sm">
              {['Về chúng tôi', 'Blog', 'Tuyển dụng', 'Chính sách bảo mật', 'Điều khoản sử dụng'].map((item) => (
                <li key={item}><a href="#" className="hover:text-white transition-colors">{item}</a></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs">Made with ❤️ in Vietnam · Hà Nội, Việt Nam</p>
          <div className="flex items-center gap-6 text-xs">
            <a href="mailto:hello@edunest.vn" className="hover:text-white transition-colors">hello@edunest.vn</a>
            <a href="tel:+84" className="hover:text-white transition-colors">Hotline: 1800 xxxx</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <main className="font-body">
      <Navbar />
      <Hero />
      <Reveal><SocialProof /></Reveal>
      <Reveal><Features /></Reveal>
      <Reveal><HowItWorks /></Reveal>
      <Reveal><Pricing /></Reveal>
      <Reveal><Testimonials /></Reveal>
      <Reveal><CTA /></Reveal>
      <Reveal><Footer /></Reveal>
    </main>
  )
}
