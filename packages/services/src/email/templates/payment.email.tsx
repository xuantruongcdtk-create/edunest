// @ts-nocheck
import { Html, Body, Container, Heading, Text, Hr } from '@react-email/components'

interface PaymentEmailProps {
  fullName: string
  planName: string
  amountVnd: number
  expiresAt: string
  transactionId: string
}

export function PaymentSuccessEmail({ fullName, planName, amountVnd, expiresAt, transactionId }: PaymentEmailProps) {
  const formatted = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amountVnd)

  return (
    <Html lang="vi">
      <Body style={{ fontFamily: 'DM Sans, sans-serif', background: '#f9fafb' }}>
        <Container style={{ maxWidth: 560, margin: '40px auto', background: '#fff', borderRadius: 12, padding: 40 }}>
          <Heading style={{ color: '#1D9E75', fontSize: 22 }}>✅ Thanh toán thành công</Heading>
          <Text>Xin chào {fullName},</Text>
          <Text>Gói <strong>{planName}</strong> đã được kích hoạt cho tài khoản của bạn.</Text>
          <table style={{ width: '100%', borderCollapse: 'collapse', margin: '16px 0' }}>
            <tbody>
              <tr><td style={{ padding: '8px 0', color: '#6b7280' }}>Số tiền</td><td style={{ textAlign: 'right' }}>{formatted}</td></tr>
              <tr><td style={{ padding: '8px 0', color: '#6b7280' }}>Hết hạn</td><td style={{ textAlign: 'right' }}>{expiresAt}</td></tr>
              <tr><td style={{ padding: '8px 0', color: '#6b7280' }}>Mã GD</td><td style={{ textAlign: 'right', fontSize: 12 }}>{transactionId}</td></tr>
            </tbody>
          </table>
          <Hr />
          <Text style={{ color: '#9ca3af', fontSize: 12 }}>EduNest — Nền tảng học tập thông minh cho gia đình Việt</Text>
        </Container>
      </Body>
    </Html>
  )
}
