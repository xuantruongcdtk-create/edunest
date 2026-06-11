import { getServerClient } from '@edunest/db'
import { generateText, AI_MODEL } from '@edunest/ai'
import { ok, withHandler, UnauthorizedError, ValidationError } from '@edunest/core'
import * as XLSX from 'xlsx'

interface ParsedQuestion {
  question_text: string
  options: string[]
  correct_index: number
  explanation: string | null
}

function parseCorrectIndex(raw: unknown): number {
  const s = String(raw ?? '').trim().toUpperCase()
  if (s === 'A' || s === '1') return 0
  if (s === 'B' || s === '2') return 1
  if (s === 'C' || s === '3') return 2
  if (s === 'D' || s === '4') return 3
  const n = parseInt(s)
  if (!isNaN(n) && n >= 0 && n <= 3) return n
  return 0
}

function parseExcel(buffer: ArrayBuffer): { title: string; questions: ParsedQuestion[] } {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet)

  const questions: ParsedQuestion[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const questionText = String(
      row['Câu hỏi'] ?? row['question_text'] ?? row['Question'] ?? row['CÂU HỎI'] ?? '',
    ).trim()
    if (!questionText) continue

    const optA = String(row['A'] ?? row['Lựa chọn A'] ?? row['option_a'] ?? row['LỰA CHỌN A'] ?? '').trim()
    const optB = String(row['B'] ?? row['Lựa chọn B'] ?? row['option_b'] ?? row['LỰA CHỌN B'] ?? '').trim()
    const optC = String(row['C'] ?? row['Lựa chọn C'] ?? row['option_c'] ?? row['LỰA CHỌN C'] ?? '').trim()
    const optD = String(row['D'] ?? row['Lựa chọn D'] ?? row['option_d'] ?? row['LỰA CHỌN D'] ?? '').trim()

    const options = [optA, optB, optC, optD].filter(Boolean)
    if (options.length < 2) continue

    const answerRaw   = row['Đáp án'] ?? row['correct_index'] ?? row['Answer'] ?? row['ĐÁP ÁN'] ?? 'A'
    const explanation = String(row['Giải thích'] ?? row['explanation'] ?? row['GIẢI THÍCH'] ?? '').trim() || null

    questions.push({
      question_text: questionText,
      options,
      correct_index: parseCorrectIndex(answerRaw),
      explanation,
    })
  }

  const title = sheetName && sheetName !== 'Sheet1' && sheetName !== 'Sheet 1'
    ? sheetName
    : `Bài kiểm tra từ file`

  return { title, questions }
}

async function parseWord(buffer: ArrayBuffer): Promise<{ title: string; questions: ParsedQuestion[] }> {
  // Dynamic import to avoid edge runtime issues
  const mammoth = await import('mammoth')
  const { value: text } = await mammoth.default.extractRawText({ buffer: Buffer.from(buffer) })

  if (!text.trim()) throw new ValidationError('File Word không có nội dung')

  const prompt = `Phân tích văn bản sau và trích xuất tất cả câu hỏi trắc nghiệm. Trả về JSON hợp lệ với cấu trúc:
{"title": "tên bài kiểm tra", "questions": [{"question_text": "nội dung câu hỏi", "options": ["A. lựa chọn 1", "B. lựa chọn 2", "C. lựa chọn 3", "D. lựa chọn 4"], "correct_index": 0, "explanation": null}]}
Trong đó correct_index là chỉ số 0-3 (0=A, 1=B, 2=C, 3=D). Chỉ trả về JSON, không giải thích thêm.

Văn bản:
${text.slice(0, 8000)}`

  const raw   = await generateText(prompt, AI_MODEL)
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new ValidationError('Không thể phân tích nội dung file Word. Kiểm tra format câu hỏi.')

  const parsed = JSON.parse(match[0]) as { title?: string; questions?: ParsedQuestion[] }
  return {
    title:     parsed.title ?? 'Bài kiểm tra từ file',
    questions: parsed.questions ?? [],
  }
}

export const POST = withHandler(async (req) => {
  const db = await getServerClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) throw new UnauthorizedError()

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    throw new ValidationError('Request phải là multipart/form-data')
  }

  const file              = formData.get('file') as File | null
  const subject           = (formData.get('subject') as string) || 'math'
  const grade             = Number(formData.get('grade')) || 10
  const difficulty        = (formData.get('difficulty') as string) || 'medium'
  const timeLimitMinutes  = Number(formData.get('timeLimitMinutes')) || 15
  const customTitle       = (formData.get('title') as string)?.trim()

  if (!file) throw new ValidationError('Vui lòng chọn file')

  const MAX_SIZE = 10 * 1024 * 1024 // 10MB
  if (file.size > MAX_SIZE) throw new ValidationError('File quá lớn (tối đa 10MB)')

  const fileName = file.name.toLowerCase()
  const buffer   = await file.arrayBuffer()

  let parsed: { title: string; questions: ParsedQuestion[] }

  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    parsed = parseExcel(buffer)
  } else if (fileName.endsWith('.docx')) {
    parsed = await parseWord(buffer)
  } else {
    throw new ValidationError('Chỉ hỗ trợ file .xlsx, .xls, .docx')
  }

  if (parsed.questions.length === 0) {
    throw new ValidationError(
      'Không tìm thấy câu hỏi nào. Kiểm tra lại format file (xem hướng dẫn bên dưới nút upload).'
    )
  }

  const title = customTitle || parsed.title

  const { data: quiz, error: qe } = await (db as any)
    .from('quizzes')
    .insert({
      teacher_id:         user.id,
      title,
      subject,
      grade,
      difficulty,
      status:             'draft',
      question_count:     parsed.questions.length,
      time_limit_minutes: timeLimitMinutes,
      ai_generated:       false,
    })
    .select()
    .single()

  if (qe) throw new Error(qe.message)

  const rows = parsed.questions.map((q, i) => ({
    quiz_id:       (quiz as { id: string }).id,
    question_text: q.question_text,
    options:       q.options,
    correct_index: q.correct_index,
    explanation:   q.explanation,
    order_index:   i,
  }))

  const { error: qse } = await (db as any).from('quiz_questions').insert(rows)
  if (qse) throw new Error(qse.message)

  return ok(quiz)
})
