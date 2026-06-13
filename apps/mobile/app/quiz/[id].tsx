import { useCallback, useEffect, useRef, useState } from 'react'
import {
  View, Text, TextInput, StyleSheet, Pressable, ScrollView, Alert,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../../stores/auth.store'
import { useChildrenStore } from '../../stores/children.store'
import { supabase } from '../../lib/supabase'
import { apiFetch } from '../../lib/api'
import { subjectLabel, toTen } from '../../lib/format'
import { Loading, AppButton } from '../../components/ui'
import { colors, radius, spacing } from '../../lib/theme'

interface Question {
  id: string
  question_text: string
  question_type: 'mcq' | 'essay'
  options: string[]
  order_index: number
}
interface QuizDetail {
  id: string
  title: string
  subject: string
  time_limit_minutes: number
  questions: Question[]
}
interface AttemptDetail { type: 'mcq' | 'essay'; score: number; max: number; correct?: boolean; feedback?: string }
interface AttemptResult { score: number; max_score: number; details?: AttemptDetail[] }

type Phase = 'loading' | 'notfound' | 'nochild' | 'intro' | 'taking' | 'result'
const OPTS = ['A', 'B', 'C', 'D']

export default function QuizTake() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const userId = useAuthStore((s) => s.user?.id)
  const { children, activeId, load } = useChildrenStore()

  const [phase, setPhase] = useState<Phase>('loading')
  const [quiz, setQuiz] = useState<QuizDetail | null>(null)
  const [answers, setAnswers] = useState<(number | string | null)[]>([])
  const [currentQ, setCurrentQ] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [result, setResult] = useState<AttemptResult | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const startRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const activeChild = children.find((c) => c.id === activeId) ?? null

  useEffect(() => { if (userId && children.length === 0) void load(userId) }, [userId, children.length, load])

  useEffect(() => {
    async function loadQuiz() {
      if (!id) { setPhase('notfound'); return }
      const { data: q, error } = await supabase
        .from('quizzes')
        .select('id, title, subject, time_limit_minutes')
        .eq('id', id).eq('status', 'published').single()
      if (error || !q) { setPhase('notfound'); return }

      const { data: qs } = await supabase
        .from('quiz_questions')
        .select('id, question_text, question_type, options, order_index')
        .eq('quiz_id', id).order('order_index', { ascending: true })

      const questions = (qs ?? []) as Question[]
      setQuiz({ ...(q as any), questions })
      setAnswers(questions.map((qq) => (qq.question_type === 'essay' ? '' : null)))
      setPhase((p) => (p === 'loading' ? 'intro' : p))
    }
    void loadQuiz()
  }, [id])

  const handleSubmit = useCallback(async () => {
    if (!quiz || submitting) return
    if (timerRef.current) clearInterval(timerRef.current)
    if (!activeId) { setPhase('nochild'); return }
    setSubmitting(true)

    const timeTaken = Math.round((Date.now() - startRef.current) / 1000)
    const finalAnswers = quiz.questions.map((qq, i) =>
      qq.question_type === 'essay' ? String(answers[i] ?? '') : (answers[i] ?? 0))

    try {
      const data = await apiFetch<AttemptResult>('/api/v1/quiz/attempt', {
        method: 'POST',
        body: JSON.stringify({
          quizId: quiz.id,
          childId: activeId,
          answers: finalAnswers,
          timeTakenSeconds: timeTaken,
        }),
      })
      setResult(data)
      setPhase('result')
    } catch (e: any) {
      Alert.alert('Nộp bài thất bại', e?.message ?? 'Vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }, [quiz, submitting, activeId, answers])

  const startTimer = useCallback((minutes: number) => {
    startRef.current = Date.now()
    setTimeLeft(minutes * 60)
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(timerRef.current!); void handleSubmit(); return 0 }
        return t - 1
      })
    }, 1000)
  }, [handleSubmit])

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  function begin() {
    if (!activeId) { setPhase('nochild'); return }
    setPhase('taking')
    startTimer(quiz?.time_limit_minutes ?? 15)
  }

  const mmss = `${String(Math.floor(timeLeft / 60)).padStart(2, '0')}:${String(timeLeft % 60).padStart(2, '0')}`

  // ─── Render ────────────────────────────────────────────────────────────────
  const TopBar = ({ title }: { title: string }) => (
    <View style={[styles.topbar, { paddingTop: insets.top + spacing.sm }]}>
      <Pressable onPress={() => router.back()} hitSlop={10}><Ionicons name="close" size={24} color={colors.text} /></Pressable>
      <Text style={styles.topTitle} numberOfLines={1}>{title}</Text>
      {phase === 'taking' ? <Text style={styles.timer}>⏱ {mmss}</Text> : <View style={{ width: 24 }} />}
    </View>
  )

  if (phase === 'loading') return <><TopBar title="Bài kiểm tra" /><Loading /></>
  if (phase === 'notfound') return (
    <View style={styles.center}><TopBar title="Bài kiểm tra" /><Text style={styles.muted}>Không tìm thấy bài kiểm tra.</Text></View>
  )
  if (phase === 'nochild') return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopBar title="Bài kiểm tra" />
      <View style={styles.center}><Text style={styles.muted}>Hãy thêm hồ sơ con trước khi làm bài.</Text></View>
    </View>
  )

  if (phase === 'intro' && quiz) return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <TopBar title={quiz.title} />
      <ScrollView contentContainerStyle={styles.introBody}>
        <Text style={styles.introTitle}>{quiz.title}</Text>
        <Text style={styles.muted}>{subjectLabel(quiz.subject)} · {quiz.questions.length} câu · {quiz.time_limit_minutes} phút</Text>
        {activeChild && <Text style={styles.childNote}>Người làm: <Text style={{ fontWeight: '700' }}>{activeChild.full_name}</Text></Text>}
        <View style={{ height: spacing.lg }} />
        <AppButton title="Bắt đầu làm bài" onPress={begin} />
      </ScrollView>
    </View>
  )

  if (phase === 'result' && result) {
    const ten = toTen(result.score, result.max_score)
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <TopBar title="Kết quả" />
        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.scoreCard}>
            <Text style={styles.scoreBig}>{ten}<Text style={styles.scoreMax}>/10</Text></Text>
            <Text style={styles.muted}>{result.score}/{result.max_score} điểm</Text>
          </View>
          {(result.details ?? []).map((d, i) => (
            <View key={i} style={styles.detailRow}>
              <Text style={styles.detailQ}>Câu {i + 1}</Text>
              {d.type === 'mcq' ? (
                <Text style={{ color: d.correct ? colors.success : colors.danger, fontWeight: '700' }}>
                  {d.correct ? '✓ Đúng' : '✗ Sai'}
                </Text>
              ) : (
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.accent, fontWeight: '700' }}>Tự luận: {d.score}/{d.max}</Text>
                  {d.feedback ? <Text style={styles.feedback}>{d.feedback}</Text> : null}
                </View>
              )}
            </View>
          ))}
          <View style={{ height: spacing.lg }} />
          <AppButton title="Xong" onPress={() => router.back()} />
        </ScrollView>
      </View>
    )
  }

  // taking
  if (phase === 'taking' && quiz) {
    const q = quiz.questions[currentQ]
    const isLast = currentQ === quiz.questions.length - 1
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <TopBar title={`Câu ${currentQ + 1}/${quiz.questions.length}`} />
        <ScrollView contentContainerStyle={styles.body}>
          <Text style={styles.questionText}>{q.question_text}</Text>

          {q.question_type === 'essay' ? (
            <TextInput
              value={String(answers[currentQ] ?? '')}
              onChangeText={(t) => setAnswers((a) => { const n = [...a]; n[currentQ] = t; return n })}
              placeholder="Nhập câu trả lời…"
              placeholderTextColor={colors.textFaint}
              multiline
              style={styles.essay}
            />
          ) : (
            q.options.map((opt, oi) => {
              const selected = answers[currentQ] === oi
              return (
                <Pressable
                  key={oi}
                  onPress={() => setAnswers((a) => { const n = [...a]; n[currentQ] = oi; return n })}
                  style={[styles.option, selected && styles.optionSel]}
                >
                  <View style={[styles.optBadge, selected && styles.optBadgeSel]}>
                    <Text style={[styles.optBadgeText, selected && { color: '#fff' }]}>{OPTS[oi]}</Text>
                  </View>
                  <Text style={[styles.optText, selected && { color: colors.primary, fontWeight: '600' }]}>{opt}</Text>
                </Pressable>
              )
            })
          )}
        </ScrollView>

        <View style={[styles.navBar, { paddingBottom: insets.bottom + spacing.sm }]}>
          <Pressable
            onPress={() => setCurrentQ((c) => Math.max(0, c - 1))}
            disabled={currentQ === 0}
            style={[styles.navBtn, currentQ === 0 && { opacity: 0.4 }]}
          >
            <Text style={styles.navText}>Trước</Text>
          </Pressable>
          {isLast ? (
            <Pressable onPress={() => void handleSubmit()} disabled={submitting} style={[styles.navBtn, styles.navPrimary]}>
              <Text style={[styles.navText, { color: '#fff' }]}>{submitting ? 'Đang nộp…' : 'Nộp bài'}</Text>
            </Pressable>
          ) : (
            <Pressable onPress={() => setCurrentQ((c) => Math.min(quiz.questions.length - 1, c + 1))} style={[styles.navBtn, styles.navPrimary]}>
              <Text style={[styles.navText, { color: '#fff' }]}>Tiếp</Text>
            </Pressable>
          )}
        </View>
      </View>
    )
  }

  return <Loading />
}

