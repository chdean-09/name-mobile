"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { X, Bluetooth, Wifi, Search, CheckCircle, Loader2, Smartphone, Lock, ArrowRight } from "lucide-react"
import { BleClient, BleDevice } from '@capacitor-community/bluetooth-le';
import { CapacitorWifiConnect } from "@falconeta/capacitor-wifi-connect";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Keyboard } from '@capacitor/keyboard'
import { Heartbeat } from "./door-lock-dashboard";
import { getSignalStrength } from "@/lib/rssi";

interface PairingModalProps {
  isOpen: boolean
  onClose: () => void
  onDeviceAdded: () => void
  userEmail: string
  deviceStates: Record<string, Heartbeat>
}

interface BluetoothDevice {
  id: string
  name: string
  signal: number
  device: BleDevice
}

type PairingStep = "scanning" | "device-select" | "wifi-setup" | "connecting" | "success"

export function PairingModal({ isOpen, onClose, onDeviceAdded, userEmail, deviceStates }: PairingModalProps) {
  const [currentStep, setCurrentStep] = useState<PairingStep>("scanning")
  const [discoveredDevices, setDiscoveredDevices] = useState<BluetoothDevice[]>([])
  const [selectedDevice, setSelectedDevice] = useState<BluetoothDevice | null>(null)
  const [customName, setCustomName] = useState<string>("")
  const [wifiCredentials, setWifiCredentials] = useState({ ssid: "", password: "" })
  const [isScanning, setIsScanning] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<string | null>(null)
  // const [ssid, setSSID] = useState<string | null>(null)
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [waitingForHeartbeat, setWaitingForHeartbeat] = useState(false);

  const deviceService = 'f92a1d0c-cd74-40b9-b7c1-806d8fe67c81';

  useEffect(() => {
    if (isOpen && currentStep === "scanning") {
      startBluetoothScan()
    }
  }, [isOpen, currentStep])

  useEffect(() => {
    const getSSID = async () => {
      const data = await CapacitorWifiConnect.getDeviceSSID()
      setWifiCredentials((prev) => ({ ...prev, ssid: data.value }))
    }

    getSSID();
  })

  useEffect(() => {
    if (!waitingForHeartbeat) return;
    // Check if the deviceStates now includes the new device by name or id
    const found = Object.values(deviceStates).some(
      (d) => d.deviceName === customName // or d.deviceId === selectedDevice?.id
    );
    if (found) {
      setCurrentStep("success");
      setWaitingForHeartbeat(false);
    }
  }, [deviceStates, waitingForHeartbeat, customName]);

  useEffect(() => {
    const setupKeyboardListeners = async () => {
      const showListener = await Keyboard.addListener('keyboardWillShow', () => setKeyboardOpen(true));
      const hideListener = await Keyboard.addListener('keyboardWillHide', () => setKeyboardOpen(false));
      // For Android, also listen to 'keyboardDidShow'/'keyboardDidHide'
      const showListener2 = await Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true));
      const hideListener2 = await Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));

      return () => {
        showListener.remove();
        hideListener.remove();
        showListener2.remove();
        hideListener2.remove();
      };
    };

    let cleanup: (() => void) | undefined;
    setupKeyboardListeners().then((cleanupFn) => {
      cleanup = cleanupFn;
    });

    return () => {
      cleanup?.();
    };
  }, []);

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

  const startBluetoothScan = async () => {
    setIsScanning(true)
    setError(null)
    setDiscoveredDevices([])

    try {
      await ensureBluetoothOn();

      const discovered = new Map<string, BluetoothDevice>()

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
              signal: result.rssi ?? 0,
              device: result.device, // store the whole device
            })
          }
        }
      )

      setTimeout(async () => {
        await BleClient.stopLEScan()
        setDiscoveredDevices(Array.from(discovered.values()))
        setIsScanning(false)
        setCurrentStep("device-select")
      }, 3000)
    } catch (error) {
      console.error("Scan failed", error)
      setIsScanning(false)
    }
  }

  const selectDevice = (device: BluetoothDevice) => {
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }
    setCustomName(device.name)
    setSelectedDevice(device)
    setCurrentStep("wifi-setup")
  }

  const connectDevice = async (availableDevice: BluetoothDevice) => {
    setCurrentStep("connecting")

    try {
      await sendCredentialsOverBLE(availableDevice.device)
      console.log("Sending credentials over BLE...", wifiCredentials.ssid, wifiCredentials.password)

      await fetch("https://name-server-production.up.railway.app/api/device-list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: customName,
        })
      })

      setWaitingForHeartbeat(true);
    } catch (error) {
      console.error("❌ Failed to add device:", error)
    }
  }

  const sendCredentialsOverBLE = async (device: BleDevice) => {
    try {
      await BleClient.connect(device.deviceId)

      const service = "f92a1d0c-cd74-40b9-b7c1-806d8fe67c81"
      const characteristic = "4deee94e-85f5-4caf-a388-49182aaa1adb"

      const jsonPayload = JSON.stringify({
        ssid: wifiCredentials.ssid,
        pass: wifiCredentials.password,
        deviceName: customName,
        userEmail: userEmail
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

  const handleClose = () => {
    setCurrentStep("scanning")
    setDiscoveredDevices([])
    setSelectedDevice(null)
    setWifiCredentials({ ssid: "", password: "" })
    setError(null)
    onClose()
  }

  const renderStep = () => {
    switch (currentStep) {
      case "scanning":
        return (
          <div className="text-center py-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center"
            >
              <Bluetooth className="h-10 w-10 text-white" />
            </motion.div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Scanning for Devices</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">Make sure your smart lock is in pairing mode</p>

            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            >
              <Button
                onClick={startBluetoothScan}
                disabled={isScanning}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-2xl px-8"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Start Scan
                  </>
                )}
              </Button>
            </motion.div>
          </div>
        )

      case "device-select":
        return (
          <div className="flex flex-col h-[calc(100vh-200px)]">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Select Your Device</h3>
              <p className="text-slate-600 dark:text-slate-400">Found {discoveredDevices.length} device(s) nearby</p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {discoveredDevices.map((device) => {
                const signal = getSignalStrength(device.signal)
                return (
                  <motion.div
                    key={device.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all border-slate-700 hover:border-blue-600 bg-slate-800"`}
                    onClick={() => selectDevice(device)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                          <Lock className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900 dark:text-white">{device.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className={`text-xs ${signal.color} border-current`}>
                              {signal.strength}
                            </Badge>
                            <span className="text-xs text-slate-500">{device.signal} dBm</span>
                          </div>
                        </div>
                      </div>

                      <ArrowRight className="h-5 w-5 text-slate-400" />
                    </div>
                  </motion.div>
                )
              })}
            </div>

            <div className="pt-4">
              <Button onClick={() => {
                setCurrentStep("scanning")
                startBluetoothScan()
              }} variant="outline" className="w-full rounded-2xl bg-transparent">
                <Search className="h-4 w-4 mr-2" />
                Scan Again
              </Button>
            </div>
          </div>
        )

      case "wifi-setup":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                <Wifi className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Connect to Wi-Fi</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Enter your Wi-Fi credentials to connect {selectedDevice?.name}
              </p>
            </div>

            <div className="space-y-6 transition-all duration-300">
              <div>
                <Label htmlFor="name" className="text-sm font-medium">
                  Device Name (Ignore to use default name)
                </Label>
                <Input
                  id="name"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Enter Device name"
                  className="mt-1 rounded-2xl"
                />
              </div>

              <div>
                <Label htmlFor="ssid" className="text-sm font-medium">
                  Network Name (SSID)
                </Label>
                <Input
                  id="ssid"
                  value={wifiCredentials.ssid}
                  onChange={(e) => setWifiCredentials((prev) => ({ ...prev, ssid: e.target.value }))}
                  placeholder="Enter Wi-Fi network name"
                  className="mt-1 rounded-2xl"
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={wifiCredentials.password}
                  onChange={(e) => setWifiCredentials((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter Wi-Fi password"
                  className="mt-1 rounded-2xl"
                />
              </div>
            </div>

            <Button
              onClick={() => connectDevice(selectedDevice!)}
              disabled={!wifiCredentials.ssid || !wifiCredentials.password}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-2xl py-3"
            >
              <Wifi className="h-4 w-4 mr-2" />
              Connect Device
            </Button>
          </div>
        )

      case "connecting":
        return (
          <div className="text-center py-8">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
              className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center"
            >
              <Smartphone className="h-10 w-10 text-white" />
            </motion.div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Connecting Device</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">Setting up {customName}...</p>

            <div className="space-y-2 text-sm text-slate-500">
              <motion.div
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center gap-2"
              >
                <CheckCircle className="h-4 w-4 text-green-500" />
                Bluetooth connection established
              </motion.div>
              <motion.div
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="flex items-center justify-center gap-2"
              >
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                Configuring Wi-Fi settings
              </motion.div>
              <motion.div
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
                className="flex items-center justify-center gap-2"
              >
                <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                Connecting with the WebSocket server
              </motion.div>
              <motion.div
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 3 }}
                className="flex items-center justify-center gap-2"
              >
                <Loader2 className="h-4 w-4 animate-spin text-green-500" />
                Waiting for device heartbeat...
              </motion.div>
            </div>
          </div>
        )

      case "success":
        return (
          <div className="text-center py-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center"
            >
              <CheckCircle className="h-10 w-10 text-white" />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Device Added Successfully!</h3>
              <p className="text-slate-600 dark:text-slate-400">
                {customName} is now connected and ready to use
              </p>
            </motion.div>

            <Button
              className="mt-8 w-full rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 font-semibold text-lg"
              onClick={() => {
                onDeviceAdded()
                handleClose()
              }}
            >
              Check it out!
            </Button>
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
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-4 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                {/* Show Back button if not on scanning or device-select */}
                {(currentStep === "wifi-setup") && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full mr-2"
                    onClick={() => {
                      setCurrentStep("device-select");
                    }}
                  >
                    <ArrowRight className="h-5 w-5 rotate-180" />
                  </Button>
                )}
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Add New Device</h2>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full" onClick={handleClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
            <div className={`p-6 overflow-y-auto h-[80vh] ${keyboardOpen ? "max-h-[40vh] overflow-y-auto" : ""}`}>{renderStep()}</div>

            {/* Progress Indicator */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-center gap-2">
                {["scanning", "device-select", "wifi-setup", "connecting", "success"].map((step, index) => (
                  <motion.div
                    key={step}
                    className={`w-2 h-2 rounded-full transition-colors ${step === currentStep
                      ? "bg-blue-500"
                      : index <
                        ["scanning", "device-select", "wifi-setup", "connecting", "success"].indexOf(currentStep)
                        ? "bg-green-500"
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
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
