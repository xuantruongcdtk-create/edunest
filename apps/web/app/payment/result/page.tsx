'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function ResultInner() {
  const sp = useSearchParams()

  // MoMo: resultCode=0 thành công · VNPAY: vnp_ResponseCode=00 thành công
  const momoCode  = sp.get('resultCode')
  const vnpCode   = sp.get('vnp_ResponseCode')
  const success   = momoCode === '0' || vnpCode === '00'
  const failed    = (momoCode != null && momoCode !== '0') || (vnpCode != null && vnpCode !== '00')

  const cfg = success
    ? { icon: '✅', title: 'Thanh toán thành công!', desc: 'Gói của bạn đang được kích hoạt — chỉ trong giây lát. Vào trang quản lý gói để kiểm tra.', color: 'text-success', bg: 'bg-success/10' }
    : failed
      ? { icon: '❌', title: 'Thanh toán chưa hoàn tất', desc: 'Giao dịch bị huỷ hoặc thất bại. Bạn có thể thử lại từ trang quản lý gói.', color: 'text-danger', bg: 'bg-danger/10' }
      : { icon: '⏳', title: 'Đang xử lý thanh toán', desc: 'Nếu bạn đã thanh toán, gói sẽ được kích hoạt sau ít phút. Kiểm tra ở trang quản lý gói.', color: 'text-warning', bg: 'bg-warning/10' }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-card shadow-card p-8 max-w-md w-full text-center">
        <div className={`h-16 w-16 rounded-full ${cfg.bg} flex items-center justify-center mx-auto mb-4`}>
          <span className="text-4xl">{cfg.icon}</span>
        </div>
        <h1 className={`font-display font-bold text-xl mb-2 ${cfg.color}`}>{cfg.title}</h1>
        <p className="text-sm text-gray-500 mb-6">{cfg.desc}</p>
        <div className="flex gap-3 justify-center">
          <Link href="/settings/billing"
            className="bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-btn hover:bg-primary-dark transition-colors">
            Trang quản lý gói
          </Link>
          <Link href="/dashboard"
            className="border border-gray-200 text-gray-600 text-sm font-medium px-5 py-2.5 rounded-btn hover:bg-gray-50 transition-colors">
            Về trang chính
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function PaymentResultPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400">Đang tải...</div>}>
      <ResultInner />
    </Suspense>
  )
}
