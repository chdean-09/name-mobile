"use client"

import { useEffect, useRef, useState } from "react"
<<<<<<< HEAD
import { BluetoothSearching, Bluetooth, ArrowLeft, Eye, EyeOff } from "lucide-react"
=======
import { BluetoothSearching, Bluetooth, Wifi, Eye, EyeOff } from "lucide-react"
>>>>>>> main
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
<<<<<<< HEAD
import { BleClient, BleDevice } from '@capacitor-community/bluetooth-le';
import { CapacitorWifiConnect } from "@falconeta/capacitor-wifi-connect";
import { Label } from "./ui/label"
import { Input } from "./ui/input"
=======
import { BleClient, BluetoothLe, ScanMode } from '@capacitor-community/bluetooth-le';
import { Capacitor } from "@capacitor/core"

// BLE Service and Characteristic UUIDs for WiFi configuration
const WIFI_SERVICE_UUID = "12345678-1234-5678-9abc-123456789abc"
const WIFI_CREDENTIAL_CHARACTERISTIC_UUID = "87654321-4321-4321-4321-cba987654321"
const WIFI_STATUS_CHARACTERISTIC_UUID = "11111111-2222-3333-4444-555555555555"

interface Device {
  name: string
  ipAddress: string
  status: "locked" | "unlocked"
  isOnline: boolean
  lastSeen: string
}
>>>>>>> main

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
<<<<<<< HEAD
  const [ssid, setSSID] = useState<string | null>(null)

  const [selectedDevice, setSelectedDevice] = useState<AvailableDevice | null>(null)
  const [customName, setCustomName] = useState("")
  const [password, setPassword] = useState("")

  const [show, setShow] = useState(false)
=======
  const [error, setError] = useState<string | null>(null)
  
  // WiFi configuration state
  const [showWifiConfig, setShowWifiConfig] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<AvailableDevice | null>(null)
  const [ssid, setSsid] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [configuring, setConfiguring] = useState(false)
  const [connectedDeviceId, setConnectedDeviceId] = useState<string | null>(null)
