import { getServerClient, assertNoError } from '@edunest/db'
import type { Alert, AlertType, AlertSeverity, LearningDNA, SubjectScore } from '@edunest/types'

interface AlertInput {
  userId: string
  childId: string
  childName: string
  dna: LearningDNA
  subjectScores: SubjectScore[]
}

/** Derives alerts from LearningDNA + SubjectScores; persists new ones. */
export async function generateAlerts(input: AlertInput): Promise<Alert[]> {
  const candidates = buildCandidates(input)
  if (!candidates.length) return []

  const db = await getServerClient()
  const { data, error } = await (db as any)
    .from('alerts')
    .insert(
      candidates.map((c) => ({
        user_id:   input.userId,
        child_id:  input.childId,
        type:      c.type,
        severity:  c.severity,
        title:     c.title,
        body:      c.body,
        is_read:   false,
      })),
    )
    .select()
  assertNoError(error)
  return (data ?? []) as Alert[]
}

// ─── Alert candidates ─────────────────────────────────────────────────────────

function buildCandidates(input: AlertInput) {
  const alerts: Array<{ type: AlertType; severity: AlertSeverity; title: string; body: string }> = []
  const { dna, subjectScores, childName } = input

  if (dna.burnout_risk === 'high') {
    alerts.push({
      type:     'burnout_risk',
      severity: 'danger',
      title:    `${childName} có nguy cơ kiệt sức cao`,
      body:     `Điểm số không ổn định và có xu hướng giảm. Hãy nói chuyện với con và giáo viên.`,
    })
  } else if (dna.burnout_risk === 'medium') {
    alerts.push({
      type:     'burnout_risk',
      severity: 'warning',
      title:    `Cần chú ý sức học của ${childName}`,
      body:     `Mức độ ổn định học tập đang ở mức trung bình. Theo dõi thêm trong 2 tuần tới.`,
    })
  }

  for (const s of subjectScores) {
    if (s.trend <= -1.5) {
      alerts.push({
        type:     'score_drop',
        severity: s.trend <= -3 ? 'danger' : 'warning',
        title:    `Điểm ${s.subject} của ${childName} đang giảm`,
        body:     `Giảm ${Math.abs(s.trend).toFixed(1)} điểm so với lần trước. Trung bình hiện tại: ${s.average}.`,
      })
    }
  }

  return alerts
}
