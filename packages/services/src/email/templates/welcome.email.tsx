// @ts-nocheck
import { Html, Body, Container, Heading, Text, Button, Hr } from '@react-email/components'

interface WelcomeEmailProps {
  fullName: string
  loginUrl: string
}

export function WelcomeEmail({ fullName, loginUrl }: WelcomeEmailProps) {
  return (
    <Html lang="vi">
      <Body style={{ fontFamily: 'DM Sans, sans-serif', background: '#f9fafb' }}>
        <Container style={{ maxWidth: 560, margin: '40px auto', background: '#fff', borderRadius: 12, padding: 40 }}>
          <Heading style={{ color: '#1D9E75', fontSize: 24 }}>Chào mừng đến với EduNest! 🎓</Heading>
          <Text>Xin chào {fullName},</Text>
          <Text>
            Tài khoản của bạn đã được tạo thành công. Bắt đầu theo dõi hành trình học tập của con ngay hôm nay.
          </Text>
          <Button
            href={loginUrl}
            style={{ background: '#1D9E75', color: '#fff', padding: '12px 24px', borderRadius: 20, display: 'inline-block', textDecoration: 'none' }}
          >
            Đăng nhập ngay
          </Button>
          <Hr />
          <Text style={{ color: '#9ca3af', fontSize: 12 }}>
            Nếu bạn không đăng ký tài khoản này, hãy bỏ qua email này.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
