/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

<<<<<<< HEAD
import { useCallback, useEffect, useState } from "react"
import { Plus, Lock, Unlock, Edit2, Clock, DoorOpen, DoorClosed, MoreVertical } from "lucide-react"
=======
import { useState } from "react"
import { Plus, Lock, Unlock, Edit2, Settings } from "lucide-react"
>>>>>>> main
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AddDeviceDialog } from "@/components/add-device-dialog"
import { ConnectionStatusIndicator } from "@/components/connection-status"
import LogoHeader from "./logo-header"
<<<<<<< HEAD
// import { ScheduleDialog } from "./schedule-dialog"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

import useSWR from 'swr'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { DialogClose } from "@radix-ui/react-dialog"
import { socket } from "@/app/socket"

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

interface DeviceStatus {
  deviceId: string
  online: boolean
  deviceName: string
}
=======
import { useDeviceControl } from "@/hooks/use-device-control"
import { DeviceInfo, getDeviceService } from "@/services/device-service"
import { configService } from "@/services/config"
import { httpService } from "@/services/http"
import { webSocketService } from "@/services/websocket"
>>>>>>> main

interface DeviceState {
  deviceId: string
  lock: "locked" | "unlocked"
  sensor: "open" | "closed"
  buzzer: "on" | "off"
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

export function DoorLockDashboard() {
<<<<<<< HEAD
  const { data, error, isLoading } = useSWR<Device[]>(`https://name-server-production.up.railway.app/device-list`, fetcher, {
    refreshInterval: 500,
  });

  const email = "test@example.com" //change this soon

  const [showAddDevice, setShowAddDevice] = useState(false);
  const [editingDevice, setEditingDevice] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const [isConnected, setIsConnected] = useState(false);
  const [transport, setTransport] = useState("N/A");

  const [deviceStates, setDeviceStates] = useState<Record<string, Heartbeat>>({})
  const [joinedRooms, setJoinedRooms] = useState(new Set());

  const handleDeviceStatus = useCallback((data: Heartbeat) => {
    console.log("Received heartbeat payload:", JSON.stringify(data));

    setDeviceStates(prev => ({
      ...prev,
      [data.deviceId]: {
        deviceId: data.deviceId,
        deviceName: data.deviceName,
        online: data.online,
        lock: data.lock,
        sensor: data.sensor,
        buzzer: data.buzzer,
      },
    }))
  }, []);

  useEffect(() => {
    if (socket.connected) {
      onConnect();
    }

    function onConnect() {
      setIsConnected(true);
      setTransport(socket.io.engine.transport.name);

      socket.io.engine.on("upgrade", (transport) => {
        setTransport(transport.name);
      });
    }

    function onDisconnect() {
      setIsConnected(false);
      setTransport("N/A");
      setJoinedRooms(new Set());
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    socket.on("heartbeat", handleDeviceStatus);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("heartbeat", handleDeviceStatus);
    };
  }, [handleDeviceStatus]);

  useEffect(() => {
    if (isConnected && !isLoading && !error && data) {
      for (const device of data) {
        const roomKey = `${email}-device-${device.id}`;
        if (!joinedRooms.has(roomKey)) {
          socket.emit("join_as_mobile", {
            userEmail: email,
            deviceId: device.id
          });
          setJoinedRooms(prev => new Set(prev).add(roomKey));
        }
      }
    }
  }, [isConnected, isLoading, error, data, joinedRooms]);

  const toggleDeviceLock = (deviceId: string, newState: boolean) => {
    const message = {
      userEmail: email,
      deviceId: deviceId,
      command: newState ? "lock" : "unlock",
    }

    // Send command
    socket.emit("command", message);
  }

  const updateDeviceName = async (deviceId: string, newName: string) => {
    await fetch(`https://name-server-production.up.railway.app/device-list/${deviceId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ newName }),
    })
=======
  // Use device control hook with a user ID (you might want to get this from auth)
  const userId = "user-123"; // TODO: Get from authentication
  const {
    devices,
    connectionStatus,
    isLoading,
    error,
    toggleDeviceLock,
    toggleBuzzer,
    addDevice,
    clearError,
    retryConnection,
  } = useDeviceControl(userId);

  const [showAddDevice, setShowAddDevice] = useState(false)
  const [editingDevice, setEditingDevice] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const [showServerConfig, setShowServerConfig] = useState(false)
  const [serverIP, setServerIP] = useState('192.168.1.100') // Default IP for ESP32

  const handleToggleDeviceLock = async (deviceId: string) => {
    console.log(`Toggling lock for device ${deviceId}`);
    await toggleDeviceLock(deviceId);
  }

  const handleAddDevice = (device: { name: string; ipAddress: string; status: "locked" | "unlocked"; isOnline: boolean; lastSeen: string }) => {
    addDevice({
      name: device.name,
      ipAddress: device.ipAddress,
      status: device.status,
      isOnline: device.isOnline,
      lastSeen: device.lastSeen,
      buzzer: 'off', // Default buzzer state
    });
  }

  const updateDeviceName = (deviceId: string, newName: string) => {
    // TODO: Implement device name update in DeviceService
    // For now, we'll just close the editing state
    console.log(`Updating device ${deviceId} name to ${newName}`)
>>>>>>> main
    setEditingDevice(null)
    setEditingName("")
  }

  const startEditing = (device: DeviceInfo) => {
    setEditingDevice(device.id)
    setEditingName(device.name)
  }

  const cancelEditing = () => {
    setEditingDevice(null)
    setEditingName("")
  }

<<<<<<< HEAD
  const handleDelete = async (deviceId: string) => {
    await fetch(`https://name-server-production.up.railway.app/device-list/${deviceId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
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
=======
  const updateServerConfig = () => {
    const newWebSocketUrl = `ws://${serverIP}:8000`;
    const newHttpUrl = `http://${serverIP}:8000`;
    
    console.log(`Updating server config to: ${newHttpUrl}`);
    
    // Update config service
    configService.updateConfig({
      websocketUrl: newWebSocketUrl,
      httpBaseUrl: newHttpUrl,
    });
    
    // Update HTTP service URL  
    httpService.updateBaseUrl(newHttpUrl);
    
    // Update WebSocket service URL
    webSocketService.updateUrl(newWebSocketUrl);
    
    setShowServerConfig(false);
    
    // Trigger a retry connection
    retryConnection();
  }

  // Debug functions for testing WebSocket commands
  const testWebSocketCommands = async () => {
    console.log('Testing WebSocket commands...');
    const deviceService = getDeviceService(userId);
    if (devices.length > 0) {
      await deviceService.debugWebSocketCommands(devices[0].id);
    }
  }

  const testESP32Commands = async () => {
    console.log('Testing ESP32-specific commands...');
    const deviceService = getDeviceService(userId);
    await deviceService.testESP32Commands();
  }

  const sendRawCommand = async (event: string, data: Record<string, unknown>) => {
    console.log(`Sending raw command: ${event}`, data);
    const deviceService = getDeviceService(userId);
    await deviceService.sendRawMessage(event, data);
  }
>>>>>>> main

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
              <ConnectionStatusIndicator status={connectionStatus} />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setShowServerConfig(true)}
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 text-blue-400 dark:text-blue-300 hover:text-blue-500"
              >
                <Settings className="h-4 w-4" />
                Server
              </Button>
              <Button
                onClick={() => setShowAddDevice(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-400 dark:text-blue-300 hover:text-blue-500 shadow-sm transition rounded-lg"
                variant="outline"
              >
                <Plus className="h-4 w-4" />
                Add Device
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6">
            <div className="mx-auto max-w-6xl space-y-6">
              {/* Device Management */}
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Your Devices</h2>
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm max-w-md">
                    <div className="font-medium mb-2">Connection Issue</div>
                    <div className="mb-3">{error}</div>
                    <div className="flex gap-2">
                      {connectionStatus === 'disconnected' || connectionStatus === 'error' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            console.log('Retrying connection...');
                            await retryConnection();
                          }}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          Retry Connection
                        </Button>
                      ) : null}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearError}
                        className="text-red-600 hover:text-red-700"
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Loading indicator */}
              {isLoading && (
                <div className="text-center text-muted-foreground">
                  Loading...
                </div>
              )}

              {/* Devices Grid */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {isLoading && (
                  <div className="col-span-full flex items-center justify-center h-64">
                    <span className="text-gray-500">Loading devices...</span>
                  </div>
                )}
                {error && (
                  <div className="col-span-full flex items-center justify-center h-64">
                    <span className="text-red-500">Failed to load devices</span>
                  </div>
                )}
                {data && data.length === 0 && (
                  <div className="col-span-full flex items-center justify-center h-64">
                    <span className="text-gray-500">No devices found. Click &quot;Add Device&quot; to get started.</span>
                  </div>
                )}
                {data && data.map((device) => (
                  <Card
                    key={device.id}
                    className={`relative border transition-all duration-300 ${deviceStates[device.id]?.buzzer === "on" ? "border-red-500 ring-2 ring-red-300 bg-red-200" : ""
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
                            variant={deviceStates[device.id]?.online ? "default" : "secondary"}
                            className={deviceStates[device.id]?.online ? "bg-green-500" : ""}
                          >
                            {deviceStates[device.id]?.online ? "Online" : "Offline"}
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
<<<<<<< HEAD
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-muted-foreground tracking-wide uppercase">Device Status</h3>
                      </div>

=======
                      {/* Door Lock Control */}
>>>>>>> main
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {deviceStates[device.id] ? (deviceStates[device.id]?.sensor === "open" ? (
                            <DoorOpen className="h-5 w-5 text-yellow-500" />
                          ) : (
                            <DoorClosed className="h-5 w-5" />
                          )) : "Unknown State"}
                          <span className="font-medium capitalize text-sm">
                            {deviceStates[device.id] ? (deviceStates[device.id]?.sensor === "open" ? "Door Open" : "Door Closed") : "N/A"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {deviceStates[device.id] ? (deviceStates[device.id].lock === "locked" ? (
                            <Lock className="h-5 w-5 text-red-500" />
                          ) : (
                            <Unlock className="h-5 w-5 text-green-500" />
                          )) : "Unknown State"}
                          <span className="font-medium capitalize text-sm">
                            {deviceStates[device.id] ? deviceStates[device.id].lock === "locked" ? "Locked" : "Unlocked" : "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label
                            htmlFor={`toggle-${device.id}`}
                            className="text-sm transition-colors duration-200 text-muted-foreground"
                          >
                            {deviceStates[device.id]?.lock ? "Unlock" : "Lock"}
                          </Label>
                          <Switch
                            id={`toggle-${device.id}`}
<<<<<<< HEAD
                            checked={deviceStates[device.id]?.lock === "locked"}
                            onCheckedChange={(e) => toggleDeviceLock(device.id, e)}
                            disabled={!deviceStates[device.id] || !deviceStates[device.id]?.online}
=======
                            checked={device.status === "unlocked"}
                            onCheckedChange={() => handleToggleDeviceLock(device.id)}
                            disabled={!device.isOnline || isLoading}
>>>>>>> main
                          />
                        </div>
                      </div>

<<<<<<< HEAD
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
=======
                      {/* Buzzer Control */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full ${device.buzzer === "on" ? "bg-yellow-500" : "bg-gray-400"}`} />
                          <span className="font-medium">Buzzer {device.buzzer === "on" ? "On" : "Off"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`buzzer-${device.id}`} className="text-sm">
                            {device.buzzer === "off" ? "Turn On" : "Turn Off"}
                          </Label>
                          <Switch
                            id={`buzzer-${device.id}`}
                            checked={device.buzzer === "on"}
                            onCheckedChange={() => toggleBuzzer(device.id)}
                            disabled={!device.isOnline || isLoading}
                          />
                        </div>
                      </div>

                      {/* Door and buzzer status display */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${device.status === 'locked' ? 'bg-red-500' : 'bg-green-500'}`} />
                          <span>Door: {device.status === 'locked' ? 'Locked' : 'Unlocked'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${device.buzzer === 'on' ? 'bg-yellow-500' : 'bg-gray-400'}`} />
                          <span>Buzzer: {device.buzzer === 'on' ? 'On' : 'Off'}</span>
                        </div>
                      </div>
>>>>>>> main
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Debug Controls - only show when connected and devices exist */}
              {connectionStatus === 'connected' && devices.length > 0 && (
                <div className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Debug Controls</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="text-sm text-muted-foreground">
                          Use these buttons to test different WebSocket command formats with your ESP32 backend.
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={testWebSocketCommands}
                            disabled={isLoading}
                          >
                            Test WebSocket Commands
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={testESP32Commands}
                            disabled={isLoading}
                          >
                            Test ESP32 Commands
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => sendRawCommand('unlock', {})}
                            disabled={isLoading}
                          >
                            Send Raw &quot;unlock&quot;
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => sendRawCommand('lock', {})}
                            disabled={isLoading}
                          >
                            Send Raw &quot;lock&quot;
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => sendRawCommand('door', { action: 'unlock' })}
                            disabled={isLoading}
                          >
                            Send &quot;door&quot; Event
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => sendRawCommand('cmd', { door: 'unlock' })}
                            disabled={isLoading}
                          >
                            Send &quot;cmd&quot; Event
                          </Button>
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          Watch the browser console for detailed logs of sent messages and backend responses.
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* No devices message */}
              {devices.length === 0 && !isLoading && (
                <div className="text-center text-muted-foreground py-8">
                  {connectionStatus === 'connected' ? (
                    <>
                      <p className="mb-4">No devices found. Add your first ESP32 door lock to get started.</p>
                      <Button onClick={() => setShowAddDevice(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Device
                      </Button>
                    </>
                  ) : (
                    <div className="max-w-md mx-auto">
                      <div className="mb-4">
                        <p className="text-lg font-medium text-muted-foreground mb-2">Connection Required</p>
                        <p className="text-sm">
                          {connectionStatus === 'disconnected' || connectionStatus === 'error' 
                            ? 'Cannot connect to your ESP32 server. Make sure it\'s running and click Server button to set the correct IP address.'
                            : connectionStatus === 'connecting' 
                            ? 'Connecting to ESP32 server...'
                            : 'Checking connection...'}
                        </p>
                      </div>
                      <div className="flex gap-2 justify-center">
                        <Button 
                          onClick={async () => await retryConnection()}
                          disabled={connectionStatus === 'connecting'}
                        >
                          {connectionStatus === 'connecting' ? 'Connecting...' : 'Retry Connection'}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setShowServerConfig(true)}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Server Config
                        </Button>
                        <Button variant="outline" onClick={() => setShowAddDevice(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Device (HTTP Only)
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </main>
        </div>
      </SidebarInset>

<<<<<<< HEAD
      <AddDeviceDialog open={showAddDevice} onOpenChange={setShowAddDevice} email={email} />

      {/* <ScheduleDialog
          open={showScheduleDialog}
          onOpenChange={setShowScheduleDialog}
          deviceId={selectedDeviceId}
          devices={data || []}
          onAddSchedule={addSchedule}
          onDeleteSchedule={deleteSchedule}
        /> */}
=======
      <AddDeviceDialog open={showAddDevice} onOpenChange={setShowAddDevice} onAddDevice={handleAddDevice} />
      
      {/* Server Configuration Dialog */}
      <Dialog open={showServerConfig} onOpenChange={setShowServerConfig}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ESP32 Server Configuration</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="server-ip">ESP32 Server IP Address</Label>
              <Input
                id="server-ip"
                value={serverIP}
                onChange={(e) => setServerIP(e.target.value)}
                placeholder="e.g., 192.168.1.100"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter the IP address of your ESP32 device. Find it in your router settings or ESP32 serial monitor.
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={updateServerConfig} className="flex-1">
                Update & Connect
              </Button>
              <Button variant="outline" onClick={() => setShowServerConfig(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
>>>>>>> main
    </>
  )
}

