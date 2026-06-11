'use client'

import { useState, useEffect } from 'react'
import { useRouter }           from 'next/navigation'
import { getBrowserClient }    from '../../../../lib/supabase'

const GRADES = Array.from({ length: 12 }, (_, i) => i + 1)

const SUBJECTS = [
  { value: 'math',        label: 'Toán' },
  { value: 'literature',  label: 'Ngữ văn' },
  { value: 'english',     label: 'Tiếng Anh' },
  { value: 'physics',     label: 'Vật lý' },
  { value: 'chemistry',   label: 'Hóa học' },
  { value: 'biology',     label: 'Sinh học' },
  { value: 'history',     label: 'Lịch sử' },
  { value: 'geography',   label: 'Địa lý' },
  { value: 'civics',      label: 'GDCD' },
  { value: 'informatics', label: 'Tin học' },
]

interface Child { name: string; grade: number }

export default function OnboardingStep2() {
  const router = useRouter()

  const [role,    setRole]    = useState<string>('parent')
  const [children, setChildren] = useState<Child[]>([{ name: '', grade: 1 }])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  // Teacher fields
  const [subject,     setSubject]     = useState('math')
  const [schoolName,  setSchoolName]  = useState('')
  // BGH fields
  const [province,    setProvince]    = useState('Hà Nội')
  const [district,    setDistrict]    = useState('')

  useEffect(() => {
    async function loadRole() {
      const sb = getBrowserClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await sb
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      setRole((data as { role: string } | null)?.role ?? 'parent')
      setFetching(false)
    }
    loadRole()
  }, [router])

  function addChild() {
    if (children.length >= 4) return
    setChildren([...children, { name: '', grade: 1 }])
  }

  function removeChild(i: number) {
    setChildren(children.filter((_, idx) => idx !== i))
  }

  function updateChild(i: number, field: keyof Child, value: string | number) {
    setChildren(children.map((c, idx) => idx === i ? { ...c, [field]: value } : c))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (role === 'parent') {
      const valid = children.every((c) => c.name.trim())
      if (!valid) { setError('Vui lòng nhập tên cho tất cả học sinh.'); return }
    } else if (role === 'bgh') {
      if (!schoolName.trim()) { setError('Vui lòng nhập tên trường.'); return }
    } else {
      if (!subject) { setError('Vui lòng chọn môn dạy.'); return }
    }

    setLoading(true)
    const sb = getBrowserClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) { router.push('/login'); return }

    if (role === 'parent') {
      // Insert children
      const rows = children
        .filter((c) => c.name.trim())
        .map((c) => ({ parent_id: user.id, full_name: c.name.trim(), grade: c.grade }))

      const { error: insErr } = await sb.from('children').insert(rows)
      if (insErr) { setError('Không thể lưu thông tin. Thử lại nhé.'); setLoading(false); return }
    } else if (role === 'bgh') {
      // Tạo trường + liên kết vào profile (BGH dashboard cần school_id)
      const { data: school, error: schoolErr } = await (sb as any)
        .from('schools')
        .insert({
          name:     schoolName.trim(),
          province: province.trim() || 'Hà Nội',
          district: district.trim() || null,
        })
        .select('id')
        .single()

      if (schoolErr || !school) {
        setError('Không thể tạo trường. Thử lại nhé.'); setLoading(false); return
      }

      const { error: linkErr } = await sb
        .from('profiles')
        .update({ school_id: (school as { id: string }).id })
        .eq('id', user.id)

      if (linkErr) { setError('Không thể liên kết trường. Thử lại nhé.'); setLoading(false); return }
    } else {
      // Store teacher's primary subject + school in auth user_metadata
      // profiles has no dedicated subject column — user_metadata is correct for onboarding data
      const { error: metaErr } = await sb.auth.updateUser({
        data: {
          primary_subject: subject,
          school_name:     schoolName.trim() || null,
        },
      })
      if (metaErr) { setError('Không thể lưu thông tin. Thử lại nhé.'); setLoading(false); return }
    }

    setLoading(false)
    // BGH không cần bước đặt mục tiêu học tập (dành cho phụ huynh) → tới luôn bước hoàn tất
    router.push(role === 'bgh' ? '/onboarding/step-4' : '/onboarding/step-3')
  }

  if (fetching) {
    return (
      <div className="p-8">
        <div className="space-y-3 animate-pulse">
          <div className="h-4 bg-gray-100 rounded w-1/3" />
          <div className="h-24 bg-gray-100 rounded" />
          <div className="h-10 bg-gray-100 rounded mt-4" />
        </div>
      </div>
    )
  }

  const isTeacher = role === 'teacher'
  const isBgh     = role === 'bgh'

  const heading = isBgh
    ? 'Thông tin trường học'
    : isTeacher
      ? 'Thông tin giảng dạy'
      : 'Thêm học sinh'
  const subheading = isBgh
    ? 'Tạo hồ sơ trường để quản lý lớp và theo dõi toàn trường.'
    : isTeacher
      ? 'Cho chúng tôi biết bạn dạy môn gì và ở trường nào.'
      : 'Thêm thông tin con để bắt đầu theo dõi việc học.'

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="font-display font-extrabold text-2xl text-gray-900 mb-1">
          {heading}
        </h1>
        <p className="text-sm text-gray-500">
          {subheading}
        </p>
      </div>

      {error && (
        <div className="bg-danger/8 border border-danger/20 text-danger text-sm rounded-input px-3 py-2.5 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {isBgh ? (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Tên trường <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                required
                placeholder="THPT Chu Văn An"
                className="w-full border border-gray-200 rounded-input px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Tỉnh / Thành phố
                </label>
                <input
                  type="text"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  placeholder="Hà Nội"
                  className="w-full border border-gray-200 rounded-input px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Quận / Huyện <span className="text-gray-400 font-normal">(tuỳ chọn)</span>
                </label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="Cầu Giấy"
                  className="w-full border border-gray-200 rounded-input px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
              </div>
            </div>
          </>
        ) : isTeacher ? (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Môn dạy chính <span className="text-danger">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {SUBJECTS.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setSubject(s.value)}
                    className={`px-3.5 py-1.5 rounded-btn text-sm font-medium border transition-colors ${
                      subject === s.value
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-primary/50'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Tên trường <span className="text-gray-400 font-normal">(tuỳ chọn)</span>
              </label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="THPT Chu Văn An, THCS Nguyễn Du..."
                className="w-full border border-gray-200 rounded-input px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>
          </>
        ) : (
          <>
            {children.map((child, i) => (
              <div key={i} className="bg-gray-50 rounded-card p-4 space-y-3 relative">
                {children.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeChild(i)}
                    className="absolute top-3 right-3 text-gray-400 hover:text-danger transition-colors text-lg leading-none"
                    aria-label="Xóa"
                  >
                    ×
                  </button>
                )}

                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Con {i + 1}
                </p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên con</label>
                  <input
                    type="text"
                    value={child.name}
                    onChange={(e) => updateChild(i, 'name', e.target.value)}
                    required
                    placeholder="Nguyễn Văn B"
                    className="w-full border border-gray-200 rounded-input px-3.5 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lớp</label>
                  <select
                    value={child.grade}
                    onChange={(e) => updateChild(i, 'grade', Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-input px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors bg-white"
                  >
                    {GRADES.map((g) => (
                      <option key={g} value={g}>Lớp {g}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}

            {children.length < 4 && (
              <button
                type="button"
                onClick={addChild}
                className="w-full border-2 border-dashed border-gray-200 rounded-card py-3 text-sm text-gray-500 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
              >
                <span className="text-lg leading-none">+</span> Thêm con khác
              </button>
            )}
          </>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.push('/onboarding/step-1')}
            className="flex-1 border border-gray-200 text-gray-600 font-semibold text-sm py-2.5 rounded-btn hover:bg-gray-50 transition-colors"
          >
            ← Quay lại
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-primary text-white font-semibold text-sm py-2.5 rounded-btn hover:bg-primary-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
            {loading ? 'Đang lưu...' : 'Tiếp theo →'}
          </button>
        </div>
      </form>
    </div>
  )
}
