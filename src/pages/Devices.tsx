import { useState } from 'react'
import { deviceModel } from '../utils'

const SVG = ({ path, size = 14 }: { path: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={path} />
  </svg>
)

export default function Devices({ devices, onDeviceClick }: { devices: any[]; onDeviceClick: (id: string) => void }) {
  const [search, setSearch] = useState('')

  const filtered = devices.filter(d =>
    d.id?.toLowerCase().includes(search.toLowerCase()) ||
    (d.d_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.device_info || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="search-bar">
        <span className="search-icon"><SVG path="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM21 21l-4.35-4.35" size={15}/></span>
        <input type="text" placeholder="Search devices..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="device-list">
        {filtered.map((d, i) => (
          <div key={d.id} className="device-card" onClick={() => onDeviceClick(d.id)}>
            <div className="device-top">
              <div className="device-model">#{i + 1} {deviceModel(d)}</div>
              <span className={`online-badge ${d.status === 'online' ? 'on' : 'off'}`}>
                <span className="dot"></span>{d.status === 'online' ? 'Online' : 'Offline'}
              </span>
            </div>
            <div className="device-meta">
              <span><SVG path="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9M18 14h.01"/> {d.id?.slice(0, 16)}...</span>
              <span><SVG path="M1 9l4-4-4-4"/> {d.battery || 0}%</span>
              <span><SVG path="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/> {d.installTime || d.last_seen || 'Never'}</span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="empty">
            <div className="empty-icon"><SVG path="M22 12h-4l-3 9L9 3l-3 9H2" size={48}/></div>
            <div className="empty-text">{search ? 'No devices match your search' : 'No devices registered'}</div>
          </div>
        )}
      </div>
    </div>
  )
}
