"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"

interface TimePickerWheelProps {
  value: string // Format: "HH:MM" in 24-hour format
  onChange: (time: string) => void
  className?: string
}

export function TimePickerWheel({ value, onChange, className }: TimePickerWheelProps) {
  const parseTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":").map(Number)
    const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
    const ampm = hours >= 12 ? "PM" : "AM"
    return { hour12, minutes, ampm }
  }

  const formatTime = (hour12: number, minutes: number, ampm: string) => {
    const hour24 = ampm === "AM" ? (hour12 === 12 ? 0 : hour12) : hour12 === 12 ? 12 : hour12 + 12
    return `${hour24.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
  }

  const { hour12: initialHour, minutes: initialMinutes, ampm: initialAmpm } = parseTime(value)

  const [selectedHour, setSelectedHour] = useState(initialHour)
  const [selectedMinute, setSelectedMinute] = useState(initialMinutes)
  const [selectedAmpm, setSelectedAmpm] = useState(initialAmpm)

  useEffect(() => {
    const newTime = formatTime(selectedHour, selectedMinute, selectedAmpm)
    onChange(newTime)
  }, [selectedHour, selectedMinute, selectedAmpm])

  const handleHourChange = (val: string) => {
    let h = parseInt(val)
    if (!isNaN(h)) {
      if (h < 1) h = 1
      if (h > 12) h = 12
      setSelectedHour(h)
    }
  }

  const handleMinuteChange = (val: string) => {
    let m = parseInt(val)
    if (!isNaN(m)) {
      if (m < 0) m = 0
      if (m > 59) m = 59
      setSelectedMinute(m)
    }
  }

  return (
    <div className={`flex items-center justify-center gap-6 ${className}`}>
      {/* Hour Picker */}
      <div className="flex flex-col items-center">
        <span className="text-xs text-slate-500 mb-2 font-medium">Hour</span>
        <Button variant="ghost" size="icon" onClick={() => setSelectedHour((prev) => (prev === 1 ? 12 : prev - 1))}>
          <ChevronUp className="h-4 w-4" />
        </Button>
        <input
          type="number"
          value={selectedHour}
          onChange={(e) => handleHourChange(e.target.value)}
          onFocus={(e) => e.target.select()}
          className="text-2xl w-16 text-center font-bold bg-slate-100 dark:bg-slate-800 rounded-lg py-2"
        />
        <Button variant="ghost" size="icon" onClick={() => setSelectedHour((prev) => (prev === 12 ? 1 : prev + 1))}>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>

      {/* Separator */}
      <div className="text-3xl font-bold text-slate-400">:</div>

      {/* Minute Picker */}
      <div className="flex flex-col items-center">
        <span className="text-xs text-slate-500 mb-2 font-medium">Minute</span>
        <Button variant="ghost" size="icon" onClick={() => setSelectedMinute((prev) => (prev === 0 ? 59 : prev - 1))}>
          <ChevronUp className="h-4 w-4" />
        </Button>
        <input
          type="number"
          value={selectedMinute.toString().padStart(2, "0")}
          onChange={(e) => handleMinuteChange(e.target.value)}
          onFocus={(e) => e.target.select()}
          className="text-2xl w-16 text-center font-bold bg-slate-100 dark:bg-slate-800 rounded-lg py-2"
        />
        <Button variant="ghost" size="icon" onClick={() => setSelectedMinute((prev) => (prev === 59 ? 0 : prev + 1))}>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>

      {/* AM/PM Picker */}
      <div className="flex flex-col items-center">
        <span className="text-xs text-slate-500 mb-2 font-medium">Period</span>
        <div className="space-y-2 mt-1">
          <Button
            variant={selectedAmpm === "AM" ? "default" : "secondary"}
            className="w-16"
            onClick={() => setSelectedAmpm("AM")}
          >
            AM
          </Button>
          <Button
            variant={selectedAmpm === "PM" ? "default" : "secondary"}
            className="w-16"
            onClick={() => setSelectedAmpm("PM")}
          >
            PM
          </Button>
        </div>
      </div>
    </div>
  )
}
