import { Wifi, WifiOff, WifiLow, WifiHigh, WifiZero } from "lucide-react"

export const getSignalStrength = (rssi: number) => {
  if (rssi > -50) return { strength: "Excellent", color: "text-green-500", bars: 4 }
  if (rssi > -60) return { strength: "Good", color: "text-blue-500", bars: 3 }
  if (rssi > -70) return { strength: "Fair", color: "text-yellow-500", bars: 2 }
  return { strength: "Weak", color: "text-red-500", bars: 1 }
}

export const getWifiSignalStrength = (rssi: number | undefined) => {
  if (typeof rssi !== "number" || rssi === 0) return { icon: WifiOff, color: "text-slate-400", label: "No Signal" }
  if (rssi > -50) return { icon: Wifi, color: "text-green-500", label: "Excellent" }
  if (rssi > -60) return { icon: WifiHigh, color: "text-blue-500", label: "Good" }
  if (rssi > -70) return { icon: WifiLow, color: "text-yellow-500", label: "Fair" }
  return { icon: WifiZero, color: "text-red-500", label: "Weak" }
}

// Convert RSSI (dBm) to percentage (0-100%)
export const rssiToPercent = (rssi: number | undefined): number | null => {
  if (typeof rssi !== "number") return null
  const min = -100 // worst signal
  const max = -50  // best signal
  let percent = ((rssi - min) / (max - min)) * 100
  percent = Math.max(0, Math.min(100, percent))
  return Math.round(percent)
}