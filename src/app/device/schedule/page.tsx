"use client"

import { Suspense, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft,
  Plus,
  Clock,
  Lock,
  Unlock,
  Edit2,
  Trash2,
  MoreVertical,
  ToggleLeft,
  ToggleRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { useTransitionRouter } from "next-view-transitions"
import { useSearchParams } from "next/navigation"
import { AddScheduleModal } from "@/components/add-schedule-modal"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Schedule {
  id: string
  type: "lock" | "unlock"
  time: string
  days: string[]
  isEnabled: boolean
  deviceId: string
}

// const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
// const FULL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

function SchedulePage() {
  const router = useTransitionRouter()
  const searchParams = useSearchParams()
  const deviceId = searchParams.get('id') as string

  const [schedules, setSchedules] = useState<Schedule[]>([
    {
      id: "1",
      type: "lock",
      time: "21:00",
      days: ["Mon", "Wed", "Fri"],
      isEnabled: true,
      deviceId,
    },
    {
      id: "2",
      type: "lock",
      time: "20:00",
      days: ["Sat", "Sun"],
      isEnabled: true,
      deviceId,
    },
    {
      id: "3",
      type: "unlock",
      time: "08:00",
      days: ["Tue", "Thu", "Sat"],
      isEnabled: false,
      deviceId,
    },
  ])

  const [showAddModal, setShowAddModal] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)

  const goBack = () => {
    router.push(`/device/${deviceId}`)
  }

  const toggleSchedule = (scheduleId: string) => {
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }
    setSchedules((prev) =>
      prev.map((schedule) => (schedule.id === scheduleId ? { ...schedule, isEnabled: !schedule.isEnabled } : schedule)),
    )
  }

  const deleteSchedule = (scheduleId: string) => {
    setSchedules((prev) => prev.filter((schedule) => schedule.id !== scheduleId))
  }

  const editSchedule = (schedule: Schedule) => {
    setEditingSchedule(schedule)
    setShowAddModal(true)
  }

  const addSchedule = (newSchedule: Omit<Schedule, "id" | "deviceId">) => {
    const schedule: Schedule = {
      ...newSchedule,
      id: Date.now().toString(),
      deviceId,
    }
    setSchedules((prev) => [...prev, schedule])
  }

  const updateSchedule = (updatedSchedule: Omit<Schedule, "deviceId">) => {
    setSchedules((prev) =>
      prev.map((schedule) => (schedule.id === updatedSchedule.id ? { ...updatedSchedule, deviceId } : schedule)),
    )
  }

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

  const groupedSchedules = schedules.reduce(
    (acc, schedule) => {
      acc[schedule.type].push(schedule)
      return acc
    },
    { lock: [] as Schedule[], unlock: [] as Schedule[] },
  )

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex flex-col">
      {/* Status Bar Spacer */}
      <div className="h-6 bg-transparent flex-shrink-0" />

      {/* Fixed Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-white/20 flex-shrink-0"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
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
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Schedule</h1>
              <p className="text-sm text-slate-500">Automate your smart lock</p>
            </div>
          </div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-2xl"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </motion.div>
        </div>
      </motion.header>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="px-6 py-6 space-y-6">
          {schedules.length === 0 ? (
            <motion.div
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
                  onClick={() => setShowAddModal(true)}
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
                                  {schedule.isEnabled ? (
                                    <ToggleRight className="h-5 w-5 text-green-500" />
                                  ) : (
                                    <ToggleLeft className="h-5 w-5 text-slate-400" />
                                  )}
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                  {formatDays(schedule.days)}
                                </p>
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
                                  <DropdownMenuItem onClick={() => editSchedule(schedule)} className="rounded-xl">
                                    <Edit2 className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
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
                                  {schedule.isEnabled ? (
                                    <ToggleRight className="h-5 w-5 text-green-500" />
                                  ) : (
                                    <ToggleLeft className="h-5 w-5 text-slate-400" />
                                  )}
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                  {formatDays(schedule.days)}
                                </p>
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
                                  <DropdownMenuItem onClick={() => editSchedule(schedule)} className="rounded-xl">
                                    <Edit2 className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
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
        </div>
      </main>

      {/* Add Schedule Modal */}
      <AddScheduleModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setEditingSchedule(null)
        }}
        onSave={(schedule) => {
          if (editingSchedule) {
            updateSchedule({ ...schedule, id: editingSchedule.id })
          } else {
            addSchedule(schedule)
          }
          setShowAddModal(false)
          setEditingSchedule(null)
        }}
        editingSchedule={editingSchedule}
      />
    </div>
  )
}

export default function SchedulePageWrapper() {
  return (
    <Suspense fallback={<div>Loading schedules...</div>}>
      <SchedulePage />
    </Suspense>
  )
}