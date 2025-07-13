"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Wifi, Bluetooth, Eye, EyeOff, Check, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Keyboard } from "@capacitor/keyboard"
import { BleClient, BleDevice } from "@capacitor-community/bluetooth-le"
import { CapacitorWifiConnect } from "@falconeta/capacitor-wifi-connect"
import { Heartbeat } from "./door-lock-dashboard"

interface WiFiConfigModalProps {
  isOpen: boolean
  onClose: () => void
  deviceName: string
  email: string
  onConfigSent: () => void
  deviceStates: Record<string, Heartbeat>
}

type ConfigStep = "checking" | "available" | "unavailable" | "configuring" | "success" | "error"

export function WiFiConfigModal({ isOpen, onClose, email, deviceName, onConfigSent, deviceStates }: WiFiConfigModalProps) {
  const [currentStep, setCurrentStep] = useState<ConfigStep>("checking")
  const [ssid, setSsid] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [foundDevice, setFoundDevice] = useState<BleDevice | null>(null)
  const [waitingForHeartbeat, setWaitingForHeartbeat] = useState(false);

  const deviceService = 'f92a1d0c-cd74-40b9-b7c1-806d8fe67c81';

  useEffect(() => {
    if (isOpen) {
      setCurrentStep("checking")
      setPassword("")
      setShowPassword(false)
      setError(null)
      setFoundDevice(null)
      checkBluetoothDevice()
    }
  }, [isOpen])

  useEffect(() => {
    const getSSID = async () => {
      const data = await CapacitorWifiConnect.getDeviceSSID()
      setSsid(data.value || "")
    }

    getSSID();
  }, [])

  useEffect(() => {
    const setupKeyboardListeners = async () => {
      const showListener = await Keyboard.addListener('keyboardWillShow', (info) => {
        setKeyboardOpen(true);
        setKeyboardHeight(info.keyboardHeight || 300); // fallback if not provided
      });
      const hideListener = await Keyboard.addListener('keyboardWillHide', () => {
        setKeyboardOpen(false);
        setKeyboardHeight(0);
      });
      const showListener2 = await Keyboard.addListener('keyboardDidShow', (info) => {
        setKeyboardOpen(true);
        setKeyboardHeight(info.keyboardHeight || 300);
      });
      const hideListener2 = await Keyboard.addListener('keyboardDidHide', () => {
        setKeyboardOpen(false);
        setKeyboardHeight(0);
      });
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

  useEffect(() => {
    if (!waitingForHeartbeat) return;
    // Check if the deviceStates now includes the new device by name or id
    const found = Object.values(deviceStates).some(
      (d) => d.deviceName === deviceName // or d.deviceId === selectedDevice?.id
    );
    if (found) {
      setCurrentStep("success");
      setWaitingForHeartbeat(false);
      setTimeout(() => {
        onConfigSent();
        onClose();
      }, 2000);
    }
  }, [deviceStates, waitingForHeartbeat, deviceName]);

  const checkBluetoothDevice = async () => {
    setCurrentStep("checking");
    setError(null);
    setFoundDevice(null);
    try {
      await BleClient.initialize();
      let found: BleDevice | null = null;

      await BleClient.requestLEScan(
        { services: [deviceService], name: deviceName },
        (result) => {
          if (result) {
            found = result.device;
          }
        }
      );
      setTimeout(async () => {
        await BleClient.stopLEScan();
        if (found) {
          setFoundDevice(found);
          setCurrentStep("available");
        } else {
          setCurrentStep("unavailable");
        }
      }, 3000);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setCurrentStep("unavailable");
      setError("Bluetooth scan failed.");
    }
  };

  const sendCredentialsOverBLE = async () => {
    if (!foundDevice) return;
    setCurrentStep("configuring");
    setError(null);
    try {
      await BleClient.connect(foundDevice.deviceId);
      const characteristic = "4deee94e-85f5-4caf-a388-49182aaa1adb";
      const jsonPayload = JSON.stringify({
        ssid,
        pass: password,
        deviceName: deviceName,
        userEmail: email
      });
      const encoder = new TextEncoder();
      const data = encoder.encode(jsonPayload);
      const dataView = new DataView(data.buffer);
      await BleClient.write(foundDevice.deviceId, deviceService, characteristic, dataView);
      await BleClient.disconnect(foundDevice.deviceId);
      // setCurrentStep("success");
      // setTimeout(() => {
      //   onConfigSent();
      //   onClose();
      // }, 2000);
      setWaitingForHeartbeat(true);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setCurrentStep("error");
      setError("Failed to send credentials. Please try again.");
    }
  };

  // const handleConfigureWiFi = async () => {
  //   if (!ssid.trim() || !password.trim()) {
  //     setError("Please enter both SSID and password")
  //     return
  //   }

  //   setCurrentStep("configuring")
  //   setError(null)

  //   try {
  //     // Simulate WiFi configuration
  //     await new Promise((resolve, reject) => {
  //       setTimeout(() => {
  //         // 90% success rate
  //         if (Math.random() > 0.1) {
  //           resolve(true)
  //         } else {
  //           reject(new Error("Failed to configure WiFi"))
  //         }
  //       }, 3000)
  //     })

  //     setCurrentStep("success")
  //     setTimeout(() => {
  //       onConfigSent()
  //       onClose()
  //     }, 2000)
  //     // eslint-disable-next-line @typescript-eslint/no-unused-vars
  //   } catch (err) {
  //     setCurrentStep("error")
  //     setError("Failed to configure WiFi. Please try again.")
  //   }
  // }

  // const retryCheck = () => {
  //   setCurrentStep("checking")
  //   setTimeout(() => {
  //     const isAvailable = Math.random() > 0.2
  //     setCurrentStep(isAvailable ? "available" : "unavailable")
  //   }, 2000)
  // }

  const renderStep = () => {
    switch (currentStep) {
      case "checking":
        return (
          <div className="text-center py-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center"
            >
              <Bluetooth className="h-10 w-10 text-white" />
            </motion.div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Checking Device</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">Looking for {deviceName} via Bluetooth...</p>

            <div className="flex items-center justify-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                className="w-2 h-2 bg-blue-500 rounded-full"
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, delay: 0.2 }}
                className="w-2 h-2 bg-blue-500 rounded-full"
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, delay: 0.4 }}
                className="w-2 h-2 bg-blue-500 rounded-full"
              />
            </div>
          </div>
        )

      case "available":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                <Bluetooth className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Device Found</h3>
              <p className="text-slate-600 dark:text-slate-400">{deviceName} is ready for WiFi configuration</p>
              <Badge className="mt-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                <Bluetooth className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="wifi-ssid" className="text-sm font-medium">
                  WiFi Network (SSID)
                </Label>
                <Input
                  id="wifi-ssid"
                  defaultValue={ssid}
                  onChange={(e) => setSsid(e.target.value)}
                  placeholder="Enter WiFi network name (2.4GHz Only)"
                  className="mt-1 rounded-2xl"
                />
              </div>

              <div>
                <Label htmlFor="wifi-password" className="text-sm font-medium">
                  WiFi Password
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="wifi-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter WiFi password"
                    className="rounded-2xl pr-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-slate-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-slate-500" />
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950 rounded-2xl text-red-600 dark:text-red-400"
                >
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </motion.div>
              )}
            </div>

            <Button
              onClick={() => sendCredentialsOverBLE()}
              disabled={!ssid.trim() || !password.trim()}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-2xl py-3"
            >
              <Wifi className="h-4 w-4 mr-2" />
              Configure WiFi
            </Button>
          </div>
        )

      case "unavailable":
        return (
          <div className="text-center py-8">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
              <AlertCircle className="h-10 w-10 text-white" />
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Device Not Found</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-sm mx-auto">
              Unable to connect to {deviceName} via Bluetooth. Make sure the device is nearby and powered on.
            </p>

            <div className="space-y-3">
              <Button
                onClick={checkBluetoothDevice}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-2xl"
              >
                <Bluetooth className="h-4 w-4 mr-2" />
                Try Again
              </Button>

              <div className="text-xs text-slate-500 space-y-1">
                <p>• Ensure the device is within 10 feet</p>
                <p>• Check if the device is powered on</p>
                <p>• Try restarting the device</p>
              </div>
            </div>
          </div>
        )

      case "configuring":
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
              <Wifi className="h-10 w-10 text-white" />
            </motion.div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Configuring WiFi</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">Sending WiFi credentials to {deviceName}...</p>

            <div className="space-y-2 text-sm text-slate-500">
              <motion.div
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center gap-2"
              >
                <Check className="h-4 w-4 text-green-500" />
                Bluetooth connection established
              </motion.div>
              <motion.div
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="flex items-center justify-center gap-2"
              >
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                Sending WiFi credentials
              </motion.div>
              <motion.div
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
                className="flex items-center justify-center gap-2"
              >
                <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                Waiting for device confirmation
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
              <Check className="h-10 w-10 text-white" />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">WiFi Configured!</h3>
              <p className="text-slate-600 dark:text-slate-400">
                {deviceName} has been successfully connected to your WiFi network
              </p>
            </motion.div>
          </div>
        )

      case "error":
        return (
          <div className="text-center py-8">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
              <AlertCircle className="h-10 w-10 text-white" />
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Configuration Failed</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {error || "Unable to configure WiFi. Please try again."}
            </p>

            <div className="space-y-3">
              <Button
                onClick={() => setCurrentStep("available")}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-2xl"
              >
                Try Again
              </Button>

              <Button variant="outline" onClick={onClose} className="w-full rounded-2xl bg-transparent">
                Cancel
              </Button>
            </div>
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
            className="fixed inset-x-0 top-0 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl z-50 overflow-hidden"
            style={
              keyboardOpen && keyboardHeight
                ? { bottom: keyboardHeight, maxHeight: `calc(100vh - ${keyboardHeight}px)`, height: "auto", marginTop: "env(safe-area-inset-top)" }
                : { bottom: 0, maxHeight: "calc(100vh - 0px)", height: "auto", marginTop: "env(safe-area-inset-top)" }
            }
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">WiFi Configuration</h2>
              <Button variant="ghost" size="icon" className="rounded-full" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
            <div className={`p-6 overflow-y-auto ${keyboardOpen ? "max-h-[40vh]" : ""}`}>{renderStep()}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
