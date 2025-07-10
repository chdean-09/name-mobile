"use client"

import { useState } from "react"
import { Clock, Plus } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"

interface Schedule {
  id: string
  lockDay: string
  lockTime: string
  unlockDay: string
  unlockTime: string
  isActive: boolean
}

interface Device {
  id: string
  name: string
  schedules: Schedule[]
}

interface ScheduleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deviceId: string | null
  devices: Device[]
  onAddSchedule: (deviceId: string, schedule: Omit<Schedule, "id">) => void
  onDeleteSchedule: (deviceId: string, scheduleId: string) => void
}

const weekdayOptions = [
  { short: "Sun", full: "Sunday" },
  { short: "Mon", full: "Monday" },
  { short: "Tue", full: "Tuesday" },
  { short: "Wed", full: "Wednesday" },
  { short: "Thu", full: "Thursday" },
  { short: "Fri", full: "Friday" },
  { short: "Sat", full: "Saturday" },
]

export function ScheduleDialog({
  open,
  onOpenChange,
  deviceId,
  devices,
  onAddSchedule,
  onDeleteSchedule,
}: ScheduleDialogProps) {
  const [lockDay, setLockDay] = useState("Monday")
  const [lockTime, setLockTime] = useState("16:00")
  const [unlockDay, setUnlockDay] = useState("Wednesday")
  const [unlockTime, setUnlockTime] = useState("22:00")
  const [isActive, setIsActive] = useState(true)

  const device = devices.find((d) => d.id === deviceId)

  const handleSave = () => {
    if (!deviceId) return

    onAddSchedule(deviceId, {
      lockDay,
      lockTime,
      unlockDay,
      unlockTime,
      isActive,
    })

    onOpenChange(false)
  }

  const resetForm = () => {
    setLockDay("Monday")
    setLockTime("16:00")
    setUnlockDay("Wednesday")
    setUnlockTime("22:00")
    setIsActive(true)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open)
        if (!open) resetForm()
      }}
    >
      <DialogContent className="w-full max-h-[90vh] overflow-y-auto ">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-300" />
            Schedule Lock Times
          </DialogTitle>
          <DialogDescription className="text-blue-200">
            {device ? `Set automatic lock/unlock schedule for ${device.name}` : "Set automatic lock/unlock schedule"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Lock Settings */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lock-day" className="text-blue-200">
                  Lock Day
                </Label>
                <Select value={lockDay} onValueChange={setLockDay}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Lock Day" />
                  </SelectTrigger>
                  <SelectContent>
                    {weekdayOptions.map((day) => (
                      <SelectItem key={day.full} value={day.full}>
                        {day.full}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lock-time" className="text-blue-200">
                  Lock Time
                </Label>
                <Input
                  id="lock-time"
                  type="time"
                  value={lockTime}
                  onChange={(e) => setLockTime(e.target.value)}
                  className="bg-white/10 border-white/20 focus:border-blue-400 focus:ring-blue-400/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unlock-day" className="text-blue-200">
                  Unlock Day
                </Label>
                <Select value={unlockDay} onValueChange={setUnlockDay}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Unlock Day" />
                  </SelectTrigger>
                  <SelectContent>
                    {weekdayOptions.map((day) => (
                      <SelectItem key={day.full} value={day.full}>
                        {day.full}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="unlock-time" className="text-blue-200">
                  Unlock Time
                </Label>
                <Input
                  id="unlock-time"
                  type="time"
                  value={unlockTime}
                  onChange={(e) => setUnlockTime(e.target.value)}
                  className="bg-white/10 border-white/20 focus:border-blue-400 focus:ring-blue-400/20"
                />
              </div>
            </div>
          </div>

          {/* Current Schedules */}
          {device && device.schedules?.length > 0 && (
            <div className="space-y-2">
              <Label className="text-blue-200">Current Schedules</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {device.schedules.map((schedule) => (
                  <div key={schedule.id} className="p-3 rounded-lg bg-white/5 border border-white/10 text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">
                        {schedule.lockDay} {schedule.lockTime} → {schedule.unlockDay} {schedule.unlockTime}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDeleteSchedule(deviceId!, schedule.id)}
                        className="h-6 w-6 p-0 border-red-500/30 bg-red-500/10 text-red-200 hover:text-red-300 hover:bg-red-300/20 hover:border-red-500/50"
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            size="sm"
            className="flex-1 border-white/20 bg-white/10 text-white hover:bg-white/20"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            size="sm"
            className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white"
          >
            <Plus className="mr-2 h-3 w-3" />
            Add Schedule
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
