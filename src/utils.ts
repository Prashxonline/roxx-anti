export function parseDeviceInfo(raw?: string): Record<string, string> {
  if (!raw) return {}
  const result: Record<string, string> = {}
  const lines = raw.split('\n')
  for (const line of lines) {
    const idx = line.indexOf(':')
    if (idx > 0) {
      const key = line.slice(0, idx).trim()
      const val = line.slice(idx + 1).trim()
      if (key && val) result[key] = val
    }
  }
  return result
}

export function deviceModel(d: any): string {
  if (d.d_name) return d.d_name
  const info = parseDeviceInfo(d.device_info)
  return info['Model'] || d.device_info || 'Unknown'
}

export function timeAgo(ts?: string | number): string {
  if (!ts) return ''
  const sec = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
  if (sec < 5) return 'just now'
  if (sec < 60) return sec + 's ago'
  if (sec < 3600) return Math.floor(sec / 60) + 'm ago'
  if (sec < 86400) return Math.floor(sec / 3600) + 'h ago'
  return Math.floor(sec / 86400) + 'd ago'
}
