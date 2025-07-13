/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Lock,
  Unlock,
  DoorOpen,
  Edit2,
  Trash2,
  Clock,
  Wifi,
  WifiOff,
  Battery,
  X,
  Settings,
  History,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Heartbeat } from "./door-lock-dashboard"
import { getWifiSignalStrength, rssiToPercent } from "@/lib/rssi"

interface Device {
  id: string
  name: string
  status: "locked" | "unlocked"
  isOnline: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schedule: any[]
}

interface DeviceState {
  deviceId: string
  deviceName: string
  online: boolean
  lock: "locked" | "unlocked"
  sensor: "open" | "closed"
  buzzer: "on" | "off"
  rssi: number
}

interface DeviceBottomSheetProps {
  deviceId: string | null
  device: Device | null
  deviceState: DeviceState | null
  setDeviceState: (state: Record<string, Heartbeat> | ((prevState: Record<string, Heartbeat>) => Record<string, Heartbeat>)) => void
  isOpen: boolean
  onClose: () => void
  onToggleLock: (deviceId: string, newState: boolean) => void
  email: string
  onNavigateToSchedule?: (deviceId: string) => void
  onWiFiConfig?: (deviceId: string, deviceName: string) => void
  onEditDevice?: (deviceId: string, deviceName: string) => void
}

export function DeviceBottomSheet({
  deviceId,
  device,
  deviceState,
  setDeviceState,
  isOpen,
  onClose,
  onToggleLock,
  email,
  onNavigateToSchedule,
  onWiFiConfig,
  onEditDevice,
}: DeviceBottomSheetProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const isLocked = deviceState?.lock === "locked"
  const isOnline = deviceState?.online
  const isDoorOpen = deviceState?.sensor === "open"
  const isBuzzing = deviceState?.buzzer === "on"
  const signal = getWifiSignalStrength(deviceState?.rssi);
  const rssiPercent = rssiToPercent(deviceState?.rssi)

  const handleDelete = async (deviceId: string) => {
    console.log("Deleting device:", deviceId)
    await fetch(`https://name-server-production.up.railway.app/device-list/${deviceId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userEmail: email }),
    })

    setShowDeleteDialog(false)
    onClose()

    setTimeout(() => {
      setDeviceState((prevState) => {
        const newState = { ...prevState }
        delete newState[deviceId]
        return newState
      })
    }, 5000);
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={onClose}
            />

            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl z-50 max-h-[85vh] overflow-hidden"
            >
              {/* Handle */}
              <div className="flex justify-center py-3">
                <div className="w-12 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
              </div>

              {/* Header */}
              <div className="px-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <motion.div
                      animate={{
                        backgroundColor: isLocked ? "#dc2626" : "#16a34a",
                      }}
                      transition={{
                        backgroundColor: { duration: 0.3 },
                      }}
                      className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                    >
                      {isLocked ? (
                        <Lock className="h-6 w-6 text-white" />
                      ) : (
                        <Unlock className="h-6 w-6 text-white" />
                      )}
                    </motion.div>

                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">{device?.name || ""}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant={isOnline ? "default" : "secondary"}
                          className={`text-xs ${isOnline
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                            }`}
                        >
                          {isOnline ? (
                            <>
                              <Wifi className="h-3 w-3 mr-1" />
                              Online
                            </>
                          ) : (
                            <>
                              <WifiOff className="h-3 w-3 mr-1" />
                              Offline
                            </>
                          )}
                        </Badge>

                        {isBuzzing && (
                          <Badge variant="destructive" className="text-xs animate-pulse">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Alert
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button variant="ghost" size="icon" className="rounded-full" onClick={onClose}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-6 space-y-6 overflow-y-auto max-h-[60vh]">
                {/* Lock Control */}
                <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-6">
                  <div className="text-center space-y-4">
                    <motion.div
                      className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center ${isLocked ? "bg-red-100 dark:bg-red-900" : "bg-green-100 dark:bg-green-900"
                        }`}
                    >
                      {isLocked ? (
                        <Lock className="h-10 w-10 text-red-600 dark:text-red-400" />
                      ) : (
                        <Unlock className="h-10 w-10 text-green-600 dark:text-green-400" />
                      )}
                    </motion.div>

                    <div>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {isLocked ? "Locked" : "Unlocked"}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400">
                        {isDoorOpen ? "Door is open" : "Door is closed"}
                      </p>
                    </div>

                    <div className="flex items-center justify-center gap-4">
                      <span className="text-sm text-slate-500">{isLocked ? "Unlock" : "Lock"}</span>
                      <motion.div whileTap={{ scale: 0.9 }}>
                        <Switch
                          checked={isLocked}
                          onCheckedChange={(checked) => onToggleLock(deviceId || "", checked)}
                          disabled={!isOnline}
                          className="scale-125 data-[state=checked]:bg-red-500"
                        />
                      </motion.div>
                    </div>
                  </div>
                </div>

                {/* Device Stats */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4">
                    <div className="flex items-center gap-3 justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-blue-100 dark:bg-blue-900`}>
                          <signal.icon className={`h-5 w-5 ${signal.color}`} />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Signal</p>
                          <p className={`font-semibold text-slate-900 dark:text-white ${signal.color}`}>
                            {typeof deviceState?.rssi === "number" ? `${deviceState.rssi} dBm` : "N/A"}{" "}
                            <span className="ml-1 text-xs">({signal.label})</span>
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full ml-2 bg-blue-100 dark:bg-blue-900 shadow-lg hover:bg-blue-200 dark:hover:bg-blue-700 transition"
                        onClick={() => onWiFiConfig?.(deviceId!, device!.name)}
                        aria-label="Configure WiFi"
                      >
                        <Settings className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-900 dark:text-white">Quick Actions</h4>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      variant="outline"
                      className="w-full justify-start h-14 rounded-2xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                      onClick={() => {
                        onClose()
                        // Navigate to schedule page
                        onNavigateToSchedule?.(deviceId!)
                      }}
                    >
                      <Clock className="h-5 w-5 mr-3 text-blue-500" />
                      <div className="text-left">
                        <p className="font-medium">Schedule</p>
                        <p className="text-xs text-slate-500">Set auto lock/unlock times</p>
                      </div>
                    </Button>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      variant="outline"
                      className="w-full justify-start h-14 rounded-2xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                      onClick={() => onEditDevice?.(deviceId!, device!.name)}
                    >
                      <Edit2 className="h-5 w-5 mr-3 text-orange-500" />
                      <div className="text-left">
                        <p className="font-medium">Edit Device</p>
                        <p className="text-xs text-slate-500">Change device name and settings</p>
                      </div>
                    </Button>
                  </motion.div>
                </div>

                {/* Danger Zone */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      variant="outline"
                      className="w-full justify-start h-14 rounded-2xl border-red-200 dark:border-red-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 bg-transparent"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 className="h-5 w-5 mr-3" />
                      <div className="text-left">
                        <p className="font-medium">Unpair Device</p>
                        <p className="text-xs opacity-70">Remove from your account</p>
                      </div>
                    </Button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Unpair Device</DialogTitle>
            <DialogDescription>
              Are you sure you want to unpair &quot;{device?.name || ""}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="rounded-2xl">
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => handleDelete(device?.id || "")} className="rounded-2xl">
              Unpair Device
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
