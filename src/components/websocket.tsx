import { useEffect, useRef, useState } from "react"

interface DeviceState {
  lock: string // "locked" | "unlocked"
  sensor: string // "open" | "closed"
  buzzer: string // "on" | "off"
}

export function useDeviceWebSocket(ip: string) {
  const socketRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [data, setData] = useState<DeviceState>({ lock: "locked", sensor: "closed", buzzer: "off" })
  const [isConnected, setIsConnected] = useState(false)
  const [buzzer, setBuzzer] = useState(false)

  const transformData = (json: unknown): DeviceState => {
    return {
      lock: json.lock === 0 ? "locked" : "unlocked",
      sensor: json.sensor === 0 ? "open" : "closed",
      buzzer: json.buzzer === 0 ? "off" : "on",
    }
  }

  const connect = () => {
    const socket = new WebSocket(`ws://${ip}/ws`)
    socketRef.current = socket

    socket.onopen = () => {
      console.log("✅ WebSocket connected to", ip)
      setIsConnected(true)
    }

    socket.onmessage = (event) => {
      try {
        const json = JSON.parse(event.data)
        console.log("📨 WebSocket message:", json)

        const data = transformData(json)
        if (data.buzzer === "on") {
          setBuzzer(true)
        } else {
          setBuzzer(false)
        }
        
        setData(data)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        console.error("⚠️ Invalid JSON received:", event.data)
      }
    }

    socket.onclose = (e) => {
      console.warn("🔌 WebSocket disconnected:", e.reason)
      setIsConnected(false)
      reconnectTimeoutRef.current = setTimeout(connect, 1000)
    }

    socket.onerror = (err) => {
      console.error("❌ WebSocket error:", err)
      socket.close()
    }
  }

  useEffect(() => {
    connect()

    return () => {
      socketRef.current?.close()
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
    }
  }, [ip])

  const send = (msg: unknown) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msg))
    } else {
      console.warn("⚠️ WebSocket not connected")
    }
  }

  return {
    send,
    data,
    isConnected,
    buzzer,
  }
}
