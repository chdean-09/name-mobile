"use client"

import { useState } from "react"
import { Wifi, Search } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Device {
  name: string
  ipAddress: string
  status: "locked" | "unlocked"
  isOnline: boolean
  lastSeen: string
}

interface AvailableDevice {
  id: string
  name: string
  ipAddress: string
  signal: number
}

interface AddDeviceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddDevice: (device: Device) => void
}

export function AddDeviceDialog({ open, onOpenChange, onAddDevice }: AddDeviceDialogProps) {
  const [scanning, setScanning] = useState(false)
  const [deviceName, setDeviceName] = useState("")
  const [availableDevices] = useState<AvailableDevice[]>([
    {
      id: "esp-001",
      name: "ESP32-Door-Lock-001",
      ipAddress: "192.168.1.104",
      signal: 85,
    },
    {
      id: "esp-002",
      name: "ESP32-Door-Lock-002",
      ipAddress: "192.168.1.105",
      signal: 72,
    },
    {
      id: "esp-003",
      name: "ESP32-Door-Lock-003",
      ipAddress: "192.168.1.106",
      signal: 91,
    },
  ])

  const handleScan = () => {
    setScanning(true)
    // Simulate scanning
    setTimeout(() => {
      setScanning(false)
    }, 2000)
  }

  const handleAddDevice = (availableDevice: AvailableDevice) => {
    const newDevice: Device = {
      name: deviceName || availableDevice.name,
      ipAddress: availableDevice.ipAddress,
      status: "locked",
      isOnline: true,
      lastSeen: "Just now",
    }
    onAddDevice(newDevice)
    onOpenChange(false)
    setDeviceName("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Device</DialogTitle>
          <DialogDescription>Scan for available ESP32 door lock devices on your network.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="device-name">Device Name (Optional)</Label>
            <Input
              id="device-name"
              placeholder="e.g., Front Door, Back Door"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Available Devices</h3>
            <Button onClick={handleScan} disabled={scanning} variant="outline">
              <Search className="mr-2 h-4 w-4" />
              {scanning ? "Scanning..." : "Scan Network"}
            </Button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {availableDevices.map((device) => (
              <Card key={device.id} className="cursor-pointer hover:bg-accent" onClick={() => handleAddDevice(device)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Wifi className="h-5 w-5" />
                      <div>
                        <p className="font-medium">{device.name}</p>
                        <p className="text-sm text-muted-foreground">{device.ipAddress}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Signal: {device.signal}%</Badge>
                      <Button size="sm">Add</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {scanning && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Scanning for devices...</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