const styles = StyleSheet.create({
  topbar: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.md, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.borderLt },
  topTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text },
  timer: { fontSize: 14, fontWeight: '700', color: colors.danger },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, padding: spacing.xl },
  muted: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  body: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl * 2 },
  introBody: { padding: spacing.xl, alignItems: 'center', gap: spacing.sm },
  introTitle: { fontSize: 22, fontWeight: '800', color: colors.text, textAlign: 'center' },
  childNote: { fontSize: 14, color: colors.textMuted, marginTop: spacing.md },
  questionText: { fontSize: 17, fontWeight: '600', color: colors.text, lineHeight: 24, marginBottom: spacing.sm },
  essay: { minHeight: 140, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.input, padding: spacing.md, fontSize: 15, color: colors.text, textAlignVertical: 'top' },
  option: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, padding: spacing.md },
  optionSel: { borderColor: colors.primary, backgroundColor: colors.primary + '0D' },
  optBadge: { height: 28, width: 28, borderRadius: 14, backgroundColor: colors.borderLt, alignItems: 'center', justifyContent: 'center' },
  optBadgeSel: { backgroundColor: colors.primary },
  optBadgeText: { fontWeight: '700', color: colors.textMuted },
  optText: { flex: 1, fontSize: 15, color: colors.text },
  navBar: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderLt, backgroundColor: colors.card },
  navBtn: { flex: 1, height: 48, borderRadius: radius.btn, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  navPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
  navText: { fontSize: 15, fontWeight: '700', color: colors.text },
  scoreCard: { alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.card, padding: spacing.xl, borderWidth: 1, borderColor: colors.borderLt },
  scoreBig: { fontSize: 44, fontWeight: '800', color: colors.primary },
  scoreMax: { fontSize: 20, color: colors.textFaint, fontWeight: '600' },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, backgroundColor: colors.card, borderRadius: radius.card, padding: spacing.md, borderWidth: 1, borderColor: colors.borderLt },
  detailQ: { fontSize: 14, fontWeight: '700', color: colors.text, width: 56 },
  feedback: { fontSize: 13, color: colors.textMuted, marginTop: 4, lineHeight: 18 },
})