>>>>>>> main

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
    setError(null) // Clear any previous errors
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
      const isEnabled = await BleClient.isEnabled();
      if (!isEnabled) {
        try {
          await BleClient.requestEnable();
        } catch (e) {
          console.error("Failed to enable Bluetooth:", e);
          return false;
        }
      }

      return true;
    } catch (err) {
      console.error("Bluetooth init failed:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown Bluetooth error";
      setError(errorMessage);
      return false;
    }
  };

  // Connect to ESP32 and configure WiFi
  const connectAndConfigureWifi = async (device: AvailableDevice) => {
    setConfiguring(true);
    setError(null);

    try {
      console.log('Connecting to device:', device.name);
      
      // Connect to the device
      await BleClient.connect(device.id);
      setConnectedDeviceId(device.id);
      
      console.log('Connected successfully, discovering services...');
      
      // Discover all services and characteristics
      const services = await BleClient.getServices(device.id);
      console.log('Available services:', services);
      
      // Log all services and characteristics for debugging
      services.forEach(service => {
        console.log(`Service: ${service.uuid}`);
        service.characteristics?.forEach(char => {
          console.log(`  Characteristic: ${char.uuid}, properties:`, char.properties);
        });
      });
      
      // Try to find the WiFi service - look for the service we expect or try common ones
      let wifiService = services.find(s => s.uuid.toLowerCase() === WIFI_SERVICE_UUID.toLowerCase());
      
      if (!wifiService) {
        // If our expected service isn't found, try to find any custom service (not standard BLE services)
        const customServices = services.filter(s => 
          !s.uuid.startsWith('0000180') && // Standard BLE services start with 0000180x
          !s.uuid.startsWith('0000181') &&
          s.uuid.length > 8 // Custom UUIDs are longer
        );
        
        console.log('Custom services found:', customServices);
        
        if (customServices.length > 0) {
          wifiService = customServices[0]; // Use the first custom service
          console.log('Using custom service:', wifiService.uuid);
        }
      }
      
      if (!wifiService) {
        throw new Error('No WiFi configuration service found. Make sure your ESP32 is advertising the correct BLE service.');
      }
      
      console.log('Using WiFi service:', wifiService.uuid);
      
      // Find the credential and status characteristics
      const credentialChar = wifiService.characteristics?.find(c => 
        c.uuid.toLowerCase() === WIFI_CREDENTIAL_CHARACTERISTIC_UUID.toLowerCase() ||
        (c.properties?.write || c.properties?.writeWithoutResponse)
      );
      
      const statusChar = wifiService.characteristics?.find(c => 
        c.uuid.toLowerCase() === WIFI_STATUS_CHARACTERISTIC_UUID.toLowerCase() ||
        (c.properties?.read || c.properties?.notify)
      );
      
      if (!credentialChar) {
        throw new Error('WiFi credential characteristic not found. Available characteristics: ' + 
          wifiService.characteristics?.map(c => `${c.uuid} (${Object.keys(c.properties || {}).join(', ')})`).join(', '));
      }
      
      console.log('Using credential characteristic:', credentialChar.uuid, 'with properties:', credentialChar.properties);
      
      if (!statusChar) {
        console.warn('Status characteristic not found, will skip status check');
      }
      
      console.log('Services discovered, configuring WiFi...');
      
      // Create JSON payload for WiFi credentials
      const wifiCredentials = {
        ssid: ssid,
        password: password
      };
      
      const jsonString = JSON.stringify(wifiCredentials);
      console.log('Sending WiFi credentials:', jsonString);
      
      // Convert to DataView for BLE write
      const credentialData = new TextEncoder().encode(jsonString);
      const dataView = new DataView(credentialData.buffer);
      
      console.log('Data to send - length:', credentialData.length, 'bytes');
      
      // Write WiFi credentials as JSON to the credential characteristic
      // Try writeWithoutResponse first if available, then fall back to write
      try {
        if (credentialChar.properties?.writeWithoutResponse) {
          console.log('Using writeWithoutResponse...');
          await BleClient.writeWithoutResponse(device.id, wifiService.uuid, credentialChar.uuid, dataView);
        } else {
          console.log('Using write with response...');
          await BleClient.write(device.id, wifiService.uuid, credentialChar.uuid, dataView);
        }
        console.log('WiFi credentials sent successfully');
      } catch (writeError) {
        console.error('Write failed with error:', writeError);
        
        // Try the alternative write method if the first one failed
        try {
          if (credentialChar.properties?.write && !credentialChar.properties?.writeWithoutResponse) {
            console.log('Retrying with writeWithoutResponse...');
            await BleClient.writeWithoutResponse(device.id, wifiService.uuid, credentialChar.uuid, dataView);
          } else {
            console.log('Retrying with write...');
            await BleClient.write(device.id, wifiService.uuid, credentialChar.uuid, dataView);
          }
          console.log('WiFi credentials sent successfully on retry');
        } catch (retryError) {
          throw new Error(`Failed to write WiFi credentials: ${writeError}. Retry also failed: ${retryError}`);
        }
      }
      
      console.log('WiFi credentials sent, waiting for connection status...');
      
      // Wait for ESP32 to process and connect (shorter timeout)
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      if (statusChar) {
        try {
          // Read status from status characteristic
          console.log('Reading status from characteristic:', statusChar.uuid);
          const statusData = await BleClient.read(device.id, wifiService.uuid, statusChar.uuid);
          const status = new TextDecoder().decode(statusData);
          
          console.log('WiFi configuration status:', status);
          
          if (status === 'WIFI_CONNECTED' || status === 'RUNNING') {
            // Successfully configured WiFi
            const newDevice = {
              name: deviceName || device.name,
              ipAddress: "192.168.1.100", // You might get this from ESP32 or discover it
              status: "locked" as const,
              isOnline: true,
              lastSeen: "Just now",
            };
            
            onAddDevice(newDevice);
            setShowWifiConfig(false);
            onOpenChange(false);
            resetForm();
          } else if (status === 'WIFI_FAILED') {
            setError('WiFi connection failed. Please check your credentials and try again.');
          } else {
            setError(`Configuration may have succeeded. Status: ${status || 'Unknown'}`);
            // Still add the device since we sent the credentials
            const newDevice = {
              name: deviceName || device.name,
              ipAddress: "192.168.1.100",
              status: "locked" as const,
              isOnline: true,
              lastSeen: "Just now",
            };
            onAddDevice(newDevice);
            setShowWifiConfig(false);
            onOpenChange(false);
            resetForm();
          }
        } catch (statusError) {
          console.warn('Could not read status, but credentials were sent:', statusError);
          // Assume success since we were able to send credentials
          setError('WiFi credentials sent successfully. Device should connect to your network shortly.');
          const newDevice = {
            name: deviceName || device.name,
            ipAddress: "192.168.1.100",
            status: "locked" as const,
            isOnline: true,
            lastSeen: "Just now",
          };
          onAddDevice(newDevice);
          setShowWifiConfig(false);
          onOpenChange(false);
          resetForm();
        }
      } else {
        // No status characteristic, assume success
        console.log('No status characteristic available, assuming success');
        setError('WiFi credentials sent successfully. Device should connect to your network shortly.');
        const newDevice = {
          name: deviceName || device.name,
          ipAddress: "192.168.1.100",
          status: "locked" as const,
          isOnline: true,
          lastSeen: "Just now",
        };
        onAddDevice(newDevice);
        setShowWifiConfig(false);
        onOpenChange(false);
        resetForm();
      }
      
    } catch (error) {
      console.error('WiFi configuration failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(`Configuration failed: ${errorMessage}`);
    } finally {
      // Disconnect from device
      if (connectedDeviceId) {
        try {
          await BleClient.disconnect(connectedDeviceId);
          setConnectedDeviceId(null);
        } catch (e) {
          console.log('Disconnect error (non-critical):', e);
        }
      }
      setConfiguring(false);
    }
  };

  const resetForm = () => {
    setSsid("");
    setPassword("");
    setDeviceName("");
    setSelectedDevice(null);
    setError(null);
  };

  const handleScan = async () => {
    setScanning(true)
    setAvailableDevices([])
    setError(null) // Clear any previous errors

    try {
      await BleClient.initialize({ androidNeverForLocation: true });
      if (Capacitor.getPlatform() === 'android') {
        const isLocationEnabled = await BleClient.isLocationEnabled();
        if (!isLocationEnabled) {
          await BleClient.openLocationSettings();
        }
      }

      const bluetoothOn = await ensureBluetoothOn();
      if (!bluetoothOn) {
        setScanning(false);
        setError("Failed to enable Bluetooth. Please enable it to scan for devices.");
        return;
      }

      const connectedDevices = await BleClient.getConnectedDevices([]);
      console.log('Connected devices:', connectedDevices.length);
      // Close each connection
      for (const device of connectedDevices) {
        await BleClient.disconnect(device.deviceId);
        console.log(`Closed GATT connection to: ${device.name || device.deviceId}`);
      }

      // await BleClient.stopLEScan().catch(() => {});

      console.log('Starting BLE scan...');

      const discovered = new Map<string, AvailableDevice>()

      await BleClient.requestLEScan(
<<<<<<< HEAD
        {
          services: [deviceService],
        },
=======
        { services: [], namePrefix: "ESP-Lock-" },
>>>>>>> main
        (result) => {
          console.log("Discovered device:", result.device.name || result.device.deviceId, "RSSI:", result.rssi)
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
        await BleClient.stopLEScan();
        setScanning(false);
        setAvailableDevices(Array.from(discovered.values()))
      }, 5000);
    } catch (error) {
      console.error("Scan failed", error)
      setScanning(false)

      const errorMessage = error instanceof Error ? error.message : String(error)
      setError(errorMessage)
    }
  }

<<<<<<< HEAD
  const handleAddDevice = async (availableDevice: AvailableDevice, data: { name: string; password: string }) => {
    setIsAdding(true)
    try {
      await sendCredentialsOverBLE(availableDevice.device)
      console.log("Sending credentials over BLE...", data.name, data.password, ssid)

      await fetch("https://name-server-production.up.railway.app/api/device-list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: data.name,
        })
      })

      onOpenChange(false)
    } catch (error) {
      console.error("❌ Failed to add device:", error)
    } finally {
      setIsAdding(false)
=======
  const handleDeviceSelect = (availableDevice: AvailableDevice) => {
    setSelectedDevice(availableDevice);
    setShowWifiConfig(true);
  };

  const handleAddDevice = (availableDevice: AvailableDevice) => {
    const newDevice = {
      name: deviceName || availableDevice.name,
      ipAddress: availableDevice.ipAddress,
      status: "locked" as const,
      isOnline: true,
      lastSeen: "Just now",
>>>>>>> main
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

<<<<<<< HEAD
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
=======
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Available Devices</h3>
            <Button onClick={handleScan} disabled={scanning} variant="outline" className="text-black dark:text-white">
              <BluetoothSearching className="mr-2 h-4 w-4" />
              {scanning ? "Scanning..." : "Scan Devices"}
            </Button>
          </div>

          <div className="space-y-2 h-fit max-h-[420px] overflow-y-scroll">
            {availableDevices.length === 0 && !scanning && !error && (
              <p className="text-sm text-blue-200">No devices found. Click &quot;Scan Network&quot; to search for ESP32 devices.</p>
            )}
            {availableDevices.length === 0 && !scanning && error && (
              <p className="text-sm text-blue-200">{error}</p>
            )}
            {availableDevices.map((device) => (
              <Card key={device.id} className="cursor-pointer bg-black/10 backdrop-blur-xl border border-black/20 text-slate-200" onClick={() => handleDeviceSelect(device)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bluetooth className="h-5 w-5" />
                      <div>
                        <p className="font-medium">{device.name}</p>
                        <p className="text-sm text-muted-foreground">Configure WiFi to connect</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-blue-200">Signal: {device.signal}%</Badge>
                      <Button size="sm">
                        <Wifi className="h-4 w-4 mr-1" />
                        Configure
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {scanning && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
              <p className="text-sm text-blue-200 mt-2">Scanning for devices...</p>
            </div>
          )}

          {/* WiFi Configuration Dialog */}
          {showWifiConfig && selectedDevice && (
            <div className="mt-6 p-4 border border-blue-300 rounded-lg bg-blue-50/10">
              <h4 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                Configure WiFi for {selectedDevice.name}
              </h4>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="device-name" className="text-blue-200">Device Name (Optional)</Label>
                  <Input
                    id="device-name"
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    placeholder={selectedDevice.name}
                    className="bg-white/10 border-blue-300 text-white placeholder:text-blue-200"
                  />
                </div>
                
                <div>
                  <Label htmlFor="wifi-ssid" className="text-blue-200">WiFi Network (SSID)</Label>
                  <Input
                    id="wifi-ssid"
                    value={ssid}
                    onChange={(e) => setSsid(e.target.value)}
                    placeholder="Enter WiFi network name"
                    className="bg-white/10 border-blue-300 text-white placeholder:text-blue-200"
                  />
                </div>
                
                <div>
                  <Label htmlFor="wifi-password" className="text-blue-200">WiFi Password</Label>
                  <div className="relative">
                    <Input
                      id="wifi-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter WiFi password"
                      className="bg-white/10 border-blue-300 text-white placeholder:text-blue-200 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-auto p-1 text-blue-200 hover:text-white"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                {error && (
                  <div className="text-red-400 text-sm bg-red-500/10 p-2 rounded">
                    {error}
                  </div>
                )}
                
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => connectAndConfigureWifi(selectedDevice)}
                    disabled={!ssid || !password || configuring}
                    className="flex-1"
                  >
                    {configuring ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Configuring...
                      </>
                    ) : (
                      <>
                        <Wifi className="h-4 w-4 mr-2" />
                        Configure & Add Device
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowWifiConfig(false);
                      setSelectedDevice(null);
                      resetForm();
                    }}
                    disabled={configuring}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
>>>>>>> main
      </DialogContent>
    </Dialog>
  )
}
