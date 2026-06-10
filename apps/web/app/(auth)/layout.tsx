import type { ReactNode } from 'react'
import Link from 'next/link'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-primary-darker flex-col justify-between p-12 text-white">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🎓</span>
          <span className="font-display font-extrabold text-2xl">EduNest</span>
        </Link>

        <div>
          <h2 className="font-display font-extrabold text-4xl leading-tight mb-4">
            Đồng hành cùng con<br />trên hành trình học tập
          </h2>
          <p className="text-white/70 text-lg mb-10">
            Theo dõi, phân tích và hỗ trợ việc học của con bằng sức mạnh AI.
          </p>

          <ul className="space-y-4">
            {[
              { icon: '📊', text: 'Theo dõi điểm số theo thời gian thực' },
              { icon: '🤖', text: 'AI Coach cá nhân hóa cho từng học sinh' },
              { icon: '🔔', text: 'Cảnh báo sớm khi học lực giảm sút' },
              { icon: '🧬', text: 'Learning DNA — hiểu phong cách học của con' },
            ].map(({ icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-white/90">
                <span className="text-xl w-8 flex-shrink-0">{icon}</span>
                <span className="text-base">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-white/40 text-sm">© 2026 EduNest Vietnam</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gray-50">
        {/* Mobile logo */}
        <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
          <span className="text-xl">🎓</span>
          <span className="font-display font-extrabold text-xl text-primary">EduNest</span>
        </Link>

        <div className="w-full max-w-sm">
          {children}
        </div>
      </div>
    </div>
  )
}
