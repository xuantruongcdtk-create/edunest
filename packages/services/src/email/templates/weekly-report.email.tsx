// @ts-nocheck
import { Html, Body, Container, Heading, Text, Hr } from '@react-email/components'
import type { WeeklySummary } from '@edunest/types'

interface WeeklyReportEmailProps {
  parentName: string
  childName: string
  summary: WeeklySummary
  dashboardUrl: string
}

export function WeeklyReportEmail({ parentName, childName, summary, dashboardUrl }: WeeklyReportEmailProps) {
  const topSubjects = summary.subject_scores
    .sort((a, b) => b.average - a.average)
    .slice(0, 3)

  return (
    <Html lang="vi">
      <Body style={{ fontFamily: 'DM Sans, sans-serif', background: '#f9fafb' }}>
        <Container style={{ maxWidth: 560, margin: '40px auto', background: '#fff', borderRadius: 12, padding: 40 }}>
          <Heading style={{ color: '#1D9E75', fontSize: 22 }}>📊 Báo cáo tuần của {childName}</Heading>
          <Text>Xin chào {parentName},</Text>
          {summary.ai_insight && (
            <Text style={{ background: '#f0fdf4', borderLeft: '4px solid #1D9E75', padding: '12px 16px', borderRadius: 6 }}>
              {summary.ai_insight}
            </Text>
          )}
          <Heading as="h3" style={{ fontSize: 16, marginTop: 24 }}>Môn học nổi bật</Heading>
          {topSubjects.map((s) => (
            <Text key={s.subject}>
              • <strong>{s.subject}</strong>: {s.average} điểm
              {s.trend > 0 ? ` ↑ +${s.trend}` : s.trend < 0 ? ` ↓ ${s.trend}` : ''}
            </Text>
          ))}
          <Hr />
          <Text>
            <a href={dashboardUrl} style={{ color: '#1D9E75' }}>Xem chi tiết trên EduNest →</a>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
