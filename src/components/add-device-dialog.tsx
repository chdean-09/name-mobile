"use client"

import { useEffect, useRef, useState } from "react"
import { Wifi, Search, BluetoothSearching } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BleClient } from '@capacitor-community/bluetooth-le';

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
  const [availableDevices, setAvailableDevices] = useState<AvailableDevice[]>([])

  const hasScannedRef = useRef(false)

  useEffect(() => {
    if (open && !hasScannedRef.current) {
      hasScannedRef.current = true
      handleScan()
    }

    if (!open) {
      hasScannedRef.current = false
    }
  }, [open])

  const ensureBluetoothOn = async () => {
    try {
      await BleClient.initialize();

      const isEnabled = await BleClient.isEnabled();
      if (!isEnabled) {
        await BleClient.requestEnable();
      }

    } catch (err) {
      console.error("Bluetooth init failed:", err);
    }
  };

  const handleScan = async () => {
    setScanning(true)
    setAvailableDevices([])

    try {
      await ensureBluetoothOn();

      const discovered = new Map<string, AvailableDevice>()

      await BleClient.requestLEScan(
        {
          services: []
        },
        (result) => {
          const deviceId = result.device.deviceId
          const name = result.device.name ?? "Unnamed Device"

          if (!name.startsWith("ESP-N.A.M.E-")) return

          // Avoid duplicates
          if (!discovered.has(deviceId)) {
            discovered.set(deviceId, {
              id: deviceId,
              name,
              ipAddress: "", // You won’t get IP from BLE
              signal: result.rssi ?? 0
            })
          }
        }
      )

      setTimeout(async () => {
        await BleClient.stopLEScan()
        setAvailableDevices(Array.from(discovered.values()))
        setScanning(false)
      }, 3000)
    } catch (error) {
      console.error("Scan failed", error)
      setScanning(false)
    }
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
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Available Devices</h3>
            <Button onClick={handleScan} disabled={scanning} variant="outline">
              <BluetoothSearching className="mr-2 h-4 w-4" />
              {scanning ? "Scanning..." : "Scan Devices"}
            </Button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {availableDevices.length === 0 && !scanning && (
              <p className="text-sm text-muted-foreground">No devices found. Click &quot;Scan Network&quot; to search for ESP32 devices.</p>
            )}
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
