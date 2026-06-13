import { cn } from '../../lib/cn'

export interface GuideSection {
  icon:    string
  title:   string
  summary: string
  steps:   string[]
  tip?:    string
}

interface FeatureGuideProps {
  title:    string
  subtitle: string
  intro:    string
  accent?:  'primary' | 'bgh'
  sections: GuideSection[]
}

const ACCENT = {
  primary: { chip: 'bg-primary/8 text-primary',   num: 'bg-primary/10 text-primary' },
  bgh:     { chip: 'bg-bgh-blue/8 text-bgh-blue', num: 'bg-bgh-blue/10 text-bgh-blue' },
} as const

export function FeatureGuide({ title, subtitle, intro, accent = 'primary', sections }: FeatureGuideProps) {
  const a = ACCENT[accent]

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4">
        <h1 className="font-display font-bold text-xl text-gray-900">{title}</h1>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>

      <div className="p-6 max-w-3xl w-full mx-auto space-y-4">
        <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-card p-4 border border-gray-100">
          {intro}
        </p>

        {sections.map((s, i) => (
          <details
            key={s.title}
            open={i === 0}
            className="group bg-white rounded-card shadow-card overflow-hidden"
          >
            <summary className="flex items-center gap-3 px-5 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden hover:bg-gray-50 transition-colors">
              <span className={cn('flex-shrink-0 h-9 w-9 rounded-xl flex items-center justify-center text-lg', a.chip)}>
                {s.icon}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-gray-900 text-sm">{s.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{s.summary}</p>
              </div>
              <span className="text-gray-400 text-sm transition-transform group-open:rotate-180">▾</span>
            </summary>

            <div className="px-5 pb-5 pt-1 border-t border-gray-50">
              <ol className="space-y-2.5 mt-3">
                {s.steps.map((step, idx) => (
                  <li key={idx} className="flex gap-3 text-sm text-gray-700 leading-relaxed">
                    <span className={cn(
                      'flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center text-[11px] font-bold mt-0.5',
                      a.num,
                    )}>
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              {s.tip && (
                <p className="mt-4 text-xs text-gray-600 bg-warning/8 border border-warning/15 rounded-lg px-3 py-2 leading-relaxed">
                  💡 <span className="font-medium">Mẹo:</span> {s.tip}
                </p>
              )}
            </div>
          </details>
        ))}

        <div className="text-center text-sm text-gray-500 pt-4">
          Cần hỗ trợ thêm? Liên hệ{' '}
          <a href="mailto:hello@edunest.vn" className="text-primary font-semibold hover:underline">
            hello@edunest.vn
          </a>
        </div>
      </div>
    </div>
  )
}
