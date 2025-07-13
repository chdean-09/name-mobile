"use client"

import { useEffect, useRef, useState } from "react"
import { BluetoothSearching, Bluetooth, ArrowLeft, Eye, EyeOff } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BleClient, BleDevice } from '@capacitor-community/bluetooth-le';
import { CapacitorWifiConnect } from "@falconeta/capacitor-wifi-connect";
import { Label } from "./ui/label"
import { Input } from "./ui/input"

interface AvailableDevice {
  id: string
  name: string
  ipAddress: string
  signal: number
  device: BleDevice
}

interface AddDeviceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  email: string
}

export function AddDeviceDialog({ open, onOpenChange, email }: AddDeviceDialogProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [availableDevices, setAvailableDevices] = useState<AvailableDevice[]>([])
  const [ssid, setSSID] = useState<string | null>(null)

  const [selectedDevice, setSelectedDevice] = useState<AvailableDevice | null>(null)
  const [customName, setCustomName] = useState("")
  const [password, setPassword] = useState("")

  const [show, setShow] = useState(false)

  const hasScannedRef = useRef(false)

  const deviceService = 'f92a1d0c-cd74-40b9-b7c1-806d8fe67c81';

  useEffect(() => {
    const getSSID = async () => {
      const data = await CapacitorWifiConnect.getDeviceSSID()
      setSSID(data.value)
    }

    getSSID();
  })

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
          services: [deviceService],
        },
        (result) => {
          const deviceId = result.device.deviceId
          const name = result.device.name ?? "Unnamed Device"

          // Avoid duplicates
          if (!discovered.has(deviceId)) {
            discovered.set(deviceId, {
              id: deviceId,
              name,
              ipAddress: "",
              signal: result.rssi ?? 0,
              device: result.device, // store the whole device
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

  const handleAddDevice = async (availableDevice: AvailableDevice, data: { name: string; password: string }) => {
    setIsAdding(true)
    try {
      await sendCredentialsOverBLE(availableDevice.device)
      console.log("Sending credentials over BLE...", data.name, data.password, ssid)

      // await fetch("https://name-server-production.up.railway.app/api/device-list", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json"
      //   },
      //   body: JSON.stringify({
      //     name: data.name,
      //   })
      // })

      onOpenChange(false)
    } catch (error) {
      console.error("❌ Failed to add device:", error)
    } finally {
      setIsAdding(false)
    }
  }

  const sendCredentialsOverBLE = async (device: BleDevice) => {
    try {
      await BleClient.connect(device.deviceId)

      const service = "f92a1d0c-cd74-40b9-b7c1-806d8fe67c81"
      const characteristic = "4deee94e-85f5-4caf-a388-49182aaa1adb"

      const jsonPayload = JSON.stringify({
        ssid: ssid,
        pass: password,
        deviceName: customName,
        userEmail: email
      });

      const encoder = new TextEncoder();
      const data = encoder.encode(jsonPayload);
      const dataView = new DataView(data.buffer);

      await BleClient.write(device.deviceId, service, characteristic, dataView)

      console.log("✅ Sent credentials to device!")
      await BleClient.disconnect(device.deviceId)
    } catch (err) {
      console.error("❌ Failed to send credentials:", err)
    }
  }

  const handleDeviceSelect = (device: AvailableDevice) => {
    setSelectedDevice(device)
    setCustomName(device.name) // Pre-fill with original name
    setPassword("")
  }

  const handleConfirmAdd = () => {
    if (selectedDevice) {
      handleAddDevice(selectedDevice, { name: customName, password })
      // Reset form
      setSelectedDevice(null)
      setCustomName("")
      setPassword("")
    }
  }

  const handleBack = () => {
    setSelectedDevice(null)
    setCustomName("")
    setPassword("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full h-fit overflow-y-hidden">
        <DialogHeader>
          <DialogTitle>{selectedDevice ? "Configure Device" : "Add New Device"}</DialogTitle>
          <DialogDescription className="text-blue-200">
            {selectedDevice
              ? "Enter a custom name and password for your device."
              : "Scan for available ESP32 door lock devices on your network."}
          </DialogDescription>
        </DialogHeader>

        {!selectedDevice ? (
          // Device List View
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Available Devices</h3>
              <Button
                onClick={handleScan}
                disabled={scanning}
                variant="outline"
                className="text-black dark:text-white bg-transparent"
              >
                <BluetoothSearching className="mr-2 h-4 w-4" />
                {scanning ? "Scanning..." : "Scan Devices"}
              </Button>
            </div>
            <div className="space-y-2 h-fit max-h-[420px] overflow-y-scroll">
              {availableDevices.length === 0 && !scanning && (
                <p className="text-sm text-blue-200">
                  No devices found. Click &quot;Scan Network&quot; to search for ESP32 devices.
                </p>
              )}
              {availableDevices.map((device) => (
                <Card
                  key={device.id}
                  className="cursor-pointer bg-black/10 backdrop-blur-xl border border-black/20 text-slate-200 hover:bg-black/20 transition-colors"
                  onClick={() => handleDeviceSelect(device)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Bluetooth className="h-5 w-5" />
                        <div>
                          <p className="font-medium">{device.name}</p>
                          <p className="text-sm text-muted-foreground">{device.ipAddress}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-blue-200">
                        Signal: {device.signal}%
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {scanning && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-blue-200 mt-2">Scanning for devices...</p>
              </div>
            )}
          </div>
        ) : (
          // Device Configuration View
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleBack} className="p-1">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-3">
                <div>
                  <p className="font-medium">{selectedDevice.name}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="device-name">Device Name (Optional)</Label>
                <Input
                  id="device-name"
                  placeholder="Enter custom device name"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="bg-black/10 backdrop-blur-xl border-black/20"
                />
                <p className="text-xs text-blue-200">Ignore to use the default name: {selectedDevice.name}</p>
              </div>

              <div className="space-y-2">
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <p className="font-medium text-sm">Currently Connected:</p>
                  </div>
                  <p className="text-lg font-semibold">{ssid || "Loading..."}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="device-password">Password *</Label>
                <div className="relative">
                  <Input
                    id="device-password"
                    type={show ? "text" : "password"}
                    placeholder="Enter device password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-black/10 backdrop-blur-xl border-black/20 pr-10"
                    required
                  />
                  <Button
                    variant="link"
                    type="button"
                    onClick={() => setShow((prev) => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-200"
                  >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-blue-200">Required to connect to the device</p>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-3">
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-xs text-black font-bold">!</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-200 mb-1">Want to use a different network?</p>
                    <p className="text-xs text-amber-300/80">
                      To connect your device to a different WiFi network, please connect your phone to that network
                      first, then restart this setup process. <span className="font-extrabold">Warning: This device only supports 2.4GHz WiFi networks.</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={handleBack} className="flex-1 bg-transparent">
                Cancel
              </Button>
              <Button onClick={handleConfirmAdd} disabled={!password.trim() || isAdding} className="flex-1">
                {isAdding ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full"></div>
                    Adding...
                  </span>
                ) : (
                  "Add Device"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
