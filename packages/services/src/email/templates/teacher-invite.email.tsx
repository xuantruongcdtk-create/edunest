import { Html, Body, Container, Heading, Text, Button, Hr } from '@react-email/components'

interface TeacherInviteEmailProps {
  teacherName: string
  schoolName: string
  inviteUrl: string
  inviterName: string
}

export function TeacherInviteEmail({ teacherName, schoolName, inviteUrl, inviterName }: TeacherInviteEmailProps) {
  return (
    <Html lang="vi">
      <Body style={{ fontFamily: 'DM Sans, sans-serif', background: '#f9fafb' }}>
        <Container style={{ maxWidth: 560, margin: '40px auto', background: '#fff', borderRadius: 12, padding: 40 }}>
          <Heading style={{ color: '#185FA5', fontSize: 22 }}>Lời mời tham gia EduNest</Heading>
          <Text>Xin chào {teacherName},</Text>
          <Text>
            <strong>{inviterName}</strong> từ trường <strong>{schoolName}</strong> đã mời bạn
            tham gia EduNest để quản lý lớp học và theo dõi tiến độ học sinh.
          </Text>
          <Button
            href={inviteUrl}
            style={{ background: '#185FA5', color: '#fff', padding: '12px 24px', borderRadius: 20, display: 'inline-block', textDecoration: 'none' }}
          >
            Chấp nhận lời mời
          </Button>
          <Hr />
          <Text style={{ color: '#9ca3af', fontSize: 12 }}>
            Link có hiệu lực trong 7 ngày. Nếu bạn không biết về lời mời này, hãy bỏ qua email.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
