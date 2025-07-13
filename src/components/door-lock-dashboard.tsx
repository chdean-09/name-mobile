"use client"

import { useCallback, useEffect, useState } from "react"
import { AnimatePresence } from "motion/react"
import * as motion from "motion/react-client"
import {
  Plus,
  Lock,
  Unlock,
  DoorOpen,
  DoorClosed,
  Wifi,
  WifiOff,
  AlertTriangle,
  SettingsIcon,
  ArrowLeft,
  User,
  Bell,
  Shield,
  Info,
  LogOut,
  Smartphone,
  Bluetooth,
  Moon,
  Sun,
  Volume2,
  Clock,
  Trash2,
  MoreVertical,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import useSWR from "swr"
import { socket } from "@/app/socket"
import { DeviceBottomSheet } from "@/components/device-bottom-sheet"
import { PairingModal } from "@/components/pairing-modal"
import { AddScheduleModal } from "@/components/add-schedule-modal"
import { useTheme } from "next-themes"
import Image from "next/image"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { WiFiConfigModal } from "./wifi-config-modal"
import { EditDeviceModal } from "./edit-device-modal"

interface Schedule {
  id: string
  type: "lock" | "unlock"
  time: string
  days: string[]
  isEnabled: boolean
  deviceId: string
}

interface Device {
  id: string
  name: string
  status: "locked" | "unlocked"
  isOnline: boolean
  schedule: Schedule[]
}

export interface Heartbeat {
  deviceId: string
  deviceName: string
  online: boolean
  lock: "locked" | "unlocked"
  sensor: "open" | "closed"
  buzzer: "on" | "off"
  rssi: number
}

type ViewType = "dashboard" | "settings" | "schedule"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function SmartLockApp() {
  const { theme, setTheme } = useTheme()
  const {
    data: devices,
    error,
    isLoading,
    mutate,
  } = useSWR<Device[]>(`https://name-server-production.up.railway.app/device-list`, fetcher, {
    refreshInterval: 500,
  })

  const email = "test@example.com"

  // Navigation state
  const [currentView, setCurrentView] = useState<ViewType>("dashboard")
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null)
  const [navDirection, setNavDirection] = useState<"forward" | "backward">("forward")

  // Connection state
  const [isConnected, setIsConnected] = useState(false)
  // const [transport, setTransport] = useState("N/A")
  const [deviceStates, setDeviceStates] = useState<Record<string, Heartbeat>>({})
  const [joinedRooms, setJoinedRooms] = useState(new Set())

  // Modal states
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null)
  const [showPairing, setShowPairing] = useState(false)
  const [showAddSchedule, setShowAddSchedule] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)
  const [showWiFiConfig, setShowWiFiConfig] = useState(false)
  const [wifiConfigDevice, setWiFiConfigDevice] = useState<{ id: string; name: string } | null>(null)
  const [showEditDevice, setShowEditDevice] = useState(false)
  const [editingDevice, setEditingDevice] = useState<{ id: string; name: string } | null>(null)

  // Schedule state
  // const [schedules, setSchedules] = useState<Schedule[]>([])

  const handleDeviceStatus = useCallback((data: Heartbeat) => {
    console.log("Received heartbeat payload:", JSON.stringify(data))
    setDeviceStates((prev) => ({
      ...prev,
      [data.deviceId]: {
        deviceId: data.deviceId,
        deviceName: data.deviceName,
        online: data.online,
        lock: data.lock,
        sensor: data.sensor,
        buzzer: data.buzzer,
        rssi: data.rssi,
      },
    }))
  }, [])

  useEffect(() => {
    if (socket.connected) {
      onConnect()
    }

    function onConnect() {
      setIsConnected(true)
      // setTransport(socket.io.engine.transport.name)

      // socket.io.engine.on("upgrade", (transport) => {
      //   setTransport(transport.name)
      // })
    }

    function onDisconnect() {
      setIsConnected(false)
      // setTransport("N/A")
      setJoinedRooms(new Set())
    }

    socket.on("connect", onConnect)
    socket.on("disconnect", onDisconnect)
    socket.on("heartbeat", handleDeviceStatus)

    return () => {
      socket.off("connect", onConnect)
      socket.off("disconnect", onDisconnect)
      socket.off("heartbeat", handleDeviceStatus)
    }
  }, [handleDeviceStatus])

  useEffect(() => {
    if (isConnected && !isLoading && !error && devices) {
      for (const device of devices) {
        const roomKey = `${email}-device-${device.id}`
        if (!joinedRooms.has(roomKey)) {
          socket.emit("join_as_mobile", {
            userEmail: email,
            deviceId: device.id,
          })
          setJoinedRooms((prev) => new Set(prev).add(roomKey))
        }
      }
    }
  }, [isConnected, isLoading, error, devices, joinedRooms])

  // Load schedules for selected device
  // useEffect(() => {
  //   console.log("Selected Device ID:", selectedDeviceId)
  //   if (selectedDeviceId && currentView === "schedule" && devices) {

  //     console.log("Selected Device Schedules:", devices.find((d) => d.id === selectedDeviceId)?.schedule)
  //     setSchedules(devices.find((d) => d.id === selectedDeviceId)?.schedule || [])
  //   }
  // }, [selectedDeviceId, currentView, devices])

  const toggleDeviceLock = (deviceId: string, newState: boolean) => {
    const message = {
      userEmail: email,
      deviceId: deviceId,
      command: newState ? "lock" : "unlock",
    }
    socket.emit("command", message)
  }

  const navigateTo = (view: ViewType, deviceId?: string) => {
    setNavDirection("forward")
    if (deviceId) setSelectedDeviceId(deviceId)
    setCurrentView(view)
  }

  const goBack = () => {
    setNavDirection("backward")
    if (currentView === "schedule") {
      setCurrentView("dashboard")
    } else if (currentView === "settings") {
      setCurrentView("dashboard")
    }
    setSelectedDeviceId(null)
  }

  const openDeviceSheet = (deviceId: string) => {
    setSelectedDevice(deviceId)
  }

  // Schedule functions
  const toggleSchedule = async (scheduleId: string) => {
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }

    const schedule = devices?.find((d) => d.id === selectedDeviceId)?.schedule.find((s) => s.id === scheduleId)
    await fetch(`https://name-server-production.up.railway.app/schedule/${scheduleId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ isEnabled: !schedule?.isEnabled }),
    })
  }

  const deleteSchedule = async (scheduleId: string) => {
    await fetch(`https://name-server-production.up.railway.app/schedule/${scheduleId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })
  }

  const addSchedule = async (newSchedule: Omit<Schedule, "id" | "deviceId">) => {
    await fetch("https://name-server-production.up.railway.app/schedule", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        deviceId: selectedDeviceId,
        schedule: {
          days: newSchedule.days,
          time: newSchedule.time,
          type: newSchedule.type === "lock" ? "LOCK" : "UNLOCK",
        }
      }),
    })
    console.log("Adding schedule:", JSON.stringify(newSchedule), "for device:", selectedDeviceId)
  }

  // const updateSchedule = (updatedSchedule: Omit<Schedule, "deviceId">) => {
  //   setSchedules((prev) =>
  //     prev.map((schedule) =>
  //       schedule.id === updatedSchedule.id ? { ...updatedSchedule, deviceId: selectedDeviceId! } : schedule,
  //     ),
  //   )
  // }

  const formatDays = (days: string[]) => {
    if (days.length === 7) return "Every day"
    if (days.length === 5 && !days.includes("Sat") && !days.includes("Sun")) return "Weekdays"
    if (days.length === 2 && days.includes("Sat") && days.includes("Sun")) return "Weekends"
    return days.join(", ")
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour}:${minutes} ${ampm}`
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30,
      },
    },
  }

  const pageVariants = {
    initial: (direction: "forward" | "backward") => ({
      opacity: 0,
      x: direction === "forward" ? 300 : -300,
    }),
    in: { opacity: 1, x: 0 },
    // out: (direction: "forward" | "backward") => ({
    //   opacity: 0,
    //   x: direction === "forward" ? -300 : 300,
    // }),
  }

  const pageTransition = {
    type: "tween" as const,
    ease: "anticipate" as const,
    duration: 0.4,
  }

  const renderHeader = () => {
    const getTitle = () => {
      switch (currentView) {
        case "settings":
          return "Settings"
        case "schedule":
          return "Schedule"
        default:
          return "N.A.M.E"
      }
    }

    return (
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-white/20 flex-shrink-0"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {currentView !== "dashboard" ? (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-2xl bg-slate-100 dark:bg-slate-800"
                  onClick={goBack}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </motion.div>
            ) : (
              <motion.div
                className="w-12 h-12 flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Image src={"/logo-only.png"} alt={"Logo"} className="size-full" width={300} height={300} />
              </motion.div>
            )}
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">{getTitle()}</h1>
              {currentView === "dashboard" && (
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{
                      backgroundColor: isConnected ? "#10b981" : "#ef4444",
                      scale: isConnected ? [1, 1.2, 1] : 1,
                    }}
                    transition={{ duration: 0.3 }}
                    className="w-2 h-2 rounded-full"
                  />
                  <span className="text-xs text-slate-500">{isConnected ? "Connected" : "Connecting..."}</span>
                </div>
              )}
              {currentView === "schedule" && <p className="text-sm text-slate-500">Automate your smart lock</p>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentView === "schedule" && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={() => setShowAddSchedule(true)}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-2xl"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </motion.div>
            )}

            {currentView === "dashboard" && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-2xl bg-slate-100 dark:bg-slate-800"
                  onClick={() => navigateTo("settings")}
                >
                  <SettingsIcon className="h-5 w-5" />
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </motion.header>
    )
  }

  const renderDashboard = () => (
    <motion.div
      key="dashboard"
      initial="initial"
      animate="in"
      exit="out"
      custom={navDirection}
      variants={pageVariants}
      transition={pageTransition}
      className="px-6 py-6 pb-24"
    >
      <AnimatePresence mode="wait">
        {!devices || devices.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center justify-center min-h-[60vh] text-center"
          >
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                repeatDelay: 3,
              }}
              className="w-28 h-28 flex items-center justify-center mb-2"
            >
              <Image src={"/logo-only.png"} alt={"Logo"} className="size-full" width={300} height={300} />
            </motion.div>

            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Welcome to N.A.M.E</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-sm">
              Secure your home with intelligent door locks. Add your first device to get started.
            </p>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => setShowPairing(true)}
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-2xl px-8 py-4 shadow-xl"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Your First Lock
              </Button>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="devices"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Your Devices</h2>
                <p className="text-sm text-slate-500">
                  {devices.filter((d) => deviceStates[d.id]?.online).length} of {devices.length} online
                </p>
              </div>
            </div>

            {devices.map((device) => {
              const state = deviceStates[device.id]
              const isLocked = state?.lock === "locked"
              const isOnline = state?.online
              const isDoorOpen = state?.sensor === "open"
              const isBuzzing = state?.buzzer === "on"

              return (
                <motion.div
                  key={device.id}
                  variants={cardVariants}
                  layout
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative overflow-hidden rounded-3xl bg-white dark:bg-slate-800 shadow-xl border border-white/20 ${isBuzzing ? "ring-2 ring-red-400 shadow-red-200 dark:shadow-red-900" : ""
                    }`}
                  onClick={() => openDeviceSheet(device.id)}
                >
                  <AnimatePresence>
                    {isBuzzing && (
                      <motion.div
                        key="buzzer-alert"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        transition={{
                          duration: 1,
                        }}
                        className="absolute inset-0 bg-red-500 pointer-events-none"
                      />
                    )}
                  </AnimatePresence>

                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <motion.div
                          animate={{
                            backgroundColor: isLocked ? "#dc2626" : "#16a34a",
                          }}
                          transition={{
                            backgroundColor: { duration: 0.3 },
                          }}
                          className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                        >
                          {isLocked ? (
                            <Lock className="h-7 w-7 text-white" />
                          ) : (
                            <Unlock className="h-7 w-7 text-white" />
                          )}
                        </motion.div>

                        <div>
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{device.name}</h3>
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
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        {isDoorOpen ? (
                          <DoorOpen className="h-4 w-4 text-amber-500" />
                        ) : (
                          <DoorClosed className="h-4 w-4" />
                        )}
                        <span>{isDoorOpen ? "Door Open" : "Door Closed"}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {isLocked ? "Locked" : "Unlocked"}
                        </span>
                        <motion.div whileTap={{ scale: 0.9 }} onClick={(e) => e.stopPropagation()}>
                          <Switch
                            checked={isLocked}
                            onCheckedChange={(checked) => toggleDeviceLock(device.id, checked)}
                            disabled={!isOnline}
                            className="data-[state=checked]:bg-red-500"
                          />
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      {devices && devices.length > 0 && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
          className="fixed bottom-6 right-6 z-10"
        >
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Button
              onClick={() => setShowPairing(true)}
              size="lg"
              className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-2xl"
            >
              <Plus className="h-8 w-8" />
            </Button>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  )

  const renderSettings = () => {
    const settingsGroups = [
      {
        title: "Account",
        items: [
          {
            icon: User,
            title: "Profile",
            subtitle: "Manage your account details",
            action: () => console.log("Profile"),
          },
          {
            icon: Shield,
            title: "Security",
            subtitle: "Privacy and security settings",
            action: () => console.log("Security"),
          },
        ],
      },
      {
        title: "Preferences",
        items: [
          {
            icon: Bell,
            title: "Notifications",
            subtitle: "Push notifications and alerts",
            hasSwitch: true,
            switchValue: true,
          },
          {
            icon: Volume2,
            title: "Sound & Haptics",
            subtitle: "Audio feedback and vibration",
            hasSwitch: true,
            switchValue: true,
          },
          {
            icon: theme === "dark" ? Moon : Sun,
            title: "Dark Mode",
            subtitle: "Toggle dark/light theme",
            hasSwitch: true,
            switchValue: theme === "dark",
            onToggle: () => setTheme(theme === "dark" ? "light" : "dark"),
          },
        ],
      },
      {
        title: "Device",
        items: [
          {
            icon: Bluetooth,
            title: "Bluetooth",
            subtitle: "Manage Bluetooth connections",
            action: () => console.log("Bluetooth"),
          },
          {
            icon: Wifi,
            title: "Wi-Fi Settings",
            subtitle: "Network configuration",
            action: () => console.log("Wi-Fi"),
          },
        ],
      },
      {
        title: "About",
        items: [
          {
            icon: Smartphone,
            title: "App Version",
            subtitle: "v1.0.0 (Build 123)",
            action: () => console.log("Version"),
          },
          {
            icon: Info,
            title: "Help & Support",
            subtitle: "Get help and contact support",
            action: () => console.log("Help"),
          },
        ],
      },
    ]

    return (
      <motion.div
        key="settings"
        initial="initial"
        animate="in"
        exit="out"
        custom={navDirection}
        variants={pageVariants}
        transition={pageTransition}
        className="px-6 py-6 space-y-6"
      >
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-white/20"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <User className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">John Doe</h3>
              <p className="text-slate-600 dark:text-slate-400">test@example.com</p>
              <p className="text-xs text-slate-500 mt-1">Premium Member</p>
            </div>
          </div>
        </motion.div>

        {/* Settings Groups */}
        {settingsGroups.map((group, groupIndex) => (
          <motion.div
            key={group.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: groupIndex * 0.1 }}
            className="space-y-3"
          >
            <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wide px-2">{group.title}</h4>

            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-white/20 overflow-hidden">
              {group.items.map((item, itemIndex) => (
                <motion.div
                  key={item.title}
                  whileHover={{ backgroundColor: "rgba(59, 130, 246, 0.05)" }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-4 cursor-pointer transition-colors ${itemIndex !== group.items.length - 1 ? "border-b border-slate-100 dark:border-slate-700" : ""
                    }`}
                // onClick={item.action}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center">
                        <item.icon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                      </div>
                      <div>
                        <h5 className="font-medium text-slate-900 dark:text-white">{item.title}</h5>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{item.subtitle}</p>
                      </div>
                    </div>

                    {/* {item.hasSwitch ? (
                      <motion.div
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation()
                          item.onToggle?.()
                        }}
                      >
                        <Switch checked={item.switchValue} onCheckedChange={item.onToggle} />
                      </motion.div>
                    ) : (
                      <ArrowLeft className="h-4 w-4 text-slate-400 rotate-180" />
                    )} */}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}

        {/* Sign Out */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-red-200 dark:border-red-800 overflow-hidden"
        >
          <motion.div
            whileHover={{ backgroundColor: "rgba(239, 68, 68, 0.05)" }}
            whileTap={{ scale: 0.98 }}
            className="p-4 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-2xl flex items-center justify-center">
                <LogOut className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h5 className="font-medium text-red-600 dark:text-red-400">Sign Out</h5>
                <p className="text-sm text-red-500 dark:text-red-500">Sign out of your account</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    )
  }

  const renderSchedule = () => {
    const schedules = devices?.find((d) => d.id === selectedDeviceId)?.schedule || []

    const groupedSchedules = schedules.reduce(
      (acc, schedule) => {
        const type = schedule.type.toLowerCase();
        if (!acc[type]) acc[type] = [];
        acc[type].push(schedule);
        return acc;
      },
      { lock: [] as Schedule[], unlock: [] as Schedule[] } as Record<string, Schedule[]>,
    );

    return (
      <motion.div
        key="schedule"
        initial="initial"
        animate="in"
        exit="out"
        custom={navDirection}
        variants={pageVariants}
        transition={pageTransition}
        className="px-6 py-6 space-y-6"
      >
        {schedules.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center min-h-[60vh] text-center"
          >
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                repeatDelay: 3,
              }}
              className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mb-6 shadow-2xl"
            >
              <Clock className="h-12 w-12 text-white" />
            </motion.div>

            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No Schedules Yet</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-sm">
              Create automated lock and unlock schedules to secure your home on your terms.
            </p>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => setShowAddSchedule(true)}
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-2xl px-8 py-4 shadow-xl"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create First Schedule
              </Button>
            </motion.div>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Lock Schedules */}
            {groupedSchedules.lock.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                <div className="flex items-center gap-3 px-2">
                  <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-xl flex items-center justify-center">
                    <Lock className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Auto Lock</h3>
                  <Badge variant="secondary" className="text-xs">
                    {groupedSchedules.lock.filter((s) => s.isEnabled).length} active
                  </Badge>
                </div>

                <div className="space-y-2">
                  <AnimatePresence>
                    {groupedSchedules.lock.map((schedule, index) => (
                      <motion.div
                        key={schedule.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.1 }}
                        className={`bg-white dark:bg-slate-800 rounded-3xl p-4 shadow-xl border border-white/20 ${!schedule.isEnabled ? "opacity-60" : ""
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <motion.div
                              animate={{
                                backgroundColor: schedule.isEnabled ? "#dc2626" : "#6b7280",
                              }}
                              className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                            >
                              <Lock className="h-6 w-6 text-white" />
                            </motion.div>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                                  {formatTime(schedule.time)}
                                </span>
                              </div>
                              <p className="text-sm text-slate-600 dark:text-slate-400">{formatDays(schedule.days)}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <motion.div whileTap={{ scale: 0.9 }}>
                              <Switch
                                checked={schedule.isEnabled}
                                onCheckedChange={() => toggleSchedule(schedule.id)}
                                className="data-[state=checked]:bg-red-500"
                              />
                            </motion.div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-2xl">
                                <DropdownMenuItem
                                  onClick={() => deleteSchedule(schedule.id)}
                                  className="text-red-600 rounded-xl"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {/* Unlock Schedules */}
            {groupedSchedules.unlock.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-3 px-2">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center">
                    <Unlock className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Auto Unlock</h3>
                  <Badge variant="secondary" className="text-xs">
                    {groupedSchedules.unlock.filter((s) => s.isEnabled).length} active
                  </Badge>
                </div>

                <div className="space-y-2">
                  <AnimatePresence>
                    {groupedSchedules.unlock.map((schedule, index) => (
                      <motion.div
                        key={schedule.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.1 }}
                        className={`bg-white dark:bg-slate-800 rounded-3xl p-4 shadow-xl border border-white/20 ${!schedule.isEnabled ? "opacity-60" : ""
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <motion.div
                              animate={{
                                backgroundColor: schedule.isEnabled ? "#16a34a" : "#6b7280",
                              }}
                              className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                            >
                              <Unlock className="h-6 w-6 text-white" />
                            </motion.div>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                                  {formatTime(schedule.time)}
                                </span>
                              </div>
                              <p className="text-sm text-slate-600 dark:text-slate-400">{formatDays(schedule.days)}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <motion.div whileTap={{ scale: 0.9 }}>
                              <Switch
                                checked={schedule.isEnabled}
                                onCheckedChange={() => toggleSchedule(schedule.id)}
                                className="data-[state=checked]:bg-green-500"
                              />
                            </motion.div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-2xl">
                                <DropdownMenuItem
                                  onClick={() => deleteSchedule(schedule.id)}
                                  className="text-red-600 rounded-xl"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </motion.div>
    )
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case "dashboard":
        return renderDashboard()
      case "settings":
        return renderSettings()
      case "schedule":
        return renderSchedule()
      default:
        return renderDashboard()
    }
  }

  const handleWiFiConfig = (deviceId: string, deviceName: string) => {
    setWiFiConfigDevice({ id: deviceId, name: deviceName })
    setShowWiFiConfig(true)
  }

  const handleEditDevice = (deviceId: string, deviceName: string) => {
    setEditingDevice({ id: deviceId, name: deviceName })
    setShowEditDevice(true)
  }

  const handleDeviceNameSaved = async (newName: string) => {
    await fetch(`https://name-server-production.up.railway.app/device-list/${editingDevice?.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        newName: newName,
        userEmail: email
      }),
    })
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex flex-col">
      {/* Status Bar Spacer */}
      <div className="h-6 bg-slate-900/80 flex-shrink-0" />

      {/* Fixed Header */}
      {renderHeader()}

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">{renderCurrentView()}</AnimatePresence>
      </main>

      {/* Device Bottom Sheet */}
      <DeviceBottomSheet
        deviceId={selectedDevice}
        device={selectedDevice ? (devices?.find((d) => d.id === selectedDevice) ?? null) : null}
        deviceState={selectedDevice ? deviceStates[selectedDevice] : null}
        setDeviceState={setDeviceStates}
        isOpen={!!selectedDevice}
        onClose={() => setSelectedDevice(null)}
        onToggleLock={toggleDeviceLock}
        email={email}
        onNavigateToSchedule={(deviceId) => {
          setSelectedDevice(null)
          navigateTo("schedule", deviceId)
        }}
        onWiFiConfig={handleWiFiConfig}
        onEditDevice={handleEditDevice}
      />

      {/* Pairing Modal */}
      <PairingModal
        isOpen={showPairing}
        onClose={() => setShowPairing(false)}
        onDeviceAdded={() => {
          setShowPairing(false)
          mutate()
        }}
        userEmail={email}
        deviceStates={deviceStates}
      />

      {/* Add Schedule Modal */}
      <AddScheduleModal
        isOpen={showAddSchedule}
        onClose={() => {
          setShowAddSchedule(false)
          setEditingSchedule(null)
        }}
        onSave={(schedule) => {
          if (editingSchedule) {
            // updateSchedule({ ...schedule, id: editingSchedule.id })
          } else {
            addSchedule(schedule)
          }
          setShowAddSchedule(false)
          setEditingSchedule(null)
        }}
        editingSchedule={editingSchedule}
      />

      {/* WiFi Configuration Modal */}
      <WiFiConfigModal
        isOpen={showWiFiConfig}
        onClose={() => {
          setShowWiFiConfig(false)
          setWiFiConfigDevice(null)
        }}
        email={email}
        deviceName={wifiConfigDevice?.name || ""}
        onConfigSent={() => {
          setShowWiFiConfig(false)
          setWiFiConfigDevice(null)
        }}
        deviceStates={deviceStates}
      />

      {/* Edit Device Modal */}
      <EditDeviceModal
        isOpen={showEditDevice}
        onClose={() => {
          setShowEditDevice(false)
          setEditingDevice(null)
        }}
        deviceId={editingDevice?.id || ""}
        currentName={editingDevice?.name || ""}
        onSave={handleDeviceNameSaved}
      />
    </div>
  )
}
