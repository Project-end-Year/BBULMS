import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

// Make Pusher available globally so Laravel Echo can use it.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(window as any).Pusher = Pusher

type EchoInstance = Echo<'pusher'>

interface EchoContextValue {
  echo: EchoInstance | null
  connected: boolean
}

const EchoContext = createContext<EchoContextValue>({
  echo: null,
  connected: false,
})

export function useEcho(): EchoContextValue {
  return useContext(EchoContext)
}

interface EchoProviderProps {
  children: React.ReactNode
}

export function EchoProvider({ children }: EchoProviderProps) {
  const [connected, setConnected] = useState(false)
  const echoRef = useRef<EchoInstance | null>(null)

  const value = useMemo((): EchoContextValue => {
    const appKey = import.meta.env.VITE_REVERB_APP_KEY
    const host = import.meta.env.VITE_REVERB_HOST || 'localhost'
    const port = import.meta.env.VITE_REVERB_PORT || '8080'
    const scheme = import.meta.env.VITE_REVERB_SCHEME || 'http'
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'

    if (!appKey) {
      return { echo: null, connected: false }
    }

    if (!echoRef.current) {
      echoRef.current = new Echo({
        broadcaster: 'pusher',
        key: appKey,
        cluster: 'mt1',
        wsHost: host,
        wsPort: Number(port),
        wssPort: Number(port),
        forceTLS: scheme === 'https',
        enabledTransports: ['ws', 'wss'],
        authEndpoint: `${apiUrl}/broadcasting/auth`,
        auth: {
          headers: {
            Accept: 'application/json',
          },
          // Pusher's auth request must include cookies for Sanctum stateful auth.
          withCredentials: true,
        } as never,
      })

      echoRef.current.connector.pusher.connection.bind('connected', () => {
        setConnected(true)
      })

      echoRef.current.connector.pusher.connection.bind('disconnected', () => {
        setConnected(false)
      })

      echoRef.current.connector.pusher.connection.bind('error', () => {
        setConnected(false)
      })
    }

    return { echo: echoRef.current, connected }
  }, [connected])

  useEffect(() => {
    return () => {
      if (echoRef.current) {
        echoRef.current.disconnect()
        echoRef.current = null
      }
    }
  }, [])

  return <EchoContext.Provider value={value}>{children}</EchoContext.Provider>
}
