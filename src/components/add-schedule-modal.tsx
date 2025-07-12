"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Lock, Unlock, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Schedule {
  id: string
  type: "lock" | "unlock"
  time: string
  days: string[]
  isEnabled: boolean
  deviceId: string
}

interface AddScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (schedule: Omit<Schedule, "id" | "deviceId">) => void
  editingSchedule?: Schedule | null
}

const DAYS = [
  { short: "Mon", full: "Monday" },
  { short: "Tue", full: "Tuesday" },
  { short: "Wed", full: "Wednesday" },
  { short: "Thu", full: "Thursday" },
  { short: "Fri", full: "Friday" },
  { short: "Sat", full: "Saturday" },
  { short: "Sun", full: "Sunday" },
]

export function AddScheduleModal({ isOpen, onClose, onSave, editingSchedule }: AddScheduleModalProps) {
  const [scheduleType, setScheduleType] = useState<"lock" | "unlock">("lock")
  const [selectedDays, setSelectedDays] = useState<string[]>([])
  const [selectedTime, setSelectedTime] = useState("21:00")
  const [currentStep, setCurrentStep] = useState<"type" | "time" | "days" | "confirm">("type")

  useEffect(() => {
    if (editingSchedule) {
      setScheduleType(editingSchedule.type)
      setSelectedDays(editingSchedule.days)
      setSelectedTime(editingSchedule.time)
      setCurrentStep("type")
    } else {
      setScheduleType("lock")
      setSelectedDays([])
      setSelectedTime("21:00")
      setCurrentStep("type")
    }
  }, [editingSchedule, isOpen])

  const toggleDay = (day: string) => {
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }
    setSelectedDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]))
  }

  const selectAllWeekdays = () => {
    setSelectedDays(["Mon", "Tue", "Wed", "Thu", "Fri"])
  }

  const selectWeekends = () => {
    setSelectedDays(["Sat", "Sun"])
  }

  const selectAllDays = () => {
    setSelectedDays(DAYS.map((d) => d.short))
  }

  const handleSave = () => {
    onSave({
      type: scheduleType,
      time: selectedTime,
      days: selectedDays,
      isEnabled: true,
    })
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour}:${minutes} ${ampm}`
  }

  const generateTimeOptions = () => {
    const times = []
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
        times.push(timeString)
      }
    }
    return times
  }

  const canProceed = () => {
    switch (currentStep) {
      case "type":
        return true
      case "time":
        return selectedTime !== ""
      case "days":
        return selectedDays.length > 0
      case "confirm":
        return true
      default:
        return false
    }
  }

  const nextStep = () => {
    switch (currentStep) {
      case "type":
        setCurrentStep("time")
        break
      case "time":
        setCurrentStep("days")
        break
      case "days":
        setCurrentStep("confirm")
        break
      case "confirm":
        handleSave()
        break
    }
  }

  const prevStep = () => {
    switch (currentStep) {
      case "time":
        setCurrentStep("type")
        break
      case "days":
        setCurrentStep("time")
        break
      case "confirm":
        setCurrentStep("days")
        break
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case "type":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Schedule Type</h3>
              <p className="text-slate-600 dark:text-slate-400">Choose what action to automate</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-6 rounded-3xl border-2 cursor-pointer transition-all ${
                  scheduleType === "lock"
                    ? "border-red-500 bg-red-50 dark:bg-red-950"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                }`}
                onClick={() => setScheduleType("lock")}
              >
                <div className="text-center space-y-3">
                  <div
                    className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center ${
                      scheduleType === "lock" ? "bg-red-500" : "bg-slate-200 dark:bg-slate-700"
                    }`}
                  >
                    <Lock className={`h-8 w-8 ${scheduleType === "lock" ? "text-white" : "text-slate-500"}`} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">Auto Lock</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Lock at specific times</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-6 rounded-3xl border-2 cursor-pointer transition-all ${
                  scheduleType === "unlock"
                    ? "border-green-500 bg-green-50 dark:bg-green-950"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                }`}
                onClick={() => setScheduleType("unlock")}
              >
                <div className="text-center space-y-3">
                  <div
                    className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center ${
                      scheduleType === "unlock" ? "bg-green-500" : "bg-slate-200 dark:bg-slate-700"
                    }`}
                  >
                    <Unlock className={`h-8 w-8 ${scheduleType === "unlock" ? "text-white" : "text-slate-500"}`} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">Auto Unlock</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Unlock at specific times</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )

      case "time":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Select Time</h3>
              <p className="text-slate-600 dark:text-slate-400">
                When should the door {scheduleType === "lock" ? "lock" : "unlock"}?
              </p>
            </div>

            <div className="text-center">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                className={`inline-flex items-center gap-3 p-6 rounded-3xl ${
                  scheduleType === "lock" ? "bg-red-50 dark:bg-red-950" : "bg-green-50 dark:bg-green-950"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    scheduleType === "lock" ? "bg-red-500" : "bg-green-500"
                  }`}
                >
                  {scheduleType === "lock" ? (
                    <Lock className="h-6 w-6 text-white" />
                  ) : (
                    <Unlock className="h-6 w-6 text-white" />
                  )}
                </div>
                <span className="text-4xl font-bold text-slate-900 dark:text-white">{formatTime(selectedTime)}</span>
              </motion.div>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2 bg-slate-50 dark:bg-slate-800 rounded-2xl p-4">
              {generateTimeOptions().map((time) => (
                <motion.div
                  key={time}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-3 rounded-2xl cursor-pointer transition-all ${
                    selectedTime === time
                      ? scheduleType === "lock"
                        ? "bg-red-500 text-white"
                        : "bg-green-500 text-white"
                      : "bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600"
                  }`}
                  onClick={() => setSelectedTime(time)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{formatTime(time)}</span>
                    {selectedTime === time && <Check className="h-4 w-4" />}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )

      case "days":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Select Days</h3>
              <p className="text-slate-600 dark:text-slate-400">Choose which days this schedule applies</p>
            </div>

            {/* Quick Select */}
            <div className="flex gap-2 justify-center">
              <Button variant="outline" size="sm" onClick={selectAllWeekdays} className="rounded-2xl bg-transparent">
                Weekdays
              </Button>
              <Button variant="outline" size="sm" onClick={selectWeekends} className="rounded-2xl bg-transparent">
                Weekends
              </Button>
              <Button variant="outline" size="sm" onClick={selectAllDays} className="rounded-2xl bg-transparent">
                Every Day
              </Button>
            </div>

            {/* Day Selection */}
            <div className="grid grid-cols-2 gap-3">
              {DAYS.map((day) => (
                <motion.div
                  key={day.short}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    selectedDays.includes(day.short)
                      ? scheduleType === "lock"
                        ? "border-red-500 bg-red-50 dark:bg-red-950"
                        : "border-green-500 bg-green-50 dark:bg-green-950"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  }`}
                  onClick={() => toggleDay(day.short)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">{day.full}</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{day.short}</p>
                    </div>
                    {selectedDays.includes(day.short) && (
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          scheduleType === "lock" ? "bg-red-500" : "bg-green-500"
                        }`}
                      >
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {selectedDays.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                <Badge
                  variant="secondary"
                  className={`text-sm px-4 py-2 ${
                    scheduleType === "lock"
                      ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  }`}
                >
                  {selectedDays.length} day{selectedDays.length !== 1 ? "s" : ""} selected
                </Badge>
              </motion.div>
            )}
          </div>
        )

      case "confirm":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Confirm Schedule</h3>
              <p className="text-slate-600 dark:text-slate-400">Review your schedule before saving</p>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-6 rounded-3xl border-2 ${
                scheduleType === "lock"
                  ? "border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800"
                  : "border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800"
              }`}
            >
              <div className="flex items-center gap-4 mb-4">
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                    scheduleType === "lock" ? "bg-red-500" : "bg-green-500"
                  }`}
                >
                  {scheduleType === "lock" ? (
                    <Lock className="h-8 w-8 text-white" />
                  ) : (
                    <Unlock className="h-8 w-8 text-white" />
                  )}
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                    Auto {scheduleType === "lock" ? "Lock" : "Unlock"}
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400">
                    {scheduleType === "lock" ? "Lock" : "Unlock"} at {formatTime(selectedTime)}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <h5 className="font-medium text-slate-900 dark:text-white mb-2">Days</h5>
                  <div className="flex flex-wrap gap-2">
                    {selectedDays.map((day) => (
                      <Badge
                        key={day}
                        variant="secondary"
                        className={`${
                          scheduleType === "lock"
                            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        }`}
                      >
                        {day}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h5 className="font-medium text-slate-900 dark:text-white mb-2">Summary</h5>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Your door will automatically {scheduleType} every {selectedDays.join(", ")} at{" "}
                    {formatTime(selectedTime)}.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-4 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {editingSchedule ? "Edit Schedule" : "Add Schedule"}
              </h2>
              <Button variant="ghost" size="icon" className="rounded-full" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto">{renderStep()}</div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === "type"}
                  className="rounded-2xl bg-transparent"
                >
                  Back
                </Button>

                <div className="flex items-center gap-2">
                  {["type", "time", "days", "confirm"].map((step, index) => (
                    <motion.div
                      key={step}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        step === currentStep
                          ? scheduleType === "lock"
                            ? "bg-red-500"
                            : "bg-green-500"
                          : index < ["type", "time", "days", "confirm"].indexOf(currentStep)
                            ? scheduleType === "lock"
                              ? "bg-red-300"
                              : "bg-green-300"
                            : "bg-slate-300 dark:bg-slate-600"
                      }`}
                      animate={{
                        scale: step === currentStep ? [1, 1.2, 1] : 1,
                      }}
                      transition={{
                        duration: 1,
                        repeat: step === currentStep ? Number.POSITIVE_INFINITY : 0,
                      }}
                    />
                  ))}
                </div>

                <Button
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className={`rounded-2xl ${
                    scheduleType === "lock"
                      ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                      : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                  }`}
                >
                  {currentStep === "confirm" ? "Save Schedule" : "Next"}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
