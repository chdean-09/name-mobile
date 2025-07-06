import { useEffect, useRef, useState } from "react"
import { io, Socket } from "socket.io-client";

interface DeviceState {
  lock: "locked" | "unlocked"
  sensor: "open" | "closed"
  buzzer: "on" | "off"
}

export function useDeviceWebSocket() {
  const socketRef = useRef<Socket | null>(null)

  const [data, setData] = useState<DeviceState>({ lock: "locked", sensor: "closed", buzzer: "off" })
  const [isConnected, setIsConnected] = useState(false)
  const [buzzer, setBuzzer] = useState(false)
  const [deviceStatuses, setDeviceStatuses] = useState<Record<string, boolean>>({})


  const connect = () => {
    const socket = io("https://name-server-production.up.railway.app/");
    socketRef.current = socket

    socket.on("connect", () => {
      console.log("✅ WebSocket connected")
      console.log("Socket ID:", socket.id) // This should now log the correct socket ID
      setIsConnected(true)
    });

    socket.on("disconnect", () => {
      console.log("WebSocket disconnected"); // undefined
      setIsConnected(false);
    });

    socket.io.on("reconnect_attempt", () => {
      console.log("🔄 Reconnecting to WebSocket...");
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    socket.on("device_status", (data: any) => {
      if ("buzzer" in data) {
        // This is a DeviceState
        const transformedData = data as DeviceState

        setBuzzer(transformedData.buzzer === "on")
        setData(transformedData)

      } else if ("deviceName" in data && "online" in data) {
        // This is an online status update
        setDeviceStatuses(prev => ({
          ...prev,
          [data.deviceName]: data.online,
        }))
      } else {
        console.warn("⚠️ Unrecognized device_status payload", data)
      }
    })
  }

  const send = (msg: unknown) => {
    if (!socketRef.current) {
      console.error("❌ WebSocket is not connected")
      return
    }

    try {
      // const json = JSON.stringify(msg)
      socketRef.current.emit("command", msg)
      console.log("📤 Sent command:", msg)
    } catch (err) {
      console.error("⚠️ Failed to send command:", err)
    }
  }

  useEffect(() => {
    connect()
  }, [])

  return {
    send,
    data,
    isConnected,
    buzzer,
    deviceStatuses
  }
}
