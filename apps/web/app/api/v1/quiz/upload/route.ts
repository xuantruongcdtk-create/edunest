import { getServerClient } from '@edunest/db'
import { generateText, generateFromFile, AI_MODEL } from '@edunest/ai'
import { ok, withHandler, UnauthorizedError, ValidationError } from '@edunest/core'
import * as XLSX from 'xlsx'

interface ParsedQuestion {
  question_type: 'mcq' | 'essay'
  question_text: string
  options: string[]
  correct_index: number | null
  sample_answer: string | null
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

function isEssayType(raw: unknown): boolean {
  const s = String(raw ?? '').trim().toLowerCase()
  return s.includes('tự luận') || s.includes('tu luan') || s === 'essay' || s === 'tl'
}

// Chuẩn hoá câu hỏi do AI trả về (Word/PDF) về đúng shape ParsedQuestion
function normalizeAIQuestions(arr: any[]): ParsedQuestion[] {
  return (arr ?? []).map((q): ParsedQuestion => {
    const essay = q.question_type === 'essay' || (!q.options || q.options.length < 2)
    return {
      question_type: essay ? 'essay' : 'mcq',
      question_text: String(q.question_text ?? '').trim(),
      options:       essay ? [] : (q.options ?? []),
      correct_index: essay ? null : (typeof q.correct_index === 'number' ? q.correct_index : 0),
      sample_answer: essay ? (q.sample_answer ?? q.explanation ?? null) : null,
      explanation:   q.explanation ?? null,
    }
  }).filter((q) => q.question_text)
}

const AI_PARSE_INSTRUCTION = `Trích xuất TẤT CẢ câu hỏi (cả trắc nghiệm và tự luận). Trả về JSON hợp lệ, KHÔNG kèm chữ nào khác:
{"title":"tên bài","questions":[
  {"question_type":"mcq","question_text":"...","options":["A. ...","B. ...","C. ...","D. ..."],"correct_index":0,"explanation":null},
  {"question_type":"essay","question_text":"...","sample_answer":"đáp án mẫu/tiêu chí chấm","explanation":null}
]}
correct_index là 0-3 (0=A). Câu không có lựa chọn A/B/C/D thì là "essay" và phải có sample_answer.`

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

    const typeRaw = row['Loại'] ?? row['Loại câu'] ?? row['type'] ?? row['LOẠI']
    const answerRaw = row['Đáp án'] ?? row['correct_index'] ?? row['Answer'] ?? row['ĐÁP ÁN'] ?? 'A'
    const explanation = String(row['Giải thích'] ?? row['explanation'] ?? row['GIẢI THÍCH'] ?? '').trim() || null

    const optA = String(row['A'] ?? row['Lựa chọn A'] ?? row['option_a'] ?? row['LỰA CHỌN A'] ?? '').trim()
    const optB = String(row['B'] ?? row['Lựa chọn B'] ?? row['option_b'] ?? row['LỰA CHỌN B'] ?? '').trim()
    const optC = String(row['C'] ?? row['Lựa chọn C'] ?? row['option_c'] ?? row['LỰA CHỌN C'] ?? '').trim()
    const optD = String(row['D'] ?? row['Lựa chọn D'] ?? row['option_d'] ?? row['LỰA CHỌN D'] ?? '').trim()
    const options = [optA, optB, optC, optD].filter(Boolean)

    // Tự luận: cột "Loại" = tự luận, HOẶC không có đủ lựa chọn
    if (isEssayType(typeRaw) || options.length < 2) {
      // Đáp án mẫu lấy từ cột "Đáp án mẫu"/"Đáp án"/"Giải thích"
      const sample = String(row['Đáp án mẫu'] ?? row['sample_answer'] ?? answerRaw ?? '').trim() || explanation
      questions.push({
        question_type: 'essay',
        question_text: questionText,
        options:       [],
        correct_index: null,
        sample_answer: sample || null,
        explanation,
      })
      continue
    }

    questions.push({
      question_type: 'mcq',
      question_text: questionText,
      options,
      correct_index: parseCorrectIndex(answerRaw),
      sample_answer: null,
      explanation,
    })
  }

  const title = sheetName && sheetName !== 'Sheet1' && sheetName !== 'Sheet 1'
    ? sheetName
    : `Bài kiểm tra từ file`

  return { title, questions }
}

async function parseWord(buffer: ArrayBuffer): Promise<{ title: string; questions: ParsedQuestion[] }> {
  const mammoth = await import('mammoth')
  const { value: text } = await mammoth.default.extractRawText({ buffer: Buffer.from(buffer) })

  if (!text.trim()) throw new ValidationError('File Word không có nội dung')

  const raw   = await generateText(`${AI_PARSE_INSTRUCTION}\n\nVăn bản:\n${text.slice(0, 8000)}`, AI_MODEL)
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new ValidationError('Không thể phân tích nội dung file Word. Kiểm tra format câu hỏi.')

  const parsed = JSON.parse(match[0]) as { title?: string; questions?: any[] }
  return {
    title:     parsed.title ?? 'Bài kiểm tra từ file',
    questions: normalizeAIQuestions(parsed.questions ?? []),
  }
}

async function parsePdf(buffer: ArrayBuffer): Promise<{ title: string; questions: ParsedQuestion[] }> {
  // Gemini đọc trực tiếp file PDF (không cần thư viện tách text)
  const base64 = Buffer.from(buffer).toString('base64')
  const raw    = await generateFromFile(base64, 'application/pdf', AI_PARSE_INSTRUCTION, AI_MODEL)
  const match  = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new ValidationError('Không thể phân tích nội dung file PDF. Kiểm tra lại file.')

  const parsed = JSON.parse(match[0]) as { title?: string; questions?: any[] }
  return {
    title:     parsed.title ?? 'Bài kiểm tra từ file',
    questions: normalizeAIQuestions(parsed.questions ?? []),
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
  } else if (fileName.endsWith('.pdf')) {
    parsed = await parsePdf(buffer)
  } else {
    throw new ValidationError('Chỉ hỗ trợ file .xlsx, .xls, .docx, .pdf')
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
    question_type: q.question_type,
    options:       q.options,
    correct_index: q.question_type === 'essay' ? null : (q.correct_index ?? 0),
    sample_answer: q.sample_answer,
    explanation:   q.explanation,
    order_index:   i,
  }))

  const { error: qse } = await (db as any).from('quiz_questions').insert(rows)
  if (qse) throw new Error(qse.message)

  return ok(quiz)
})
