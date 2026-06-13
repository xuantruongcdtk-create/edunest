import type { Subject } from '@edunest/types'

export const SUBJECT_VI: Record<Subject, string> = {
  math: 'Toán',
  literature: 'Văn',
  english: 'Anh',
  physics: 'Lý',
  chemistry: 'Hóa',
  biology: 'Sinh',
  history: 'Sử',
  geography: 'Địa',
  civics: 'GDCD',
  informatics: 'Tin học',
}

export function subjectLabel(s: string): string {
  return SUBJECT_VI[s as Subject] ?? s
}

export const PERIOD_VI: Record<string, string> = {
  weekly: '15 phút',
  monthly: '45 phút',
  semester: 'Học kỳ',
}

/** Normalize a raw score against its scale to a /10 value. */
export function toTen(score: number, maxScore: number): number {
  if (!maxScore) return score
  return Math.round((score / maxScore) * 10 * 10) / 10
}

export function formatVnd(n: number): string {
  return n.toLocaleString('vi-VN') + 'đ'
}

export function initials(name: string): string {
  return (name?.trim()?.charAt(0) ?? '?').toUpperCase()
}
