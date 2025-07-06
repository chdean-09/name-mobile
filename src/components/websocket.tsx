import { useEffect, useRef, useState } from "react"
import { io, Socket } from "socket.io-client";

interface DeviceState {
  lock: "locked" | "unlocked"
  sensor: "open" | "closed"
  buzzer: "on" | "off"
}

export function useDeviceWebSocket() {
  const socketRef = useRef<Socket | null>(null)

  type DeviceStateMap = Record<string, DeviceState>

  const [deviceStates, setDeviceStates] = useState<DeviceStateMap>({})

  const [isConnected, setIsConnected] = useState(false)
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
      // Device state update (includes lock/sensor/buzzer + deviceId)
      if ("deviceId" in data && ("buzzer" in data || "lock" in data || "sensor" in data)) {
        const { deviceId, ...rest } = data as { deviceId: string } & DeviceState

        setDeviceStates(prev => ({
          ...prev,
          [deviceId]: rest,
        }));

        // Device online/offline event (presence update)
      } else if ("deviceName" in data && "online" in data) {
        setDeviceStatuses(prev => ({
          ...prev,
          [data.deviceId]: data.online,
        }));

      } else {
        console.warn("⚠️ Unrecognized device_status payload", data);
      }
    });
  }

  const send = (deviceId: string, command: string) => {
    if (!socketRef.current) {
      console.error("❌ WebSocket is not connected")
      return
    }

    const message = {
      deviceId: deviceId,
      command: command, // e.g., "lock" or "unlock"
    }

    try {
      socketRef.current.emit("command", message)
      console.log("📤 Sent command:", message)
    } catch (err) {
      console.error("⚠️ Failed to send command:", err)
    }
  }

  useEffect(() => {
    connect()
  }, [])

  return {
    send,
    deviceStates,
    isConnected,
    deviceStatuses
  }
}
