"use client"

import { useState } from "react"
import { Plus, Lock, Unlock, Edit2, Clock, DoorOpen, DoorClosed, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AddDeviceDialog } from "@/components/add-device-dialog"
import LogoHeader from "./logo-header"
// import { ScheduleDialog } from "./schedule-dialog"
import { useDeviceWebSocket } from "./websocket"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

import useSWR from 'swr'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { DialogClose } from "@radix-ui/react-dialog"

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
  status: "locked" | "unlocked"
  isOnline: boolean
  schedules: Schedule[]
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function DoorLockDashboard() {
  const socketRef = useDeviceWebSocket()
  const { data, error, isLoading } = useSWR<Device[]>(`https://name-server-production.up.railway.app/device-list`, fetcher, {refreshInterval: 500})

  console.log("data from server:", data)

  const [showAddDevice, setShowAddDevice] = useState(false)
  const [editingDevice, setEditingDevice] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  // const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  // const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null)
  const [lockStates, setLockStates] = useState<Record<string, boolean>>({})
  const [lockChanging, setLockChanging] = useState<Record<string, boolean>>({});


  const toggleDeviceLock = (deviceId: string, newState: boolean) => {
    // Show spinner/disable switch
    setLockChanging((prev) => ({ ...prev, [deviceId]: true }));

    // Optimistically update UI
    setLockStates((prev) => ({ ...prev, [deviceId]: newState }));

    // Send command
    socketRef.send(deviceId, newState ? "lock" : "unlock");

    // Wait for confirmation from ESP
    setTimeout(() => {
      const actualLockState = socketRef.deviceStates[deviceId].lock === "locked";

      if (actualLockState !== newState) {
        console.warn("⛔ Lock state mismatch. Reverting toggle.");
        setLockStates((prev) => ({ ...prev, [deviceId]: actualLockState }));
      }

      setLockChanging((prev) => ({ ...prev, [deviceId]: false }));
    }, 1000);
  }

  const updateDeviceName = async (deviceId: string, newName: string) => {
    await fetch(`https://name-server-production.up.railway.app/device-list/${deviceId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ newName }),
    })
    setEditingDevice(null)
    setEditingName("")
  }

  const startEditing = (device: Device) => {
    setEditingDevice(device.id)
    setEditingName(device.name)
  }

  const cancelEditing = () => {
    setEditingDevice(null)
    setEditingName("")
  }

  const handleDelete = async (deviceId: string) => {
    await fetch(`https://name-server-production.up.railway.app/device-list/${deviceId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })
  }

  // const openScheduleDialog = (deviceId: string) => {
  //   setSelectedDeviceId(deviceId)
  //   setShowScheduleDialog(true)
  // }

  // const addSchedule = async (deviceId: string, schedule: Omit<Schedule, "id">) => {
  //   await fetch(`https://name-server-production.up.railway.app/schedule`, {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //     body: JSON.stringify({ deviceId, schedule }),
  //   })
  // }

  // const deleteSchedule = async (scheduleId: string) => {
  //   await fetch(`https://name-server-production.up.railway.app/schedule/${scheduleId}`, {
  //     method: "DELETE",
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //   })
  // }

  return (
    <>
      <AppSidebar />
      <SidebarInset>
        <div className="flex h-full flex-col">
          <header
            className="flex items-center justify-between border-b px-4 py-1 h-fit dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-700 bg-gradient-to-bl from-slate-50 to-slate-400"
            style={{
              paddingTop: "var(--safe-area-inset-top)",
            }}
          >
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-mr-2" />
              <LogoHeader withName={false} />
            </div>

            <Button
              onClick={() => setShowAddDevice(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-400 dark:text-blue-300 hover:text-blue-500 shadow-sm transition rounded-lg"
              variant="outline"
            >
              <Plus className="h-4 w-4" />
              Add Device
            </Button>
          </header>

          <main className="flex-1 overflow-auto p-6">
            <div className="mx-auto max-w-6xl space-y-6">
              {/* Device Management */}
              <div>
                <h2 className="text-2xl font-bold">Your Devices</h2>
              </div>

              {/* Devices Grid */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {error && <div className="text-red-500">Failed to load devices</div>}
                {isLoading && <div className="text-gray-500">Loading devices...</div>}
                {data?.length === 0 && (
                  <div className="text-center text-muted-foreground">
                    No devices registered yet.
                  </div>
                )}
                {data && data.map((device) => (
                  <Card
                    key={device.id}
                    className={`relative border transition-all duration-300 ${socketRef.deviceStates[device.id]?.buzzer ? "border-red-500 ring-2 ring-red-300 bg-red-200" : ""
                      }`}
                  >
                    <CardHeader className="-mb-5">
                      <div className="flex items-center justify-between">
                        {editingDevice === device.id ? (
                          <div className="flex flex-col gap-2 w-full sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-col gap-2 w-full sm:flex-row sm:items-center sm:gap-2 sm:flex-1">
                              <Input
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                className="text-lg font-semibold w-full"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    updateDeviceName(device.id, editingName)
                                  } else if (e.key === "Escape") {
                                    cancelEditing()
                                  }
                                }}
                                autoFocus
                              />
                              <div className="flex gap-2 w-full sm:w-auto">
                                <Button
                                  size="sm"
                                  onClick={() => updateDeviceName(device.id, editingName)}
                                  disabled={!editingName.trim()}
                                  className="flex-1 sm:flex-none"
                                >
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={cancelEditing}
                                  className="flex-1 sm:flex-none bg-transparent"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 group">
                            <CardTitle
                              className="text-lg cursor-pointer hover:text-primary transition-colors flex-1"
                              onClick={() => startEditing(device)}
                              title="Click to edit device name"
                            >
                              {device.name}
                            </CardTitle>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                              onClick={() => startEditing(device)}
                              title="Edit device name"
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={socketRef.deviceStatuses[device.id] ? "default" : "secondary"}
                            className={socketRef.deviceStatuses[device.id] ? "bg-green-500" : ""}
                          >
                            {socketRef.deviceStatuses[device.id] ? "Online" : "Offline"}
                          </Badge>

                          <Dialog>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DialogTrigger>
                                  <DropdownMenuItem
                                    className="text-red-500 focus:text-red-600"
                                  >
                                    Unpair Device
                                  </DropdownMenuItem>
                                </DialogTrigger>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Are you absolutely sure?</DialogTitle>
                                <DialogDescription>
                                  You will be unpaired with this device.
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <DialogClose asChild>
                                  <Button
                                    variant={"destructive"}
                                    onClick={() => handleDelete(device.id)}
                                  >
                                    Confirm
                                  </Button>
                                </DialogClose>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-muted-foreground tracking-wide uppercase">Device Status</h3>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {socketRef.deviceStates[device.id]?.sensor === "open" ? (
                            <DoorOpen className="h-5 w-5 text-yellow-500" />
                          ) : (
                            <DoorClosed className="h-5 w-5" />
                          )}
                          <span className="font-medium capitalize text-sm">
                            {socketRef.deviceStates[device.id]?.sensor === "open" ? "Door Open" : "Door Closed"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {socketRef.deviceStates[device.id]?.lock === "locked" ? (
                            <Lock className="h-5 w-5 text-red-500" />
                          ) : (
                            <Unlock className="h-5 w-5 text-green-500" />
                          )}
                          <span className="font-medium capitalize text-sm">
                            {socketRef.deviceStates[device.id]?.lock === "locked" ? "Locked" : "Unlocked"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label
                            htmlFor={`toggle-${device.id}`}
                            className="text-sm transition-colors duration-200 text-muted-foreground"
                          >
                            {lockStates[device.id] ? "Unlock" : "Lock"}
                          </Label>
                          <Switch
                            id={`toggle-${device.id}`}
                            checked={!!lockStates[device.id]}
                            onCheckedChange={(e) => toggleDeviceLock(device.id, e)}
                            disabled={!socketRef.deviceStatuses[device.id] || lockChanging[device.id]}
                          />
                        </div>
                      </div>

                      {/* Schedule Info */}
                      {device.schedules?.length > 0 && (
                        <div className="mt-3 p-2 rounded-lg bg-white/5 border border-white/10">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="h-3 w-3 text-blue-500" />
                            <span className="text-xs text-blue-500">Active Schedule</span>
                          </div>
                          {device.schedules.map((schedule) => (
                            <div key={schedule.id} className="text-xs">
                              {schedule.lockDay} {schedule.lockTime} → {schedule.unlockDay} {schedule.unlockTime}
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Schedule Button */}
                      {/* <Button
                        onClick={() => openScheduleDialog(device.id)}
                        variant="outline"
                        className="w-full"
                        disabled={!socketRef.deviceStatuses[device.id]}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {device.schedules?.length > 0 ? "Edit Schedule" : "Set Schedule"}
                      </Button> */}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </main>
        </div>
      </SidebarInset>

      <AddDeviceDialog open={showAddDevice} onOpenChange={setShowAddDevice} />

      {/* <ScheduleDialog
        open={showScheduleDialog}
        onOpenChange={setShowScheduleDialog}
        deviceId={selectedDeviceId}
        devices={data || []}
        onAddSchedule={addSchedule}
        onDeleteSchedule={deleteSchedule}
      /> */}
    </>
  )
}
