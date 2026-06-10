import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt     = 'EduNest — Nền tảng theo dõi học tập AI'
export const size    = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1E5C32 0%, #1D9E75 60%, #0D7A56 100%)',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Decorative circles */}
        <div style={{ position:'absolute', top:-80, right:-80, width:320, height:320, borderRadius:'50%', background:'rgba(255,255,255,0.06)', display:'flex' }} />
        <div style={{ position:'absolute', bottom:-60, left:-60, width:240, height:240, borderRadius:'50%', background:'rgba(255,255,255,0.04)', display:'flex' }} />

        {/* Logo icon block */}
        <div style={{ display:'flex', alignItems:'center', gap:28, marginBottom:32 }}>
          {/* Icon circle */}
          <div style={{
            width: 120, height: 120, borderRadius:'50%',
            background: '#1E5C32',
            border: '3px solid #4A8C5C',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 0 6px rgba(255,255,255,0.12)',
          }}>
            <svg width="72" height="72" viewBox="0 0 32 32">
              <polyline points="7,13 16,7 25,13" fill="none" stroke="#8FBF7A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <polygon points="16,8.5 16.45,9.9 17.9,9.9 16.75,10.75 17.2,12.15 16,11.3 14.8,12.15 15.25,10.75 14.1,9.9 15.55,9.9" fill="#8FBF7A"/>
              <path d="M11 15.5 Q11 14.5 12 14.5 L15.5 15 L15.5 21 Q13 20 11 21 Z" fill="#C8B86A" fillOpacity="0.9"/>
              <path d="M21 15.5 Q21 14.5 20 14.5 L16.5 15 L16.5 21 Q19 20 21 21 Z" fill="#C8B86A" fillOpacity="0.75"/>
              <path d="M9 20 Q10 23 16 23 Q22 23 23 20" fill="none" stroke="#D4835A" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M10 21.5 Q11 25 16 25 Q21 25 22 21.5" fill="none" stroke="#3A6A9A" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </div>

          {/* Wordmark */}
          <div style={{ display:'flex', flexDirection:'column' }}>
            <span style={{ fontSize:72, fontWeight:800, color:'#E8D9A0', letterSpacing:'-2px', lineHeight:1 }}>
              EduNest
            </span>
            <span style={{ fontSize:22, fontWeight:400, color:'rgba(255,255,255,0.7)', letterSpacing:'6px', marginTop:6 }}>
              VIETNAM
            </span>
          </div>
        </div>

        {/* Tagline */}
        <div style={{
          fontSize: 28,
          color: 'rgba(255,255,255,0.85)',
          textAlign: 'center',
          maxWidth: 700,
          lineHeight: 1.4,
        }}>
          Nền tảng theo dõi học tập AI cho phụ huynh và giáo viên
        </div>

        {/* Feature pills */}
        <div style={{ display:'flex', gap:16, marginTop:40 }}>
          {['AI Coaching', 'Báo cáo tuần', 'Quiz thông minh', 'Cảnh báo sớm'].map((label) => (
            <div key={label} style={{
              padding: '8px 20px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.25)',
              color: 'white',
              fontSize: 18,
            }}>
              {label}
            </div>
          ))}
        </div>

        {/* URL watermark */}
        <div style={{
          position: 'absolute', bottom: 32, right: 48,
          fontSize: 18, color: 'rgba(255,255,255,0.45)',
        }}>
          edunest.vn
        </div>
      </div>
    ),
    { ...size }
  )
}
