"use client"

import { Suspense, useCallback, useEffect, useState } from "react"
import {
  ArrowLeft,
  Lock,
  Unlock,
  DoorOpen,
  DoorClosed,
  Settings,
  Clock,
  Wifi,
  WifiOff,
  Edit2,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useTransitionRouter } from "next-view-transitions"
import { useSearchParams } from "next/navigation"
import useSWR from "swr"
import { socket } from "@/app/socket"
import { slideInOut } from "@/lib/transition"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface Device {
  id: string
  name: string
  status: "locked" | "unlocked"
  isOnline: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schedules: any[]
}

interface Heartbeat {
  deviceId: string
  deviceName: string
  online: boolean
  lock: "locked" | "unlocked"
  sensor: "open" | "closed"
  buzzer: "on" | "off"
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function DeviceDetail() {
  const router = useTransitionRouter()
  const searchParams = useSearchParams()
  const deviceId = searchParams.get('id')

  const { data: devices } = useSWR<Device[]>(`https://name-server-production.up.railway.app/device-list`, fetcher, {
    refreshInterval: 500,
  })

  const device = devices?.find((d) => d.id === deviceId)
  const email = "test@example.com"

  const [deviceState, setDeviceState] = useState<Heartbeat | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState("")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleDeviceStatus = useCallback(
    (data: Heartbeat) => {
      if (data.deviceId === deviceId) {
        setDeviceState(data)
      }
    },
    [deviceId],
  )

  useEffect(() => {
    socket.on("heartbeat", handleDeviceStatus)
    return () => {
      socket.off("heartbeat", handleDeviceStatus)
    }
  }, [handleDeviceStatus])

  useEffect(() => {
    if (device) {
      setEditName(device.name)
    }
  }, [device])

  const toggleDeviceLock = (newState: boolean) => {
    const message = {
      userEmail: email,
      deviceId: deviceId,
      command: newState ? "lock" : "unlock",
    }
    socket.emit("command", message)
  }

  const updateDeviceName = async () => {
    await fetch(`https://name-server-production.up.railway.app/device-list/${deviceId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ newName: editName }),
    })
    setIsEditing(false)
  }

  const handleDelete = async () => {
    await fetch(`https://name-server-production.up.railway.app/device-list/${deviceId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    })
    router.push("/dashboard")
  }

  const goBack = () => {
    router.push("/dashboard", {
      onTransitionReady: slideInOut,
    })
  }

  if (!device) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <span className="text-gray-500">Loading device...</span>
        </div>
      </div>
    )
  }

  const isLocked = deviceState?.lock === "locked"
  const isOnline = deviceState?.online
  const isDoorOpen = deviceState?.sensor === "open"
  const isBuzzing = deviceState?.buzzer === "on"

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* App Bar */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-full" onClick={goBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{device.name}</h1>
              <div className="flex items-center gap-1">
                {isOnline ? <Wifi className="h-3 w-3 text-green-500" /> : <WifiOff className="h-3 w-3 text-red-500" />}
                <span className="text-xs text-gray-500">{isOnline ? "Connected" : "Disconnected"}</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="p-4 space-y-4">
        {/* Status Card */}
        <Card className={`${isBuzzing ? "border-red-500 ring-2 ring-red-200 bg-red-50 dark:bg-red-950" : ""}`}>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div
                className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center ${isLocked ? "bg-red-100 dark:bg-red-900" : "bg-green-100 dark:bg-green-900"
                  }`}
              >
                {isLocked ? (
                  <Lock className="h-10 w-10 text-red-600 dark:text-red-400" />
                ) : (
                  <Unlock className="h-10 w-10 text-green-600 dark:text-green-400" />
                )}
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{isLocked ? "Locked" : "Unlocked"}</h2>
                <p className="text-gray-500">{isDoorOpen ? "Door is open" : "Door is closed"}</p>
              </div>

              <div className="flex items-center justify-center gap-4">
                <span className="text-sm text-gray-500">{isLocked ? "Unlock" : "Lock"}</span>
                <Switch
                  checked={isLocked}
                  onCheckedChange={toggleDeviceLock}
                  disabled={!isOnline}
                  className="scale-125"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Device Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Device Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Status</span>
              <Badge variant={isOnline ? "default" : "secondary"} className={isOnline ? "bg-green-500" : ""}>
                {isOnline ? "Online" : "Offline"}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-500">Door</span>
              <div className="flex items-center gap-2">
                {isDoorOpen ? <DoorOpen className="h-4 w-4 text-yellow-500" /> : <DoorClosed className="h-4 w-4" />}
                <span>{isDoorOpen ? "Open" : "Closed"}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-500">Device Name</span>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-32"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") updateDeviceName()
                        if (e.key === "Escape") setIsEditing(false)
                      }}
                    />
                    <Button size="sm" onClick={updateDeviceName}>
                      Save
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>{device.name}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsEditing(true)}>
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schedule Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            {device.schedules?.length > 0 ? (
              <div className="space-y-2">
                {device.schedules.map((schedule, index) => (
                  <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-sm">
                      {schedule.lockDay} {schedule.lockTime} → {schedule.unlockDay} {schedule.unlockTime}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No schedules set</p>
                <Button variant="outline" className="mt-2 bg-transparent">
                  Add Schedule
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="text-lg text-red-600 dark:text-red-400">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Unpair Device
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Unpair Device</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to unpair this device? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDelete}>
                    Unpair Device
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default function DeviceDetailPage() {
  return (
    <Suspense fallback={<div>Loading device...</div>}>
      <DeviceDetail />
    </Suspense>
  )
}